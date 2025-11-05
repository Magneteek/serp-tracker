# SERP Tracker - Quick Start Guide

**5-Minute Setup** → **Production-Ready SERP Tracking**

---

## Step 1: Database Setup (2 minutes)

```bash
# Create database
createdb orchestrai_serp

# Install schema
cd /Users/kris/CLAUDEtools/ORCHESTRAI
psql -d orchestrai_serp -f orchestrai-domains/seo/database/schema.sql

# Verify
psql -d orchestrai_serp -c "SELECT COUNT(*) FROM tracked_keywords;"
```

---

## Step 2: Environment Variables (1 minute)

Add to your `.env` file:

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=orchestrai_serp

DATAFORSEO_USERNAME=your_username
DATAFORSEO_PASSWORD=your_password

NOTION_TOKEN=your_token  # Optional
```

---

## Step 3: Import Keywords (1 minute)

```bash
# Preview what will be imported
node orchestrai-domains/seo/scripts/track-priority-keywords.js --import --dry-run

# Actually import
node orchestrai-domains/seo/scripts/track-priority-keywords.js --import
```

**Result**: Keywords from `tracking-config.json` → PostgreSQL database

---

## Step 4: First Tracking Run (1 minute)

```bash
# Test with one project
node orchestrai-domains/seo/scripts/track-priority-keywords.js \
  --priority high \
  --project drnl-A0582FF4-6715-4266-9A54-A7E311912E41
```

**Expected Output**:
```
✅ TRACKING COMPLETED SUCCESSFULLY
Total Duration:     0.45 minutes
Keywords Tracked:   3
✅ Successful:      3
📡 API Calls Made:  3
🔔 Alerts Generated: 0
```

---

## Step 5: View Results

### Option A: Database Query

```bash
psql -d orchestrai_serp -c "SELECT * FROM v_latest_positions LIMIT 5;"
```

### Option B: Use the Agent

```javascript
// In Claude Code
Task({
  subagent_type: "serp-tracker-manager",
  prompt: "Show me the latest position data for DeleteReviews.nl"
})
```

---

## Common Commands

### Track Keywords

```bash
# Daily: High priority
node orchestrai-domains/seo/scripts/track-priority-keywords.js --priority high

# Weekly: Medium priority
node orchestrai-domains/seo/scripts/track-priority-keywords.js --priority medium

# Monthly: Low priority
node orchestrai-domains/seo/scripts/track-priority-keywords.js --priority low
```

### Check Alerts

```bash
psql -d orchestrai_serp -c "
SELECT keyword, alert_type, message, triggered_at
FROM tracking_alerts ta
JOIN tracked_keywords tk ON ta.keyword_id = tk.id
WHERE is_read = false
ORDER BY triggered_at DESC
LIMIT 10;
"
```

### Get Optimization Opportunities

```bash
psql -d orchestrai_serp -c "
SELECT * FROM get_optimization_opportunities(
  'drnl-A0582FF4-6715-4266-9A54-A7E311912E41', -- project_id
  100,  -- min impressions
  0.02  -- max CTR
);
"
```

---

## Install Cron Jobs (Optional)

```bash
# Open crontab
crontab -e

# Add daily tracking at 2 AM
0 2 * * * cd /Users/kris/CLAUDEtools/ORCHESTRAI && node orchestrai-domains/seo/scripts/track-priority-keywords.js --priority high >> logs/serp-daily.log 2>&1
```

See `config/cron-schedule.conf` for complete schedule.

---

## Notion Setup (Optional)

1. Read: `/orchestrai-domains/seo/NOTION-DATABASE-SETUP.md`
2. Create 4 databases in Notion
3. Get database IDs
4. Update `tracking-config.json` → `notionConfig.databaseIds`
5. Test: `node orchestrai-domains/seo/scripts/sync-to-notion.js --test`
6. Sync: `node orchestrai-domains/seo/scripts/sync-to-notion.js`

---

## Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -d orchestrai_serp -c "SELECT 1;"
```

### "DataForSEO API error"
```bash
# Test credentials
curl -u "$DATAFORSEO_USERNAME:$DATAFORSEO_PASSWORD" \
  https://api.dataforseo.com/v3/
```

### "No keywords found"
```bash
# Verify keywords were imported
psql -d orchestrai_serp -c "SELECT COUNT(*) FROM tracked_keywords;"

# If 0, run import again
node orchestrai-domains/seo/scripts/track-priority-keywords.js --import
```

---

## Next Steps

1. ✅ Run first tracking session
2. ✅ Review results in database or via agent
3. ✅ Set up cron jobs for automation
4. ✅ (Optional) Configure Notion dashboards
5. ✅ Add more projects to `tracking-config.json`

---

## File Locations

```
orchestrai-domains/seo/
├── README.md                          # Full documentation
├── QUICK-START.md                     # This file
├── NOTION-DATABASE-SETUP.md           # Notion guide
├── config/
│   ├── tracking-config.json           # Your keywords
│   └── cron-schedule.conf             # Cron examples
├── database/
│   └── schema.sql                     # Database schema
├── lib/
│   └── serp-tracker.js                # Core library
└── scripts/
    ├── track-priority-keywords.js     # Main tracker
    ├── sync-gsc-data.js               # GSC sync
    └── sync-to-notion.js              # Notion sync
```

---

## Help

- **Full Docs**: `/orchestrai-domains/seo/README.md`
- **Agent Help**: Invoke `serp-tracker-manager` agent
- **Logs**: `tail -f logs/serp-tracker-*.log`
- **Database**: `psql -d orchestrai_serp`

---

**You're all set! Start tracking →**

```bash
node orchestrai-domains/seo/scripts/track-priority-keywords.js --priority high
```
