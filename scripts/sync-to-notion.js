#!/usr/bin/env node

/**
 * ORCHESTRAI SERP Tracker - Notion Sync Script
 *
 * Syncs tracking data from PostgreSQL to Notion databases
 * Creates and updates pages in the configured Notion workspace
 *
 * Usage:
 *   node sync-to-notion.js [options]
 *
 * Options:
 *   --project <id>        Sync specific project only
 *   --force              Force update all entries
 *   --test               Test connection without making changes
 *   --setup              Create initial database structure in Notion
 *
 * Examples:
 *   node sync-to-notion.js --test
 *   node sync-to-notion.js --project drnl-A0582FF4-6715-4266-9A54-A7E311912E41
 *   node sync-to-notion.js --force
 *
 * @version 1.0.0
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Client } = require('@notionhq/client');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs').promises;

class NotionSync {
  constructor() {
    this.config = null;
    this.db = null;
    this.notion = null;
    this.stats = {
      keywordsCreated: 0,
      keywordsUpdated: 0,
      historyCreated: 0,
      alertsCreated: 0,
      errors: []
    };
  }

  async init() {
    // Load configuration
    const configPath = path.join(__dirname, '../config/tracking-config.json');
    const configData = await fs.readFile(configPath, 'utf8');
    this.config = JSON.parse(configData).trackingConfig;

    if (!this.config.notionConfig?.enabled) {
      throw new Error('Notion sync is not enabled in configuration');
    }

    // Initialize Notion client
    if (!process.env.NOTION_TOKEN) {
      throw new Error('NOTION_TOKEN environment variable not set');
    }

    this.notion = new Client({ auth: process.env.NOTION_TOKEN });

    // Initialize PostgreSQL
    this.db = new Pool({
      user: process.env.POSTGRES_USER || 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DATABASE || 'orchestrai_serp',
      password: process.env.POSTGRES_PASSWORD || '',
      port: process.env.POSTGRES_PORT || 5432,
    });

    // Test database connection
    const client = await this.db.connect();
    await client.query('SELECT NOW()');
    client.release();

    console.log('✅ Notion sync initialized');
  }

  async testConnection() {
    console.log('🧪 Testing Notion API connection...');

    try {
      // Test API access
      const response = await this.notion.users.me({});
      console.log(`✅ Connected as: ${response.name || 'Notion User'}`);

      // Test database access
      const dbIds = this.config.notionConfig.databaseIds;

      if (!dbIds.keywords) {
        console.log('⚠️  Warning: Keywords database ID not configured');
        return false;
      }

      console.log('🔍 Testing database access...');
      const database = await this.notion.databases.retrieve({
        database_id: dbIds.keywords
      });

      console.log(`✅ Keywords database found: "${database.title[0]?.plain_text || 'Untitled'}"`);

      return true;

    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
  }

  async syncKeywords(projectId = null) {
    console.log('🔄 Syncing keywords to Notion...');

    const client = await this.db.connect();

    try {
      // Fetch latest positions
      let query = `
        SELECT
          tk.id,
          tk.keyword,
          tk.project_id,
          tk.project_name,
          tk.priority,
          tk.target_position,
          tk.search_volume,
          tk.tracking_frequency,
          lp.current_position,
          lp.last_checked,
          pc.position_change,
          pc.trend
        FROM tracked_keywords tk
        LEFT JOIN v_latest_positions lp ON tk.id = lp.id
        LEFT JOIN v_position_changes_7d pc ON tk.id = pc.id
        WHERE tk.is_active = true
      `;

      const params = [];
      if (projectId) {
        params.push(projectId);
        query += ` AND tk.project_id = $1`;
      }

      query += ` ORDER BY tk.project_name, tk.priority DESC`;

      const result = await client.query(query, params);
      console.log(`📊 Found ${result.rows.length} keywords to sync`);

      // Sync each keyword to Notion
      for (const keyword of result.rows) {
        try {
          await this.syncKeywordToNotion(keyword);
        } catch (error) {
          this.stats.errors.push({
            keyword: keyword.keyword,
            error: error.message
          });
          console.error(`✗ ${keyword.keyword}:`, error.message);
        }
      }

      console.log(`✅ Synced ${this.stats.keywordsCreated + this.stats.keywordsUpdated} keywords`);
      console.log(`   Created: ${this.stats.keywordsCreated}`);
      console.log(`   Updated: ${this.stats.keywordsUpdated}`);

    } finally {
      client.release();
    }
  }

  async syncKeywordToNotion(keyword) {
    const dbId = this.config.notionConfig.databaseIds.keywords;

    if (!dbId) {
      throw new Error('Keywords database ID not configured');
    }

    // Calculate change emoji
    let trendEmoji = '→';
    if (keyword.trend === 'improved') trendEmoji = '↗️';
    else if (keyword.trend === 'declined') trendEmoji = '↘️';

    // Prepare properties
    const properties = {
      'Keyword': {
        title: [{ text: { content: keyword.keyword } }]
      },
      'Project': {
        select: { name: keyword.project_name }
      },
      'Priority': {
        select: { name: this.capitalize(keyword.priority) }
      },
      'Current Position': {
        number: keyword.current_position || null
      },
      'Target Position': {
        number: keyword.target_position || null
      },
      'Search Volume': {
        number: keyword.search_volume || null
      },
      'Tracking Frequency': {
        select: { name: this.capitalize(keyword.tracking_frequency) }
      },
      'Last Checked': {
        date: keyword.last_checked ? { start: keyword.last_checked } : null
      },
      'Status': {
        select: { name: 'Active' }
      },
      'Trend': {
        select: { name: `${trendEmoji} ${keyword.trend || 'Stable'}` }
      }
    };

    // Check if page already exists
    const existingPages = await this.notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Keyword',
        title: {
          equals: keyword.keyword
        }
      }
    });

    if (existingPages.results.length > 0) {
      // Update existing page
      await this.notion.pages.update({
        page_id: existingPages.results[0].id,
        properties
      });
      this.stats.keywordsUpdated++;
      console.log(`✓ Updated: ${keyword.keyword}`);

    } else {
      // Create new page
      await this.notion.pages.create({
        parent: { database_id: dbId },
        properties
      });
      this.stats.keywordsCreated++;
      console.log(`+ Created: ${keyword.keyword}`);
    }
  }

  async syncAlerts(projectId = null) {
    console.log('🔔 Syncing alerts to Notion...');

    const client = await this.db.connect();

    try {
      // Fetch unread alerts from last 7 days
      let query = `
        SELECT
          a.*,
          tk.keyword,
          tk.project_id,
          tk.project_name
        FROM tracking_alerts a
        INNER JOIN tracked_keywords tk ON a.keyword_id = tk.id
        WHERE a.is_read = false
          AND a.triggered_at >= NOW() - INTERVAL '7 days'
      `;

      const params = [];
      if (projectId) {
        params.push(projectId);
        query += ` AND tk.project_id = $1`;
      }

      query += ` ORDER BY a.triggered_at DESC`;

      const result = await client.query(query, params);
      console.log(`🔔 Found ${result.rows.length} new alerts`);

      const dbId = this.config.notionConfig.databaseIds.alerts;

      if (!dbId) {
        console.log('⚠️  Alerts database ID not configured, skipping alert sync');
        return;
      }

      for (const alert of result.rows) {
        try {
          await this.syncAlertToNotion(alert, dbId);
          this.stats.alertsCreated++;
        } catch (error) {
          console.error(`✗ Alert ${alert.id}:`, error.message);
        }
      }

      console.log(`✅ Synced ${this.stats.alertsCreated} alerts`);

    } finally {
      client.release();
    }
  }

  async syncAlertToNotion(alert, dbId) {
    const alertTypeMap = {
      'critical': '🔴 Critical',
      'warning': '⚠️ Warning',
      'opportunity': '💡 Opportunity',
      'competitor': '👁️ Competitor'
    };

    await this.notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        'Alert Title': {
          title: [{ text: { content: `${alert.keyword} - ${alertTypeMap[alert.alert_type]}` } }]
        },
        'Alert Type': {
          select: { name: alertTypeMap[alert.alert_type] }
        },
        'Old Position': {
          number: alert.old_position
        },
        'New Position': {
          number: alert.new_position
        },
        'Message': {
          rich_text: [{ text: { content: alert.message } }]
        },
        'Triggered Date': {
          date: { start: alert.triggered_at.toISOString().split('T')[0] }
        },
        'Status': {
          select: { name: '🆕 New' }
        },
        'Priority': {
          select: { name: alert.alert_type === 'critical' ? 'High' : 'Medium' }
        }
      }
    });

    console.log(`+ Alert created: ${alert.keyword}`);
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  getStats() {
    return this.stats;
  }

  async close() {
    if (this.db) {
      await this.db.end();
    }
  }
}

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    project: null,
    force: false,
    test: false,
    setup: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--project':
        options.project = args[++i];
        break;
      case '--force':
        options.force = true;
        break;
      case '--test':
        options.test = true;
        break;
      case '--setup':
        options.setup = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
      default:
        console.error(`Unknown option: ${args[i]}`);
        process.exit(1);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
ORCHESTRAI SERP Tracker - Notion Sync

Usage: node sync-to-notion.js [options]

Options:
  --project <id>        Sync specific project only
  --force              Force update all entries
  --test               Test connection without making changes
  --setup              Create initial database structure
  --help               Show this help message

Examples:
  # Test connection
  node sync-to-notion.js --test

  # Sync one project
  node sync-to-notion.js --project drnl-A0582FF4-6715-4266-9A54-A7E311912E41

  # Force update all data
  node sync-to-notion.js --force

Environment Variables Required:
  POSTGRES_USER          PostgreSQL username
  POSTGRES_PASSWORD      PostgreSQL password
  POSTGRES_DATABASE      Database name
  NOTION_TOKEN           Notion API token

Configuration Required:
  Update tracking-config.json with your Notion database IDs:
  {
    "notionConfig": {
      "enabled": true,
      "databaseIds": {
        "keywords": "your-keywords-database-id",
        "positionHistory": "your-history-database-id",
        "competitors": "your-competitors-database-id",
        "alerts": "your-alerts-database-id"
      }
    }
  }

Setup Instructions:
  1. Create databases in Notion (see NOTION-DATABASE-SETUP.md)
  2. Get database IDs from Notion URLs
  3. Update tracking-config.json with IDs
  4. Run with --test to verify connection
  5. Run without flags to perform full sync
  `);
}

async function main() {
  const options = parseArgs();
  const sync = new NotionSync();

  console.log('='.repeat(70));
  console.log('  ORCHESTRAI SERP Tracker - Notion Sync');
  console.log('='.repeat(70));
  console.log('');

  try {
    await sync.init();

    if (options.test) {
      // Test mode
      const success = await sync.testConnection();

      if (success) {
        console.log('');
        console.log('✅ Connection test passed');
        console.log('💡 Remove --test flag to perform actual sync');
      } else {
        console.log('');
        console.log('❌ Connection test failed');
        console.log('📖 See --help for setup instructions');
        process.exit(1);
      }

    } else {
      // Sync mode
      console.log('🔄 Starting Notion sync...');
      console.log('');

      await sync.syncKeywords(options.project);
      console.log('');
      await sync.syncAlerts(options.project);

      console.log('');
      console.log('─'.repeat(70));
      console.log('📊 SYNC SUMMARY');
      console.log('─'.repeat(70));

      const stats = sync.getStats();
      console.log(`Keywords Created:  ${stats.keywordsCreated}`);
      console.log(`Keywords Updated:  ${stats.keywordsUpdated}`);
      console.log(`Alerts Created:    ${stats.alertsCreated}`);

      if (stats.errors.length > 0) {
        console.log(`Errors:            ${stats.errors.length}`);
        console.log('');
        console.log('⚠️ ERRORS:');
        stats.errors.forEach(err => {
          console.log(`   ${err.keyword}: ${err.error}`);
        });
      }

      console.log('');
      console.log('✅ SYNC COMPLETED');
    }

  } catch (error) {
    console.error('');
    console.error('❌ SYNC FAILED');
    console.error('Error:', error.message);
    console.error('');
    if (error.code === 'unauthorized') {
      console.error('Check your NOTION_TOKEN in .env file');
    } else if (error.code === 'object_not_found') {
      console.error('Check your database IDs in tracking-config.json');
    }
    console.error('');
    process.exit(1);

  } finally {
    await sync.close();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { NotionSync };
