# 🚀 SERP Tracker - Installation Guide

Complete step-by-step guide to install and configure the SERP Tracker tool.

---

## Prerequisites

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **PostgreSQL** database (via Docker or native installation)
- **DataForSEO API** account ([Sign up](https://dataforseo.com/) - $1 free credit)

---

## Installation Methods

### Method 1: Global Installation (Recommended for CLI usage)

```bash
# Install globally from npm
npm install -g @magneteek/serp-tracker

# Or using npx (no installation required)
npx @magneteek/serp-tracker setup
```

### Method 2: Local Installation (Recommended for customization)

```bash
# Clone or download the repository
git clone https://github.com/yourusername/serp-tracker.git
cd serp-tracker

# Install dependencies
npm install

# Continue with configuration below
```

---

## Step 1: Database Setup

### Option A: Using Docker (Easiest)

```bash
# Start PostgreSQL container
docker run --name serp-postgres \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=serp_tracker \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps | grep serp-postgres

# Install database schema
docker exec -i serp-postgres psql -U postgres -d serp_tracker < database/schema.sql
```

### Option B: Native PostgreSQL Installation

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb serp_tracker

# Install schema
psql serp_tracker < database/schema.sql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-15

# Create database
sudo -u postgres createdb serp_tracker

# Install schema
sudo -u postgres psql serp_tracker < database/schema.sql
```

**Windows:**
1. Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Install and start the service
3. Use pgAdmin to create database `serp_tracker`
4. Import `database/schema.sql`

---

## Step 2: Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit with your credentials
nano .env  # or use your favorite editor
```

### Required Configuration

Edit `.env` and fill in these required fields:

```bash
# PostgreSQL (from Step 1)
POSTGRES_PASSWORD=your_secure_password

# DataForSEO API (see below for signup)
DATAFORSEO_USERNAME=your_username
DATAFORSEO_PASSWORD=your_api_password
```

### Getting DataForSEO API Credentials

1. Sign up at [dataforseo.com](https://dataforseo.com/)
2. Get $1 free credit (enough for 1,333 keyword checks)
3. Find your credentials in dashboard → API Access
4. Copy username and password to `.env`

**Pricing:** $0.00075 per keyword check
- Daily tracking (30 days): $0.0225/keyword/month
- Weekly tracking (4 weeks): $0.003/keyword/month
- Monthly tracking: $0.00075/keyword/month

---

## Step 3: Verify Installation

```bash
# Test database connection and configuration
npm test

# Expected output:
# ✓ Database connection successful
# ✓ Configuration loaded
# ✓ 7 keywords found for tracking
```

---

## Step 4: Add Your First Project

### Interactive Setup (Easiest)

```bash
npm run setup
```

This launches an interactive wizard that asks:
- Project name and domain
- Target location and language
- Competitors (optional)
- Keywords to track with priorities
- Initial tracking preferences

### Manual Setup

Edit `config/tracking-config.json` and add your project:

```json
{
  "trackingConfig": {
    "projects": {
      "your-project-uuid": {
        "name": "My Website",
        "siteUrl": "sc-domain:example.com",
        "location": {
          "code": 2840,
          "name": "United States",
          "language": "English"
        },
        "keywords": {
          "high": [
            {
              "keyword": "your main keyword",
              "targetPosition": 3,
              "trackingFrequency": "daily",
              "searchVolume": 1000
            }
          ]
        }
      }
    }
  }
}
```

Then import to database:

```bash
npm run import
```

---

## Step 5: Run Initial Tracking

```bash
# Track all high-priority keywords
npm run track:high

# View results
npm run dashboard
```

**Expected output:**
```
📊 SERP Tracker Dashboard
════════════════════════════════════════

  📁 My Website
  ──────────────────────────────────────

  Keyword              Position    Target    Status
  ──────────────────────────────────────────────────
  your main keyword    #5 🏆       #3        2 away
```

---

## Optional: Automated Tracking

### Using Cron (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add these lines for automated tracking:

# High priority - daily at 2 AM
0 2 * * * cd /path/to/serp-tracker && npm run track:high

# Medium priority - weekly on Mondays at 9 AM
0 9 * * 1 cd /path/to/serp-tracker && npm run track:medium

# Low priority - monthly on 1st at 10 AM
0 10 1 * * cd /path/to/serp-tracker && npm run track:low
```

### Using Task Scheduler (Windows)

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 2:00 AM
4. Action: Start a program
   - Program: `node`
   - Arguments: `scripts/track-priority-keywords.js --priority high`
   - Start in: `C:\path\to\serp-tracker`

---

## Optional: Notion Integration

### Setup Notion Workspace

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Name it "SERP Tracker"
4. Copy the Internal Integration Token

### Create Databases

1. Create new page in Notion
2. Run setup command:
   ```bash
   npm run sync:notion -- --setup
   ```
3. Follow prompts to connect databases

### Add to .env

```bash
NOTION_TOKEN=secret_xxxxxxxxxxxxx
NOTION_KEYWORDS_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Sync Data

```bash
# Manual sync
npm run sync:notion

# Add to cron for automated sync
0 3 * * * cd /path/to/serp-tracker && npm run sync:notion
```

---

## Optional: Google Search Console Integration

### Prerequisites

1. Google Cloud account
2. Search Console API enabled
3. Service account with permissions

### Setup Steps

1. **Create Service Account:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing
   - Enable "Search Console API"
   - Create service account
   - Download JSON key file

2. **Grant Permissions:**
   - Go to [Google Search Console](https://search.google.com/search-console)
   - Select your property
   - Settings → Users and permissions
   - Add service account email as user

3. **Configure:**
   ```bash
   # In .env
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
   GSC_PROPERTY_URL=sc-domain:example.com
   ```

4. **Sync Data:**
   ```bash
   npm run sync:gsc
   ```

---

## Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker ps | grep serp-postgres
# or
pg_isready

# Verify credentials in .env
cat .env | grep POSTGRES
```

### DataForSEO API Error

```bash
# Test credentials
curl -u "username:password" https://api.dataforseo.com/v3/serp/google/organic/live/advanced

# Check quota
# Login to dataforseo.com dashboard
```

### Module Not Found Error

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Permission Denied (Unix/Linux)

```bash
# Make scripts executable
chmod +x bin/serp-tracker.js
chmod +x scripts/*.js
```

---

## Verification Checklist

- [ ] PostgreSQL running and accessible
- [ ] Database schema installed (6 tables created)
- [ ] `.env` file configured with credentials
- [ ] Dependencies installed (`npm install`)
- [ ] Test passes (`npm test`)
- [ ] Project added (`npm run setup`)
- [ ] Initial tracking successful (`npm run track:high`)
- [ ] Dashboard shows data (`npm run dashboard`)

---

## What's Next?

1. **Monitor Regularly:** Check dashboard daily
2. **Set Up Automation:** Configure cron jobs for hands-off tracking
3. **Optimize Costs:** Adjust tracking frequencies based on importance
4. **Add Competitors:** Track competitor positions
5. **Set Up Alerts:** Configure Slack/Discord webhooks for notifications
6. **Integrate Notion:** Build client-facing dashboards

---

## Getting Help

- **Documentation:** See [README.md](README.md) for features and usage
- **Issues:** [GitHub Issues](https://github.com/yourusername/serp-tracker/issues)
- **Community:** [Discussions](https://github.com/yourusername/serp-tracker/discussions)

---

## Uninstalling

```bash
# Stop Docker container
docker stop serp-postgres
docker rm serp-postgres

# Remove global installation
npm uninstall -g @magneteek/serp-tracker

# Or delete local directory
rm -rf /path/to/serp-tracker
```

---

**Installation complete! 🎉**

Run `npm run setup` to add your first project and start tracking!
