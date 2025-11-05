#!/usr/bin/env node

/**
 * SERP Tracker CLI
 * Main entry point for the SERP tracking tool
 */

const { spawn } = require('child_process');
const path = require('path');

const commands = {
  setup: {
    script: 'scripts/setup-project.js',
    description: 'Add a new project to track (interactive wizard)'
  },
  track: {
    script: 'scripts/track-priority-keywords.js',
    description: 'Track keyword positions'
  },
  dashboard: {
    script: 'scripts/dashboard.js',
    description: 'View tracking dashboard'
  },
  'sync:gsc': {
    script: 'scripts/sync-gsc-data.js',
    description: 'Sync Google Search Console data'
  },
  'sync:notion': {
    script: 'scripts/sync-to-notion.js',
    description: 'Sync to Notion databases'
  },
  help: {
    description: 'Show this help message'
  }
};

function showHelp() {
  console.log('\n📊 SERP Tracker CLI\n');
  console.log('Usage: serp-tracker <command> [options]\n');
  console.log('Commands:\n');

  Object.entries(commands).forEach(([name, info]) => {
    console.log(`  ${name.padEnd(20)} ${info.description}`);
  });

  console.log('\nExamples:\n');
  console.log('  serp-tracker setup                  # Add new project');
  console.log('  serp-tracker track --priority high  # Track high-priority keywords');
  console.log('  serp-tracker dashboard              # View results');
  console.log('  serp-tracker sync:notion            # Sync to Notion\n');
}

function runCommand(command, args) {
  const commandInfo = commands[command];

  if (!commandInfo || !commandInfo.script) {
    console.error(`❌ Unknown command: ${command}`);
    console.log('Run "serp-tracker help" for available commands');
    process.exit(1);
  }

  const scriptPath = path.join(__dirname, '..', commandInfo.script);

  const child = spawn('node', [scriptPath, ...args], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  child.on('close', (code) => {
    process.exit(code);
  });
}

// Parse command-line arguments
const [,, command, ...args] = process.argv;

if (!command || command === 'help' || command === '--help' || command === '-h') {
  showHelp();
  process.exit(0);
}

runCommand(command, args);
