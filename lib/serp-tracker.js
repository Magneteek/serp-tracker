/**
 * ORCHESTRAI SERP Tracker - Core Library
 *
 * Comprehensive SERP position tracking system integrating:
 * - Google Search Console MCP (actual performance data)
 * - DataForSEO MCP (precise position tracking)
 * - PostgreSQL (time-series storage)
 * - Notion (client dashboards)
 *
 * @module serp-tracker
 * @version 1.0.0
 */

const { Pool } = require('pg');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;

class SERPTracker {
  constructor(options = {}) {
    this.config = null;
    this.db = null;
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hour default

    // API client placeholders (will be initialized in init())
    this.dataForSEOClient = null;
    this.notionClient = null;

    // Statistics tracking
    this.stats = {
      keywordsTracked: 0,
      positionsUpdated: 0,
      alertsGenerated: 0,
      apiCallsMade: 0,
      errors: []
    };
  }

  /**
   * Initialize the SERP tracker with configuration and database connection
   */
  async init() {
    try {
      // Load configuration
      const configPath = path.join(__dirname, '../config/tracking-config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      this.config = JSON.parse(configData).trackingConfig;

      // Initialize PostgreSQL connection pool
      this.db = new Pool({
        user: process.env.POSTGRES_USER || 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        database: process.env.POSTGRES_DATABASE || 'orchestrai_serp',
        password: process.env.POSTGRES_PASSWORD || '',
        port: process.env.POSTGRES_PORT || 5432,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test database connection
      const client = await this.db.connect();
      await client.query('SELECT NOW()');
      client.release();

      // Initialize DataForSEO client
      this.dataForSEOClient = axios.create({
        baseURL: 'https://api.dataforseo.com/v3',
        auth: {
          username: process.env.DATAFORSEO_USERNAME,
          password: process.env.DATAFORSEO_PASSWORD
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      // Initialize Notion client (if enabled)
      if (this.config.notionConfig?.enabled && process.env.NOTION_TOKEN) {
        const { Client } = require('@notionhq/client');
        this.notionClient = new Client({ auth: process.env.NOTION_TOKEN });
      }

      console.log('✅ SERP Tracker initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize SERP Tracker:', error.message);
      throw error;
    }
  }

  /**
   * Import keywords from configuration to database
   * @param {string} projectId - Optional project ID to import (or all if not specified)
   */
  async importKeywordsFromConfig(projectId = null) {
    const client = await this.db.connect();
    let imported = 0;
    let skipped = 0;

    try {
      await client.query('BEGIN');

      const projects = projectId
        ? { [projectId]: this.config.projects[projectId] }
        : this.config.projects;

      for (const [pid, projectData] of Object.entries(projects)) {
        console.log(`📥 Importing keywords for ${projectData.name}...`);

        for (const [priority, keywords] of Object.entries(projectData.keywords)) {
          for (const kw of keywords) {
            const result = await client.query(`
              INSERT INTO tracked_keywords (
                keyword, project_id, project_name, priority,
                search_volume, target_position, tracking_frequency,
                location_code, location_name, device, is_active
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              ON CONFLICT (keyword, project_id, device, location_code)
              DO UPDATE SET
                priority = EXCLUDED.priority,
                search_volume = EXCLUDED.search_volume,
                target_position = EXCLUDED.target_position,
                tracking_frequency = EXCLUDED.tracking_frequency,
                updated_at = NOW()
              RETURNING id, (xmax = 0) as inserted
            `, [
              kw.keyword,
              pid,
              projectData.name,
              priority,
              kw.searchVolume || null,
              kw.targetPosition || null,
              kw.trackingFrequency || priority === 'high' ? 'daily' : 'weekly',
              projectData.location?.code || this.config.defaultSettings.locationCode,
              projectData.location?.name || this.config.defaultSettings.locationName,
              this.config.defaultSettings.device,
              true
            ]);

            if (result.rows[0].inserted) {
              imported++;
            } else {
              skipped++;
            }
          }
        }
      }

      await client.query('COMMIT');
      console.log(`✅ Import complete: ${imported} new, ${skipped} updated`);

      return { imported, skipped };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Import failed:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Track keywords by priority level
   * @param {string} priority - Priority level: 'high', 'medium', or 'low'
   * @param {string} projectId - Optional project ID filter
   */
  async trackKeywordsByPriority(priority, projectId = null) {
    const startTime = Date.now();
    console.log(`🔍 Starting ${priority} priority tracking...`);

    try {
      // Fetch keywords to track
      const keywords = await this.getKeywordsToTrack(priority, projectId);
      console.log(`📋 Found ${keywords.length} keywords to track`);

      if (keywords.length === 0) {
        console.log('ℹ️ No keywords to track');
        return { success: 0, failed: 0 };
      }

      // Start sync log
      const syncLogId = await this.createSyncLog('dataforseo', projectId, keywords.length);

      // Process keywords in batches
      const batchSize = this.config.apiLimits.dataForSEO.batchSize;
      const results = { success: 0, failed: 0, errors: [] };

      for (let i = 0; i < keywords.length; i += batchSize) {
        const batch = keywords.slice(i, i + batchSize);
        console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(keywords.length/batchSize)}`);

        try {
          await this.trackKeywordBatch(batch);
          results.success += batch.length;
        } catch (error) {
          results.failed += batch.length;
          results.errors.push({
            batch: Math.floor(i/batchSize) + 1,
            error: error.message
          });
          console.error(`❌ Batch failed:`, error.message);
        }

        // Rate limiting delay
        if (i + batchSize < keywords.length) {
          await this.sleep(this.config.apiLimits.dataForSEO.delayBetweenBatches);
        }
      }

      // Complete sync log
      await this.completeSyncLog(syncLogId, results.success, results.failed, results.errors);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Tracking complete in ${duration}s: ${results.success} success, ${results.failed} failed`);

      // Generate alerts for significant changes
      await this.generateAlerts(keywords.map(k => k.id));

      return results;

    } catch (error) {
      console.error('❌ Tracking failed:', error.message);
      throw error;
    }
  }

  /**
   * Track a batch of keywords
   * @private
   */
  async trackKeywordBatch(keywords) {
    for (const keyword of keywords) {
      try {
        // Check cache first
        const cacheKey = `${keyword.keyword}:${keyword.location_code}:${keyword.device}`;
        const cached = this.cache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
          console.log(`💾 Using cached data for: ${keyword.keyword}`);
          await this.savePosition(keyword.id, cached.data);
          continue;
        }

        // Fetch from DataForSEO
        const position = await this.fetchPositionFromDataForSEO(
          keyword.keyword,
          keyword.location_code,
          keyword.device
        );

        // Cache the result
        this.cache.set(cacheKey, {
          data: position,
          timestamp: Date.now()
        });

        // Save to database
        await this.savePosition(keyword.id, position);

        this.stats.positionsUpdated++;
        console.log(`✓ ${keyword.keyword}: Position ${position.position || 'not found'}`);

      } catch (error) {
        console.error(`✗ ${keyword.keyword}:`, error.message);
        this.stats.errors.push({ keyword: keyword.keyword, error: error.message });
      }
    }
  }

  /**
   * Fetch position data from DataForSEO API
   * @private
   */
  async fetchPositionFromDataForSEO(keyword, locationCode, device = 'desktop') {
    try {
      this.stats.apiCallsMade++;

      const response = await this.dataForSEOClient.post('/serp/google/organic/live/advanced', [{
        keyword: keyword,
        location_code: locationCode,
        language_code: this.getLanguageCode(locationCode),
        device: device,
        os: device === 'mobile' ? 'android' : undefined,
        depth: 100 // Track up to position 100
      }]);

      if (!response.data.tasks || response.data.tasks.length === 0) {
        throw new Error('No data returned from DataForSEO');
      }

      const task = response.data.tasks[0];
      if (task.status_code !== 20000) {
        throw new Error(`DataForSEO error: ${task.status_message}`);
      }

      const result = task.result[0];

      // Find our domain in the results
      const projectDomain = this.getProjectDomain(keyword);
      let position = null;
      let url = null;
      let serpFeatures = [];

      if (result.items) {
        const domainMatch = result.items.find(item =>
          item.domain && item.domain.includes(projectDomain)
        );

        if (domainMatch) {
          position = domainMatch.rank_absolute;
          url = domainMatch.url;
        }
      }

      // Extract SERP features
      if (result.items) {
        result.items.forEach(item => {
          if (item.type === 'featured_snippet') serpFeatures.push('Featured Snippet');
          if (item.type === 'local_pack') serpFeatures.push('Local Pack');
          if (item.type === 'people_also_ask') serpFeatures.push('People Also Ask');
          if (item.type === 'images') serpFeatures.push('Image Pack');
          if (item.type === 'video') serpFeatures.push('Video Results');
        });
      }

      return {
        position,
        url,
        serpFeatures: [...new Set(serpFeatures)],
        rawData: result
      };

    } catch (error) {
      console.error(`DataForSEO API error for "${keyword}":`, error.message);
      throw error;
    }
  }

  /**
   * Save position data to database
   * @private
   */
  async savePosition(keywordId, positionData) {
    const client = await this.db.connect();

    try {
      // Get previous position for comparison
      const prevResult = await client.query(`
        SELECT position FROM position_history
        WHERE keyword_id = $1
        ORDER BY date DESC
        LIMIT 1
      `, [keywordId]);

      const previousPosition = prevResult.rows[0]?.position || null;

      // Insert new position
      await client.query(`
        INSERT INTO position_history (
          keyword_id, position, url, date, device,
          serp_features, data_source, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (keyword_id, date, device, location, data_source)
        DO UPDATE SET
          position = EXCLUDED.position,
          url = EXCLUDED.url,
          serp_features = EXCLUDED.serp_features,
          raw_data = EXCLUDED.raw_data
      `, [
        keywordId,
        positionData.position,
        positionData.url,
        new Date().toISOString().split('T')[0], // Today's date
        this.config.defaultSettings.device,
        JSON.stringify(positionData.serpFeatures),
        'dataforseo',
        JSON.stringify(positionData.rawData)
      ]);

      // Update tracked_keywords with latest position
      await client.query(`
        UPDATE tracked_keywords
        SET updated_at = NOW()
        WHERE id = $1
      `, [keywordId]);

      return { previousPosition, currentPosition: positionData.position };

    } finally {
      client.release();
    }
  }

  /**
   * Sync GSC performance data
   * @param {string} projectId - Project ID to sync
   * @param {number} days - Number of days to sync (default: 7)
   */
  async syncGSCData(projectId, days = 7) {
    console.log(`📊 Syncing GSC data for project ${projectId}...`);

    try {
      const project = this.config.projects[projectId];
      if (!project) {
        throw new Error(`Project ${projectId} not found in configuration`);
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Note: This requires the GSC MCP to be available
      // In actual implementation, this would call mcp__gsc__search_analytics
      console.log(`📅 Fetching GSC data: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

      // For now, this is a placeholder for the MCP integration
      // The actual implementation would use the MCP functions
      console.log('ℹ️ GSC MCP integration pending - would call mcp__gsc__search_analytics here');

      return { success: true, message: 'GSC sync placeholder - implement with MCP' };

    } catch (error) {
      console.error('❌ GSC sync failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate alerts based on position changes
   * @private
   */
  async generateAlerts(keywordIds) {
    const client = await this.db.connect();
    let alertsCreated = 0;

    try {
      for (const keywordId of keywordIds) {
        // Get recent position changes
        const result = await client.query(`
          SELECT * FROM v_position_changes_7d
          WHERE id = $1
        `, [keywordId]);

        if (result.rows.length === 0) continue;

        const change = result.rows[0];
        const positionChange = change.position_change;

        // Critical: Large position drop
        if (positionChange >= this.config.alertThresholds.critical.positionDrop) {
          await this.createAlert(keywordId, 'critical', positionChange, change);
          alertsCreated++;
        }
        // Warning: Moderate position drop
        else if (positionChange >= this.config.alertThresholds.warning.positionDrop) {
          await this.createAlert(keywordId, 'warning', positionChange, change);
          alertsCreated++;
        }
        // Opportunity: Entered top 20 with low CTR
        else if (change.current_position <= this.config.alertThresholds.opportunity.enterTopN &&
                 change.previous_position > this.config.alertThresholds.opportunity.enterTopN) {
          await this.createAlert(keywordId, 'opportunity', positionChange, change);
          alertsCreated++;
        }
      }

      if (alertsCreated > 0) {
        console.log(`🔔 Generated ${alertsCreated} alerts`);
        this.stats.alertsGenerated += alertsCreated;
      }

      return alertsCreated;

    } finally {
      client.release();
    }
  }

  /**
   * Create an alert in the database
   * @private
   */
  async createAlert(keywordId, alertType, positionChange, changeData) {
    const client = await this.db.connect();

    try {
      const messages = {
        critical: `🔴 Critical: Position dropped ${Math.abs(positionChange)} places`,
        warning: `⚠️ Warning: Position dropped ${Math.abs(positionChange)} places`,
        opportunity: `💡 Opportunity: Keyword entered top ${this.config.alertThresholds.opportunity.enterTopN}`,
        competitor: `👁️ Competitor alert: New competitor in top 3`
      };

      await client.query(`
        INSERT INTO tracking_alerts (
          keyword_id, alert_type, position_change,
          old_position, new_position, message
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        keywordId,
        alertType,
        positionChange,
        changeData.previous_position,
        changeData.current_position,
        messages[alertType]
      ]);

    } finally {
      client.release();
    }
  }

  /**
   * Helper Functions
   */

  async getKeywordsToTrack(priority, projectId = null) {
    const client = await this.db.connect();

    try {
      let query = `
        SELECT * FROM tracked_keywords
        WHERE is_active = true
      `;
      const params = [];

      if (priority) {
        params.push(priority);
        query += ` AND priority = $${params.length}`;
      }

      if (projectId) {
        params.push(projectId);
        query += ` AND project_id = $${params.length}`;
      }

      query += ` ORDER BY priority DESC, search_volume DESC`;

      const result = await client.query(query, params);
      return result.rows;

    } finally {
      client.release();
    }
  }

  async createSyncLog(syncType, projectId, keywordsCount) {
    const client = await this.db.connect();

    try {
      const result = await client.query(`
        INSERT INTO sync_log (
          sync_type, project_id, keywords_processed,
          started_at, status
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [syncType, projectId, keywordsCount, new Date(), 'running']);

      return result.rows[0].id;

    } finally {
      client.release();
    }
  }

  async completeSyncLog(logId, success, failed, errors) {
    const client = await this.db.connect();

    try {
      await client.query(`
        UPDATE sync_log
        SET keywords_success = $1,
            keywords_failed = $2,
            errors = $3,
            completed_at = $4,
            duration_seconds = EXTRACT(EPOCH FROM ($4 - started_at)),
            status = $5
        WHERE id = $6
      `, [
        success,
        failed,
        JSON.stringify(errors),
        new Date(),
        errors.length > 0 ? 'completed' : 'completed',
        logId
      ]);

    } finally {
      client.release();
    }
  }

  getProjectDomain(keyword) {
    // Extract domain from project siteUrl
    // This is simplified - would need more robust implementation
    for (const [pid, project] of Object.entries(this.config.projects)) {
      const allKeywords = [
        ...(project.keywords.high || []),
        ...(project.keywords.medium || []),
        ...(project.keywords.low || [])
      ];

      if (allKeywords.some(kw => kw.keyword === keyword)) {
        return project.siteUrl.replace('sc-domain:', '');
      }
    }

    return null;
  }

  getLanguageCode(locationCode) {
    const languageMap = {
      2840: 'en', // USA
      2528: 'nl', // Netherlands
      2705: 'sl'  // Slovenia
    };

    return languageMap[locationCode] || 'en';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get tracking statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      uptime: process.uptime()
    };
  }

  /**
   * Cleanup resources
   */
  async close() {
    if (this.db) {
      await this.db.end();
      console.log('✅ Database connection closed');
    }

    this.cache.clear();
  }
}

module.exports = SERPTracker;
