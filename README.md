# 📊 SERP Tracker

> **Professional keyword position tracking tool** for SEO agencies and marketers

Track your keyword rankings across Google search results with precision, automation, and beautiful visualizations. Built with DataForSEO API and PostgreSQL for reliable, cost-effective SERP monitoring.

[![npm version](https://img.shields.io/npm/v/@orchestrai/serp-tracker.svg)](https://www.npmjs.com/package/@orchestrai/serp-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

---

## ✨ Features

### Core Tracking
- 🎯 **Precise Position Tracking** - Track exact SERP positions (1-100) with DataForSEO API
- 📊 **Historical Data** - PostgreSQL time-series storage for trend analysis
- 🌍 **Multi-Location Support** - Track rankings in 200+ countries and languages
- 📱 **Device-Specific** - Separate tracking for desktop, mobile, and tablet
- ⚡ **Real-time Monitoring** - Get instant position updates

### Intelligence & Automation
- 🚨 **Smart Alerts** - Automatic notifications for:
  - Critical position drops (10+ positions)
  - Opportunities (entering top 20)
  - Competitor movements
  - CTR anomalies
- 🔄 **Automated Tracking** - Cron-ready scripts for hands-off monitoring
- 💡 **Optimization Insights** - AI-powered recommendations
- 📈 **Trend Analysis** - Position change detection and forecasting

### Integration & Visualization
- 🎨 **CLI Dashboard** - Beautiful terminal interface with color-coded metrics
- 📝 **Notion Integration** - Sync to client-facing dashboards
- 🔍 **Google Search Console** - Combine SERP data with actual performance metrics
- 🔔 **Webhook Notifications** - Slack, Discord, custom endpoints

### Cost Optimization
- 💰 **Priority-Based Tracking** - Daily, weekly, or monthly frequencies
- 💾 **Intelligent Caching** - Reduce API costs by 70-80%
- 📊 **Batch Processing** - Efficient API usage with rate limiting
- 💵 **Transparent Pricing** - $0.00075 per keyword check

---

## 🚀 Quick Start

### Installation

```bash
# Global installation
npm install -g @orchestrai/serp-tracker

# Or use npx (no installation)
npx @orchestrai/serp-tracker setup
```

### Initial Setup

```bash
# 1. Set up database (Docker)
docker run --name serp-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=serp_tracker \
  -p 5432:5432 -d postgres:15

# 2. Install schema
docker exec -i serp-postgres psql -U postgres -d serp_tracker < database/schema.sql

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Add your first project
npm run setup

# 5. Start tracking
npm run track:high

# 6. View results
npm run dashboard
```

**See [INSTALLATION.md](INSTALLATION.md) for detailed setup instructions**

---

## 📖 Usage

### Adding Projects

**Interactive wizard (recommended):**
```bash
npm run setup
```

The wizard will guide you through:
1. Project name and domain
2. Target location and language
3. Competitor domains
4. Keywords with priorities (high/medium/low)
5. Initial tracking configuration

**Manual configuration:**
Edit `config/tracking-config.json` and run:
```bash
npm run import
```

### Tracking Keywords

```bash
# Track by priority
npm run track:high      # Daily tracking
npm run track:medium    # Weekly tracking
npm run track:low       # Monthly tracking

# Track specific project
serp-tracker track --project PROJECT_UUID --priority high

# Dry run (test without API calls)
serp-tracker track --dry-run --priority high
```

### Viewing Results

```bash
# Interactive dashboard
npm run dashboard

# Or use the CLI
serp-tracker dashboard

# Filter by project
serp-tracker dashboard --project PROJECT_UUID

# Show only alerts
serp-tracker dashboard --alerts
```

**Example output:**
```
════════════════════════════════════════════════════════════════
  📊 SERP Tracker Dashboard
════════════════════════════════════════════════════════════════

  📁 Example Website
  ────────────────────────────────────────────────────────────

  Keyword              Position    Target    Change    Status
  ────────────────────────────────────────────────────────────
  best seo tools       #3 🥇       #1        ↑ +2      3 above
  keyword research     #8 🏆       #5        → 0       3 away
  serp tracking        #15 ⭐      #10       ↓ -3      5 away

  📈 Summary Statistics
  ────────────────────────────────────────────────────────────
  Total Keywords:      18
  Average Position:    12.3
  🥇 Top 3:           5 keywords
  🏆 Top 10:          8 keywords
```

### Automation

**Set up cron jobs:**
```bash
# High priority - daily at 2 AM
0 2 * * * cd /path/to/serp-tracker && npm run track:high

# Medium priority - weekly on Monday
0 9 * * 1 cd /path/to/serp-tracker && npm run track:medium

# Low priority - monthly on 1st
0 10 1 * * cd /path/to/serp-tracker && npm run track:low

# Sync to Notion - daily at 3 AM
0 3 * * * cd /path/to/serp-tracker && npm run sync:notion
```

---

## 💰 Pricing

### DataForSEO API Cost

**$0.00075 per keyword check** (very affordable!)

| Priority | Frequency | Keywords | Monthly Cost |
|----------|-----------|----------|--------------|
| High | Daily (30 checks) | 10 | **$0.225** |
| Medium | Weekly (4 checks) | 20 | **$0.06** |
| Low | Monthly (1 check) | 30 | **$0.0225** |
| **Total** | **Mixed** | **60** | **~$0.31/month** |

**Example Projects:**
- Small site (20 keywords): ~$0.45/month
- Medium site (50 keywords): ~$1.13/month
- Agency (200 keywords): ~$4.50/month

**Free trial:** $1 credit = 1,333 keyword checks!

### Cost Optimization

The tracker includes intelligent caching that reduces costs by 70-80%:
- 1-hour cache for repeated checks
- Batch processing with delays
- Priority-based tracking frequencies

---

## 🛠️ Advanced Features

### Google Search Console Integration

Combine SERP position data with actual performance metrics:

```bash
npm run sync:gsc
```

Benefits:
- Compare positions with actual clicks
- Identify CTR optimization opportunities
- Track impression share
- Validate position data with real metrics

### Notion Dashboards

Create beautiful client-facing dashboards:

```bash
npm run sync:notion --setup  # Initial setup
npm run sync:notion          # Sync data
```

Features:
- Automatic database creation
- Real-time position updates
- Alert notifications
- Trend visualizations

### Webhook Notifications

Get instant alerts via Slack, Discord, or custom webhooks:

```javascript
// In .env
WEBHOOK_SLACK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
WEBHOOK_DISCORD_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK
```

Alert types:
- **Critical:** Position drops >10 positions
- **Warning:** Position drops >5 positions
- **Opportunity:** Keyword enters top 20
- **Competitor:** Competitor moves into top 3

---

## 📁 Project Structure

```
serp-tracker/
├── bin/
│   └── serp-tracker.js       # CLI entry point
├── config/
│   ├── tracking-config.json  # Project configurations
│   └── cron-schedule.conf    # Automation schedules
├── database/
│   └── schema.sql            # PostgreSQL schema
├── lib/
│   └── serp-tracker.js       # Core tracking engine
├── scripts/
│   ├── setup-project.js      # Interactive setup wizard
│   ├── track-priority-keywords.js  # Main tracking script
│   ├── dashboard.js          # CLI dashboard
│   ├── sync-gsc-data.js      # GSC integration
│   └── sync-to-notion.js     # Notion sync
├── .env.example              # Environment template
├── INSTALLATION.md           # Detailed setup guide
└── package.json
```

---

## 🧪 Development

### Prerequisites

- Node.js v18+
- PostgreSQL 15+
- DataForSEO API account

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/yourusername/serp-tracker.git
cd serp-tracker

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Set up database
docker run --name serp-postgres \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=serp_tracker_dev \
  -p 5432:5432 -d postgres:15

# Install schema
docker exec -i serp-postgres psql -U postgres -d serp_tracker_dev < database/schema.sql

# Run tests
npm test
```

### Testing

```bash
# Dry run (no API calls)
npm test

# Test specific project
node scripts/track-priority-keywords.js --dry-run --project PROJECT_UUID

# Test dashboard
npm run dashboard
```

---

## 📊 Database Schema

The tracker uses PostgreSQL with 6 main tables:

- **tracked_keywords** - Keywords being monitored
- **position_history** - Time-series position data
- **gsc_performance** - Google Search Console metrics
- **competitor_positions** - Competitor tracking data
- **tracking_alerts** - Generated alerts
- **sync_log** - Audit trail

### Key Features

- Time-series partitioning for performance
- Analytical views for common queries
- Triggers for automated alert generation
- Foreign key relationships for data integrity

See `database/schema.sql` for complete structure.

---

## 🔐 Security

- ✅ Environment-based credentials (never committed)
- ✅ Database connection encryption
- ✅ API key validation
- ✅ Rate limiting to prevent abuse
- ✅ Parameterized queries (SQL injection prevention)

**Best practices:**
1. Never commit `.env` to version control
2. Use strong database passwords
3. Rotate API credentials regularly
4. Limit database access by IP
5. Use read-only database users for queries

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic and descriptive

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **DataForSEO** - Reliable SERP data API
- **PostgreSQL** - Robust time-series database
- **Notion** - Beautiful dashboard integration
- **ORCHESTRAI** - Original project framework

---

## 📞 Support

- **Documentation:** [INSTALLATION.md](INSTALLATION.md)
- **Issues:** [GitHub Issues](https://github.com/yourusername/serp-tracker/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/serp-tracker/discussions)
- **Email:** support@orchestrai.com

---

## 🗺️ Roadmap

- [ ] Bing and Yahoo SERP tracking
- [ ] Mobile app for iOS/Android
- [ ] Advanced competitor analysis
- [ ] AI-powered content recommendations
- [ ] Multi-user support with permissions
- [ ] Custom reporting and exports
- [ ] API for third-party integrations
- [ ] White-label dashboard

---

## ⭐ Show Your Support

If this tool helps your SEO workflow, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting features
- 📝 Contributing code
- 📢 Sharing with others

---

**Built with ❤️ by ORCHESTRAI**

[npm](https://www.npmjs.com/package/@orchestrai/serp-tracker) • [GitHub](https://github.com/yourusername/serp-tracker) • [Documentation](https://github.com/yourusername/serp-tracker/wiki)
