#!/usr/bin/env node

/**
 * ORCHESTRAI SERP Tracker - CLI Dashboard
 *
 * Beautiful command-line dashboard for viewing SERP tracking data
 * Displays positions, alerts, trends, and optimization opportunities
 *
 * Usage:
 *   node dashboard.js [options]
 *
 * Options:
 *   --project <id>        Show specific project only
 *   --alerts              Show alerts only
 *   --summary             Show summary only
 *   --opportunities       Show optimization opportunities
 *
 * Examples:
 *   node dashboard.js
 *   node dashboard.js --project drnl-A0582FF4-6715-4266-9A54-A7E311912E41
 *   node dashboard.js --alerts
 *
 * @version 1.0.0
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs').promises;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Text colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

class Dashboard {
  constructor() {
    this.db = null;
    this.config = null;
  }

  async init() {
    // Initialize database
    this.db = new Pool({
      user: process.env.POSTGRES_USER || 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DATABASE || 'orchestrai_serp',
      password: process.env.POSTGRES_PASSWORD || '',
      port: process.env.POSTGRES_PORT || 5432,
    });

    // Test connection
    const client = await this.db.connect();
    await client.query('SELECT NOW()');
    client.release();

    // Load config
    const configPath = path.join(__dirname, '../config/tracking-config.json');
    const configData = await fs.readFile(configPath, 'utf8');
    this.config = JSON.parse(configData).trackingConfig;
  }

  // Formatting helpers
  colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
  }

  bold(text) {
    return `${colors.bright}${text}${colors.reset}`;
  }

  dim(text) {
    return `${colors.dim}${text}${colors.reset}`;
  }

  formatPosition(position) {
    if (!position) return this.colorize('N/A', 'gray');

    if (position <= 3) return this.colorize(`#${position}`, 'green') + ' 🥇';
    if (position <= 10) return this.colorize(`#${position}`, 'cyan') + ' 🏆';
    if (position <= 20) return this.colorize(`#${position}`, 'yellow') + ' ⭐';
    if (position <= 50) return this.colorize(`#${position}`, 'yellow');
    return this.colorize(`#${position}`, 'red');
  }

  formatChange(change) {
    if (!change || change === 0) return this.colorize('→ 0', 'gray');
    if (change > 0) return this.colorize(`↑ +${change}`, 'green');
    return this.colorize(`↓ ${change}`, 'red');
  }

  formatDistance(distance) {
    if (distance === null || distance === undefined) return this.dim('N/A');
    if (distance === 0) return this.colorize('✓ At target', 'green');
    if (distance > 0) return this.colorize(`${distance} away`, 'yellow');
    return this.colorize(`${Math.abs(distance)} above`, 'green');
  }

  padRight(str, length) {
    const cleanStr = str.replace(/\x1b\[[0-9;]*m/g, '');
    const padding = length - cleanStr.length;
    return str + ' '.repeat(Math.max(0, padding));
  }

  // Main dashboard display
  async showDashboard(projectId = null) {
    console.log('');
    console.log(this.colorize('═'.repeat(80), 'cyan'));
    console.log(this.bold('  📊 ORCHESTRAI SERP Tracker Dashboard'));
    console.log(this.colorize('═'.repeat(80), 'cyan'));
    console.log('');

    // Get latest positions
    const positions = await this.getLatestPositions(projectId);

    if (positions.length === 0) {
      console.log(this.colorize('  ℹ️  No tracking data yet. Run tracking first:', 'yellow'));
      console.log('  node orchestrai-domains/seo/scripts/track-priority-keywords.js --priority high');
      console.log('');
      return;
    }

    // Group by project
    const byProject = {};
    positions.forEach(pos => {
      if (!byProject[pos.project_name]) {
        byProject[pos.project_name] = [];
      }
      byProject[pos.project_name].push(pos);
    });

    // Display each project
    for (const [projectName, keywords] of Object.entries(byProject)) {
      await this.displayProject(projectName, keywords);
    }

    // Display summary
    await this.displaySummary(positions);

    // Display alerts
    await this.displayAlerts(projectId);

    // Display opportunities
    await this.displayOpportunities(projectId);

    console.log('');
    console.log(this.dim('  Last updated: ' + new Date().toLocaleString()));
    console.log('');
  }

  async displayProject(projectName, keywords) {
    console.log('');
    console.log(this.bold(`  📁 ${projectName}`));
    console.log(this.colorize('  ' + '─'.repeat(78), 'gray'));
    console.log('');

    // Table header
    const header =
      this.padRight('  Keyword', 40) +
      this.padRight('Position', 15) +
      this.padRight('Target', 10) +
      this.padRight('Change', 12) +
      'Status';

    console.log(this.dim(header));
    console.log(this.dim('  ' + '─'.repeat(78)));

    // Sort by priority then position
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    keywords.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return (a.current_position || 999) - (b.current_position || 999);
    });

    // Display each keyword
    for (const kw of keywords) {
      const keyword = this.padRight(`  ${kw.keyword}`, 40);
      const position = this.padRight(this.formatPosition(kw.current_position), 15);
      const target = this.padRight(`#${kw.target_position || 'N/A'}`, 10);
      const change = this.padRight(this.formatChange(kw.position_change), 12);
      const distance = this.formatDistance(kw.target_position - kw.current_position);

      console.log(keyword + position + target + change + distance);
    }

    console.log('');
  }

  async displaySummary(positions) {
    console.log('');
    console.log(this.bold('  📈 Summary Statistics'));
    console.log(this.colorize('  ' + '─'.repeat(78), 'gray'));
    console.log('');

    const total = positions.length;
    const top3 = positions.filter(p => p.current_position && p.current_position <= 3).length;
    const top10 = positions.filter(p => p.current_position && p.current_position <= 10).length;
    const top20 = positions.filter(p => p.current_position && p.current_position <= 20).length;
    const notRanking = positions.filter(p => !p.current_position || p.current_position > 100).length;

    const avgPosition = positions
      .filter(p => p.current_position)
      .reduce((sum, p) => sum + p.current_position, 0) /
      (positions.filter(p => p.current_position).length || 1);

    console.log(`  Total Keywords Tracked:  ${this.bold(total)}`);
    console.log(`  Average Position:        ${this.bold(avgPosition.toFixed(1))}`);
    console.log('');
    console.log(`  ${this.colorize('🥇 Top 3:', 'green')}       ${this.bold(top3)} keywords`);
    console.log(`  ${this.colorize('🏆 Top 10:', 'cyan')}      ${this.bold(top10)} keywords`);
    console.log(`  ${this.colorize('⭐ Top 20:', 'yellow')}      ${this.bold(top20)} keywords`);
    console.log(`  ${this.colorize('❌ Not Ranking:', 'red')}  ${this.bold(notRanking)} keywords`);
    console.log('');
  }

  async displayAlerts(projectId = null) {
    const client = await this.db.connect();

    try {
      let query = `
        SELECT
          a.*,
          tk.keyword,
          tk.project_name
        FROM tracking_alerts a
        JOIN tracked_keywords tk ON a.keyword_id = tk.id
        WHERE a.is_read = false
      `;

      const params = [];
      if (projectId) {
        params.push(projectId);
        query += ` AND tk.project_id = $1`;
      }

      query += ` ORDER BY a.triggered_at DESC LIMIT 10`;

      const result = await client.query(query, params);

      if (result.rows.length === 0) {
        console.log(this.colorize('  ✅ No active alerts - everything looking good!', 'green'));
        console.log('');
        return;
      }

      console.log('');
      console.log(this.bold('  🔔 Active Alerts'));
      console.log(this.colorize('  ' + '─'.repeat(78), 'gray'));
      console.log('');

      for (const alert of result.rows) {
        const typeIcons = {
          critical: '🔴',
          warning: '⚠️',
          opportunity: '💡',
          competitor: '👁️'
        };

        const icon = typeIcons[alert.alert_type] || '📌';
        const date = new Date(alert.triggered_at).toLocaleDateString();

        console.log(`  ${icon} ${this.bold(alert.keyword)} (${alert.project_name})`);
        console.log(`     ${alert.message}`);
        console.log(this.dim(`     ${date}`));
        console.log('');
      }

    } finally {
      client.release();
    }
  }

  async displayOpportunities(projectId = null) {
    const client = await this.db.connect();

    try {
      let query = `
        SELECT
          tk.keyword,
          tk.project_name,
          tk.target_position,
          ph.position as current_position,
          tk.search_volume,
          (tk.target_position - ph.position) as distance
        FROM tracked_keywords tk
        LEFT JOIN LATERAL (
          SELECT position
          FROM position_history
          WHERE keyword_id = tk.id
          ORDER BY date DESC
          LIMIT 1
        ) ph ON true
        WHERE tk.is_active = true
          AND ph.position IS NOT NULL
          AND ph.position > tk.target_position
          AND ph.position <= 20
      `;

      const params = [];
      if (projectId) {
        params.push(projectId);
        query += ` AND tk.project_id = $1`;
      }

      query += `
        ORDER BY
          CASE
            WHEN ph.position <= 10 THEN 1
            WHEN ph.position <= 20 THEN 2
            ELSE 3
          END,
          tk.search_volume DESC
        LIMIT 5
      `;

      const result = await client.query(query, params);

      if (result.rows.length === 0) {
        return;
      }

      console.log('');
      console.log(this.bold('  💡 Top Optimization Opportunities'));
      console.log(this.colorize('  ' + '─'.repeat(78), 'gray'));
      console.log('');

      for (const opp of result.rows) {
        const potential = opp.current_position <= 10 ? 'HIGH' : 'MEDIUM';
        const potentialColor = potential === 'HIGH' ? 'green' : 'yellow';

        console.log(`  ${this.bold(opp.keyword)} (${opp.project_name})`);
        console.log(`     Current: ${this.formatPosition(opp.current_position)} | Target: #${opp.target_position} | ${this.colorize(`Potential: ${potential}`, potentialColor)}`);
        console.log(`     Search Volume: ${opp.search_volume || 'N/A'}/month`);
        console.log('');
      }

    } finally {
      client.release();
    }
  }

  async getLatestPositions(projectId = null) {
    const client = await this.db.connect();

    try {
      let query = `
        SELECT
          tk.id,
          tk.keyword,
          tk.project_name,
          tk.priority,
          tk.target_position,
          ph.position as current_position,
          ph.date as last_checked,
          pc.position_change
        FROM tracked_keywords tk
        LEFT JOIN LATERAL (
          SELECT position, date
          FROM position_history
          WHERE keyword_id = tk.id
          ORDER BY date DESC
          LIMIT 1
        ) ph ON true
        LEFT JOIN LATERAL (
          SELECT
            COALESCE(
              (SELECT position FROM position_history WHERE keyword_id = tk.id ORDER BY date DESC LIMIT 1 OFFSET 1),
              ph.position
            ) - ph.position as position_change
        ) pc ON true
        WHERE tk.is_active = true
      `;

      const params = [];
      if (projectId) {
        params.push(projectId);
        query += ` AND tk.project_id = $1`;
      }

      query += ` ORDER BY tk.project_name, tk.priority DESC`;

      const result = await client.query(query, params);
      return result.rows;

    } finally {
      client.release();
    }
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
    alertsOnly: false,
    summaryOnly: false,
    opportunitiesOnly: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--project':
        options.project = args[++i];
        break;
      case '--alerts':
        options.alertsOnly = true;
        break;
      case '--summary':
        options.summaryOnly = true;
        break;
      case '--opportunities':
        options.opportunitiesOnly = true;
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
ORCHESTRAI SERP Tracker - CLI Dashboard

Usage: node dashboard.js [options]

Options:
  --project <id>        Show specific project only
  --alerts              Show alerts only
  --summary             Show summary only
  --opportunities       Show optimization opportunities only
  --help                Show this help message

Examples:
  # Show full dashboard
  node dashboard.js

  # Show specific project
  node dashboard.js --project drnl-A0582FF4-6715-4266-9A54-A7E311912E41

  # Show only alerts
  node dashboard.js --alerts
  `);
}

async function main() {
  const options = parseArgs();
  const dashboard = new Dashboard();

  try {
    await dashboard.init();
    await dashboard.showDashboard(options.project);

  } catch (error) {
    console.error('');
    console.error('❌ Dashboard Error:', error.message);
    console.error('');
    process.exit(1);

  } finally {
    await dashboard.close();
  }
}

// Run the dashboard
if (require.main === module) {
  main();
}

module.exports = Dashboard;
