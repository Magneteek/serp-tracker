#!/usr/bin/env node

/**
 * ORCHESTRAI SERP Tracker - Priority Keywords Tracking Script
 *
 * Tracks high-priority keywords daily using DataForSEO API
 * This script is designed to run via cron job daily at 2 AM
 *
 * Usage:
 *   node track-priority-keywords.js [options]
 *
 * Options:
 *   --priority <level>    Priority level to track (high, medium, low) [default: high]
 *   --project <id>        Track only specific project ID
 *   --dry-run            Show what would be tracked without making API calls
 *   --import             Import keywords from config before tracking
 *
 * Examples:
 *   node track-priority-keywords.js
 *   node track-priority-keywords.js --priority medium --project drnl-A0582FF4-6715-4266-9A54-A7E311912E41
 *   node track-priority-keywords.js --dry-run --import
 *
 * @version 1.0.0
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const SERPTracker = require('../lib/serp-tracker');
const path = require('path');

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    priority: 'high',
    project: null,
    dryRun: false,
    import: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--priority':
        options.priority = args[++i];
        break;
      case '--project':
        options.project = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--import':
        options.import = true;
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
ORCHESTRAI SERP Tracker - Priority Keywords Tracking

Usage: node track-priority-keywords.js [options]

Options:
  --priority <level>    Priority level: high, medium, or low (default: high)
  --project <id>        Track only specific project ID
  --dry-run            Show what would be tracked without making API calls
  --import             Import keywords from config before tracking
  --help               Show this help message

Examples:
  # Track all high-priority keywords
  node track-priority-keywords.js

  # Track medium-priority keywords for specific project
  node track-priority-keywords.js --priority medium --project drnl-A0582FF4-6715-4266-9A54-A7E311912E41

  # Dry run to see what would be tracked
  node track-priority-keywords.js --dry-run

  # Import keywords from config and then track
  node track-priority-keywords.js --import

Environment Variables Required:
  POSTGRES_USER          PostgreSQL username
  POSTGRES_PASSWORD      PostgreSQL password
  POSTGRES_DATABASE      Database name
  DATAFORSEO_USERNAME    DataForSEO API username
  DATAFORSEO_PASSWORD    DataForSEO API password
  NOTION_TOKEN           Notion API token (optional)
  `);
}

async function main() {
  const options = parseArgs();
  const tracker = new SERPTracker();

  console.log('='.repeat(70));
  console.log('  ORCHESTRAI SERP Tracker - Priority Keywords');
  console.log('='.repeat(70));
  console.log('');
  console.log(`Priority Level: ${options.priority.toUpperCase()}`);
  console.log(`Project Filter: ${options.project || 'ALL PROJECTS'}`);
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE TRACKING'}`);
  console.log('');
  console.log('─'.repeat(70));
  console.log('');

  try {
    // Initialize tracker
    console.log('🚀 Initializing SERP Tracker...');
    await tracker.init();

    // Import keywords if requested
    if (options.import) {
      console.log('📥 Importing keywords from configuration...');
      const importResult = await tracker.importKeywordsFromConfig(options.project);
      console.log(`   ✓ ${importResult.imported} new keywords`);
      console.log(`   ✓ ${importResult.skipped} existing keywords updated`);
      console.log('');
    }

    // Dry run: show what would be tracked
    if (options.dryRun) {
      console.log('🔍 DRY RUN - Fetching keywords that would be tracked...');
      const keywords = await tracker.getKeywordsToTrack(options.priority, options.project);

      console.log('');
      console.log('Keywords to be tracked:');
      console.log('─'.repeat(70));

      const grouped = {};
      keywords.forEach(kw => {
        if (!grouped[kw.project_name]) {
          grouped[kw.project_name] = [];
        }
        grouped[kw.project_name].push(kw);
      });

      Object.entries(grouped).forEach(([project, kws]) => {
        console.log(`\n📁 ${project} (${kws.length} keywords)`);
        kws.forEach((kw, index) => {
          console.log(`   ${index + 1}. ${kw.keyword}`);
          console.log(`      Location: ${kw.location_name}`);
          console.log(`      Target: Position ${kw.target_position || 'N/A'}`);
          console.log(`      Volume: ${kw.search_volume || 'N/A'}/month`);
        });
      });

      console.log('');
      console.log(`Total: ${keywords.length} keywords would be tracked`);
      console.log('');
      console.log('💡 Remove --dry-run flag to execute actual tracking');

    } else {
      // Live tracking
      console.log('🔍 Starting keyword tracking...');
      console.log('');

      const startTime = Date.now();
      const results = await tracker.trackKeywordsByPriority(options.priority, options.project);
      const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

      console.log('');
      console.log('─'.repeat(70));
      console.log('');
      console.log('📊 TRACKING SUMMARY');
      console.log('─'.repeat(70));
      console.log(`Total Duration:     ${duration} minutes`);
      console.log(`Keywords Tracked:   ${results.success + results.failed}`);
      console.log(`✅ Successful:      ${results.success}`);
      console.log(`❌ Failed:          ${results.failed}`);

      const stats = tracker.getStats();
      console.log(`📡 API Calls Made:  ${stats.apiCallsMade}`);
      console.log(`📝 Positions Updated: ${stats.positionsUpdated}`);
      console.log(`🔔 Alerts Generated: ${stats.alertsGenerated}`);
      console.log(`💾 Cache Size:      ${stats.cacheSize} entries`);

      if (results.errors && results.errors.length > 0) {
        console.log('');
        console.log('⚠️ ERRORS:');
        results.errors.forEach(err => {
          console.log(`   Batch ${err.batch}: ${err.error}`);
        });
      }

      if (stats.errors && stats.errors.length > 0) {
        console.log('');
        console.log('⚠️ KEYWORD ERRORS:');
        stats.errors.slice(0, 5).forEach(err => {
          console.log(`   ${err.keyword}: ${err.error}`);
        });
        if (stats.errors.length > 5) {
          console.log(`   ... and ${stats.errors.length - 5} more errors`);
        }
      }

      console.log('');
      console.log('─'.repeat(70));
      console.log('');

      if (results.success > 0) {
        console.log('✅ TRACKING COMPLETED SUCCESSFULLY');
      } else {
        console.log('❌ TRACKING COMPLETED WITH ERRORS');
        process.exit(1);
      }
    }

  } catch (error) {
    console.error('');
    console.error('='.repeat(70));
    console.error('❌ CRITICAL ERROR');
    console.error('='.repeat(70));
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Check database connection settings in .env');
    console.error('  2. Verify DataForSEO API credentials');
    console.error('  3. Ensure PostgreSQL database is running');
    console.error('  4. Check database schema is initialized (schema.sql)');
    console.error('');
    process.exit(1);

  } finally {
    // Cleanup
    await tracker.close();
  }
}

// Handle uncaught errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('');
  console.error('❌ Unhandled promise rejection:', error.message);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('');
  console.log('⏸️  Interrupted by user. Cleaning up...');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = main;
