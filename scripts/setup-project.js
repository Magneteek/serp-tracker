#!/usr/bin/env node

/**
 * SERP Tracker - Interactive Project Setup Wizard
 *
 * Guides users through adding new projects and keywords to track
 * Automatically imports to database and runs initial tracking
 *
 * Usage:
 *   node scripts/setup-project.js
 *   npm run setup
 *
 * @version 1.0.0
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
const { randomUUID } = require('crypto');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify question
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Location codes for common countries
const locationCodes = {
  'United States': 2840,
  'United Kingdom': 2826,
  'Canada': 2124,
  'Australia': 2036,
  'Netherlands': 2528,
  'Germany': 2276,
  'France': 2250,
  'Spain': 2724,
  'Italy': 2380,
  'Slovenia': 2705,
  'Other': 'custom'
};

class ProjectSetupWizard {
  constructor() {
    this.pool = new Pool({
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DATABASE,
      port: process.env.POSTGRES_PORT || 5432
    });

    this.project = {
      id: randomUUID(),
      name: '',
      siteUrl: '',
      location: { code: 2840, name: 'United States', language: 'English' },
      competitors: [],
      keywords: { high: [], medium: [], low: [] }
    };
  }

  async start() {
    console.clear();
    console.log(colorize('════════════════════════════════════════════════════════════════════════════════', 'cyan'));
    console.log(colorize('  🚀 SERP Tracker - Project Setup Wizard', 'bright'));
    console.log(colorize('════════════════════════════════════════════════════════════════════════════════', 'cyan'));
    console.log('');
    console.log('This wizard will help you add a new project to track.\n');

    try {
      // Test database connection
      await this.testConnection();

      // Gather project information
      await this.getProjectInfo();
      await this.getLocationInfo();
      await this.getCompetitors();
      await this.getKeywords();

      // Show summary and confirm
      await this.showSummary();
      const confirm = await question(colorize('\n✓ Save this project? (yes/no): ', 'green'));

      if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
        await this.saveProject();
        await this.importToDatabase();

        const track = await question(colorize('\n🎯 Run initial tracking now? (yes/no): ', 'yellow'));
        if (track.toLowerCase() === 'yes' || track.toLowerCase() === 'y') {
          await this.runInitialTracking();
        }

        console.log(colorize('\n✅ Project setup complete!', 'green'));
        this.showNextSteps();
      } else {
        console.log(colorize('\n❌ Setup cancelled', 'red'));
      }

    } catch (error) {
      console.error(colorize(`\n❌ Error: ${error.message}`, 'red'));
    } finally {
      await this.pool.end();
      rl.close();
    }
  }

  async testConnection() {
    try {
      await this.pool.query('SELECT 1');
      console.log(colorize('✓ Database connection successful\n', 'green'));
    } catch (error) {
      throw new Error(`Cannot connect to database. Make sure PostgreSQL is running.\n${error.message}`);
    }
  }

  async getProjectInfo() {
    console.log(colorize('─── Project Information ───', 'bright'));

    this.project.name = await question('Project name (e.g., "My Awesome Site"): ');

    let domain = await question('Website domain (e.g., "example.com"): ');
    // Clean domain
    domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    this.project.siteUrl = `sc-domain:${domain}`;

    console.log(colorize(`\n✓ Project ID: ${this.project.id}`, 'gray'));
    console.log(colorize(`✓ GSC Site URL: ${this.project.siteUrl}\n`, 'gray'));
  }

  async getLocationInfo() {
    console.log(colorize('─── Location & Language ───', 'bright'));
    console.log('Select your primary location:\n');

    const locations = Object.keys(locationCodes);
    locations.forEach((loc, index) => {
      console.log(colorize(`  ${index + 1}. ${loc}`, 'cyan'));
    });

    const choice = await question('\nEnter number (1-' + locations.length + '): ');
    const selectedLocation = locations[parseInt(choice) - 1];

    if (selectedLocation === 'Other') {
      this.project.location.name = await question('Enter location name: ');
      this.project.location.code = parseInt(await question('Enter location code: '));
      this.project.location.language = await question('Enter language: ');
    } else {
      this.project.location.name = selectedLocation;
      this.project.location.code = locationCodes[selectedLocation];
      this.project.location.language = await question(`Language for ${selectedLocation} (e.g., English, Dutch, Spanish): `);
    }

    console.log(colorize(`\n✓ Location: ${this.project.location.name} (${this.project.location.code})`, 'gray'));
    console.log(colorize(`✓ Language: ${this.project.location.language}\n`, 'gray'));
  }

  async getCompetitors() {
    console.log(colorize('─── Competitors (Optional) ───', 'bright'));
    console.log('Enter competitor domains (press Enter when done):\n');

    let index = 1;
    while (true) {
      const competitor = await question(`  ${index}. Competitor domain (or press Enter to skip): `);
      if (!competitor) break;

      const cleanDomain = competitor.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
      this.project.competitors.push(cleanDomain);
      index++;
    }

    if (this.project.competitors.length > 0) {
      console.log(colorize(`\n✓ Added ${this.project.competitors.length} competitors\n`, 'gray'));
    }
  }

  async getKeywords() {
    console.log(colorize('─── Keywords to Track ───', 'bright'));
    console.log('Add keywords by priority level.\n');
    console.log(colorize('Priority levels:', 'yellow'));
    console.log(colorize('  • HIGH = Daily tracking ($0.00075/keyword/day)', 'green'));
    console.log(colorize('  • MEDIUM = Weekly tracking ($0.00075/keyword/week)', 'cyan'));
    console.log(colorize('  • LOW = Monthly tracking ($0.00075/keyword/month)\n', 'gray'));

    await this.addKeywordsByPriority('high', 'HIGH Priority Keywords (tracked daily)');
    await this.addKeywordsByPriority('medium', 'MEDIUM Priority Keywords (tracked weekly)');
    await this.addKeywordsByPriority('low', 'LOW Priority Keywords (tracked monthly)');

    const totalKeywords = this.project.keywords.high.length +
                          this.project.keywords.medium.length +
                          this.project.keywords.low.length;

    console.log(colorize(`\n✓ Total keywords: ${totalKeywords}`, 'gray'));
  }

  async addKeywordsByPriority(priority, title) {
    console.log(colorize(`\n─── ${title} ───`, 'bright'));

    let index = 1;
    while (true) {
      const keyword = await question(`  ${index}. Keyword (or press Enter to finish ${priority}): `);
      if (!keyword) break;

      const targetPosition = await question(`     Target position for "${keyword}" (1-100): `);
      const searchVolume = await question(`     Monthly search volume (optional, press Enter to skip): `);

      this.project.keywords[priority].push({
        keyword: keyword.trim(),
        targetPosition: parseInt(targetPosition) || 10,
        trackingFrequency: priority === 'high' ? 'daily' : priority === 'medium' ? 'weekly' : 'monthly',
        searchVolume: searchVolume ? parseInt(searchVolume) : 0
      });

      console.log(colorize(`     ✓ Added "${keyword}"\n`, 'green'));
      index++;
    }
  }

  async showSummary() {
    console.clear();
    console.log(colorize('════════════════════════════════════════════════════════════════════════════════', 'cyan'));
    console.log(colorize('  📋 Project Setup Summary', 'bright'));
    console.log(colorize('════════════════════════════════════════════════════════════════════════════════', 'cyan'));
    console.log('');

    console.log(colorize('Project Details:', 'bright'));
    console.log(`  Name:      ${colorize(this.project.name, 'cyan')}`);
    console.log(`  ID:        ${colorize(this.project.id, 'gray')}`);
    console.log(`  Domain:    ${colorize(this.project.siteUrl.replace('sc-domain:', ''), 'cyan')}`);
    console.log(`  Location:  ${colorize(this.project.location.name, 'cyan')} (${this.project.location.language})`);

    if (this.project.competitors.length > 0) {
      console.log(`\n${colorize('Competitors:', 'bright')}`);
      this.project.competitors.forEach(comp => {
        console.log(`  • ${colorize(comp, 'yellow')}`);
      });
    }

    console.log(`\n${colorize('Keywords to Track:', 'bright')}`);

    if (this.project.keywords.high.length > 0) {
      console.log(colorize('\n  HIGH Priority (daily):', 'green'));
      this.project.keywords.high.forEach(kw => {
        console.log(`    • ${kw.keyword} ${colorize(`(target: #${kw.targetPosition})`, 'gray')}`);
      });
    }

    if (this.project.keywords.medium.length > 0) {
      console.log(colorize('\n  MEDIUM Priority (weekly):', 'cyan'));
      this.project.keywords.medium.forEach(kw => {
        console.log(`    • ${kw.keyword} ${colorize(`(target: #${kw.targetPosition})`, 'gray')}`);
      });
    }

    if (this.project.keywords.low.length > 0) {
      console.log(colorize('\n  LOW Priority (monthly):', 'gray'));
      this.project.keywords.low.forEach(kw => {
        console.log(`    • ${kw.keyword} ${colorize(`(target: #${kw.targetPosition})`, 'gray')}`);
      });
    }

    const totalKeywords = this.project.keywords.high.length +
                          this.project.keywords.medium.length +
                          this.project.keywords.low.length;

    const monthlyCost = (this.project.keywords.high.length * 30 * 0.00075) +
                        (this.project.keywords.medium.length * 4 * 0.00075) +
                        (this.project.keywords.low.length * 1 * 0.00075);

    console.log(colorize(`\n  Total Keywords: ${totalKeywords}`, 'bright'));
    console.log(colorize(`  Estimated monthly cost: $${monthlyCost.toFixed(2)}`, 'yellow'));
  }

  async saveProject() {
    const configPath = path.join(__dirname, '../config/tracking-config.json');

    try {
      // Read existing config
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);

      // Add new project
      const projectKey = this.project.id;
      config.trackingConfig.projects[projectKey] = {
        name: this.project.name,
        siteUrl: this.project.siteUrl,
        location: this.project.location,
        competitors: this.project.competitors,
        keywords: this.project.keywords
      };

      // Save updated config
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));

      console.log(colorize('\n✓ Project saved to tracking-config.json', 'green'));
    } catch (error) {
      throw new Error(`Failed to save project: ${error.message}`);
    }
  }

  async importToDatabase() {
    console.log(colorize('\n📥 Importing project to database...', 'cyan'));

    const projectKey = this.project.id;
    let totalImported = 0;

    for (const [priority, keywords] of Object.entries(this.project.keywords)) {
      for (const kw of keywords) {
        try {
          await this.pool.query(`
            INSERT INTO tracked_keywords (
              project_id, project_name, keyword, target_position,
              tracking_frequency, priority, location_code, location_name,
              device, search_volume
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (project_id, keyword, device) DO UPDATE SET
              target_position = EXCLUDED.target_position,
              tracking_frequency = EXCLUDED.tracking_frequency,
              updated_at = CURRENT_TIMESTAMP
          `, [
            projectKey,
            this.project.name,
            kw.keyword,
            kw.targetPosition,
            kw.trackingFrequency,
            priority,
            this.project.location.code,
            this.project.location.name,
            'desktop',
            kw.searchVolume || 0
          ]);

          totalImported++;
        } catch (error) {
          console.error(colorize(`  ✗ Failed to import "${kw.keyword}": ${error.message}`, 'red'));
        }
      }
    }

    console.log(colorize(`✓ Imported ${totalImported} keywords to database`, 'green'));
  }

  async runInitialTracking() {
    console.log(colorize('\n🎯 Running initial tracking...', 'cyan'));
    console.log(colorize('This may take a few moments...\n', 'gray'));

    const { spawn } = require('child_process');

    return new Promise((resolve, reject) => {
      const track = spawn('node', [
        path.join(__dirname, 'track-priority-keywords.js'),
        '--project', this.project.id
      ], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });

      track.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Tracking failed with code ${code}`));
        }
      });
    });
  }

  showNextSteps() {
    console.log('');
    console.log(colorize('════════════════════════════════════════════════════════════════════════════════', 'cyan'));
    console.log(colorize('  🎯 Next Steps', 'bright'));
    console.log(colorize('════════════════════════════════════════════════════════════════════════════════', 'cyan'));
    console.log('');
    console.log(colorize('1. View your tracking results:', 'bright'));
    console.log(colorize('   npm run dashboard', 'cyan'));
    console.log('');
    console.log(colorize('2. Set up automated tracking (cron job):', 'bright'));
    console.log(colorize('   npm run setup:cron', 'cyan'));
    console.log('');
    console.log(colorize('3. Sync to Notion (optional):', 'bright'));
    console.log(colorize('   npm run sync:notion', 'cyan'));
    console.log('');
    console.log(colorize('4. Add more projects:', 'bright'));
    console.log(colorize('   npm run setup', 'cyan'));
    console.log('');
  }
}

// Run wizard
const wizard = new ProjectSetupWizard();
wizard.start();
