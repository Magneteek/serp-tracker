# 📋 SERP Tracker - Quick Reference Card

## 🚀 Common Commands

```bash
# Add new project (interactive wizard)
npm run setup

# Track keywords by priority
npm run track:high       # Daily tracking
npm run track:medium     # Weekly tracking
npm run track:low        # Monthly tracking

# View dashboard
npm run dashboard

# Test without API calls
npm test

# Sync integrations
npm run sync:gsc         # Google Search Console
npm run sync:notion      # Notion dashboards
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env` | Your credentials (NEVER commit!) |
| `config/tracking-config.json` | Projects and keywords |
| `database/schema.sql` | PostgreSQL structure |
| `scripts/setup-project.js` | Interactive wizard |
| `INSTALLATION.md` | Setup instructions |
| `PUBLISHING.md` | Distribution guide |

## 💾 Database

```bash
# Start PostgreSQL (Docker)
docker start orchestrai-postgres

# Stop PostgreSQL
docker stop orchestrai-postgres

# Access database
docker exec -it orchestrai-postgres psql -U postgres -d orchestrai_serp

# Useful queries
SELECT * FROM v_latest_positions;
SELECT * FROM tracking_alerts ORDER BY created_at DESC LIMIT 10;
```

## 💰 Cost Calculator

**DataForSEO: $0.00075 per keyword check**

| Priority | Frequency | Cost/Keyword/Month |
|----------|-----------|-------------------|
| High | Daily (30x) | $0.0225 |
| Medium | Weekly (4x) | $0.003 |
| Low | Monthly (1x) | $0.00075 |

**Example:** 20 keywords = ~$0.45/month

## 🎯 Adding New Project

### Interactive (Easy)
```bash
npm run setup
```

### Manual (Advanced)
1. Edit `config/tracking-config.json`
2. Add project with UUID, keywords, location
3. Run `npm run import`
4. Run `npm run track:high`

## 📊 Viewing Results

```bash
# Full dashboard
npm run dashboard

# Project-specific
./bin/serp-tracker.js dashboard --project PROJECT_UUID

# Alerts only
./bin/serp-tracker.js dashboard --alerts

# SQL query
docker exec orchestrai-postgres psql -U postgres -d orchestrai_serp \
  -c "SELECT keyword, current_position, target_position FROM v_latest_positions;"
```

## 🔄 Automation (Cron)

```bash
# Edit crontab
crontab -e

# Add these lines:
0 2 * * * cd /path/to/serp-tracker && npm run track:high
0 9 * * 1 cd /path/to/serp-tracker && npm run track:medium
0 10 1 * * cd /path/to/serp-tracker && npm run track:low
0 3 * * * cd /path/to/serp-tracker && npm run sync:notion
```

## 🐛 Troubleshooting

### Database Connection Error
```bash
docker ps | grep serp-postgres    # Check if running
docker start orchestrai-postgres  # Start if stopped
```

### API Error
```bash
# Check credentials
cat .env | grep DATAFORSEO

# Test API
curl -u "username:password" https://api.dataforseo.com/v3/serp/google/organic/live/advanced
```

### Module Not Found
```bash
npm install  # Reinstall dependencies
```

## 📦 Publishing Checklist

- [ ] Create GitHub repository
- [ ] Update `package.json` with your GitHub URL
- [ ] Test: `npm pack` and inspect .tgz
- [ ] Publish: `npm publish --access public`
- [ ] Create GitHub release (v1.0.0)
- [ ] Add topics to GitHub repo
- [ ] Share on social media

## 🔗 Documentation

- **README.md** - Main documentation
- **INSTALLATION.md** - Detailed setup
- **PUBLISHING.md** - Distribution guide
- **STANDALONE-SETUP-COMPLETE.md** - Complete summary

## ⚙️ Configuration

### Required (.env)
```bash
POSTGRES_PASSWORD=yourpassword
DATAFORSEO_USERNAME=your_username
DATAFORSEO_PASSWORD=your_password
```

### Optional (.env)
```bash
NOTION_TOKEN=secret_xxx        # For Notion integration
WEBHOOK_SLACK_URL=https://...  # For alerts
```

## 📞 Support

- Issues: GitHub Issues
- Docs: `/path/to/serp-tracker/README.md`
- Examples: See `config/tracking-config.json`

---

**Location:** `/Users/kris/standalone-serp-tracker/`

**Version:** 1.0.0
