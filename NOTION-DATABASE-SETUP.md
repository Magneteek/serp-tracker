# Notion Database Setup for SERP Tracker

## Overview

This guide walks you through setting up the Notion workspace for the ORCHESTRAI SERP Tracker system. The setup creates four interconnected databases that provide a comprehensive view of keyword performance, position history, competitor tracking, and automated alerts.

---

## Prerequisites

1. **Notion Account**: Workspace with API access
2. **Notion Integration**: Created at https://www.notion.so/my-integrations
3. **API Token**: From your integration (stored in `.env` as `NOTION_TOKEN`)
4. **Permissions**: Integration must have read/write access to target workspace

---

## Database Structure

### Database 1: Keywords Tracker

**Purpose**: Central hub for all tracked keywords across client projects

#### Properties

| Property Name | Type | Configuration | Description |
|--------------|------|---------------|-------------|
| Keyword | Title | - | The actual keyword being tracked |
| Project | Select | See options below | Client project identifier |
| Priority | Select | High, Medium, Low | Business priority level |
| Current Position | Number | - | Latest SERP position |
| Previous Position | Number | - | Position from last check |
| Change | Formula | `prop("Previous Position") - prop("Current Position")` | Position movement (positive = improved) |
| Target Position | Number | - | Goal ranking position |
| Distance to Target | Formula | `prop("Current Position") - prop("Target Position")` | How far from goal |
| Search Volume | Number | - | Monthly search volume |
| Tracking Frequency | Select | Daily, Weekly, Monthly | How often to check |
| Device | Select | Desktop, Mobile | Device type for tracking |
| Location | Text | - | Geographic location |
| Last Checked | Date | - | Last position check date |
| Status | Select | Active, Paused, Archived | Tracking status |
| Position Tier | Formula | See below | Categorize by position range |
| Trend | Select | ↗️ Improving, → Stable, ↘️ Declining | Visual trend indicator |
| History | Relation | → Position History | Link to historical data |
| Competitors | Relation | → Competitor Positions | Link to competitor data |

**Position Tier Formula:**
```
if(prop("Current Position") <= 3, "🥇 Top 3", if(prop("Current Position") <= 10, "🏆 Top 10", if(prop("Current Position") <= 20, "⭐ Top 20", if(prop("Current Position") <= 50, "📊 Top 50", "📉 Beyond 50"))))
```

**Project Options:**
- DeleteReviews.nl (drnl-A0582FF4...)
- NaSmehPG (nasmehpg-2d61080a...)
- QuartzIQ (quartziq-EA511E99...)
- [Add your projects]

---

### Database 2: Position History

**Purpose**: Time-series tracking of position changes over time

#### Properties

| Property Name | Type | Configuration | Description |
|--------------|------|---------------|-------------|
| Date | Title | - | Date of position check |
| Keyword | Relation | → Keywords Tracker | Link to keyword |
| Position | Number | - | SERP position on this date |
| URL | URL | - | Ranking URL |
| Device | Select | Desktop, Mobile | Device type |
| Location | Text | - | Geographic location |
| Data Source | Select | GSC, DataForSEO | Which API provided data |
| SERP Features | Multi-select | See options below | SERP features present |
| Change from Previous | Number | - | Position change since last check |
| Notes | Text | - | Optional notes or context |

**SERP Features Options:**
- Featured Snippet
- Local Pack
- People Also Ask
- Image Pack
- Video Results
- Knowledge Panel
- Shopping Results
- Top Stories
- Reviews
- Sitelinks

---

### Database 3: Competitor Positions

**Purpose**: Track competitor rankings for your target keywords

#### Properties

| Property Name | Type | Configuration | Description |
|--------------|------|---------------|-------------|
| Keyword | Relation | → Keywords Tracker | Link to tracked keyword |
| Competitor Domain | Text | - | Competitor's domain name |
| Position | Number | - | Their current position |
| URL | URL | - | Their ranking URL |
| Date | Date | - | Date of check |
| Device | Select | Desktop, Mobile | Device type |
| Gap to You | Number | - | Position difference (manual or formula) |
| SERP Features | Multi-select | Same as Position History | Features they have |
| Tracking Status | Checkbox | - | Active tracking |

---

### Database 4: Performance Alerts

**Purpose**: Automated alerts for significant changes and opportunities

#### Properties

| Property Name | Type | Configuration | Description |
|--------------|------|---------------|-------------|
| Alert Title | Title | - | Brief description of alert |
| Alert Type | Select | 🔴 Critical, ⚠️ Warning, 💡 Opportunity, 👁️ Competitor | Alert category |
| Keyword | Relation | → Keywords Tracker | Related keyword |
| Project | Rollup | From Keyword → Project | Project name |
| Old Position | Number | - | Previous position |
| New Position | Number | - | Current position |
| Change | Formula | `prop("Old Position") - prop("New Position")` | Position change |
| Message | Text | - | Detailed alert message |
| Triggered Date | Date | - | When alert was created |
| Status | Select | 🆕 New, 👀 Reviewed, ✅ Actioned, 🗑️ Dismissed | Alert status |
| Priority | Select | High, Medium, Low | Action priority |

---

## Step-by-Step Setup Instructions

### Step 1: Create Workspace Structure

1. **Create a new page** in Notion called "SERP Tracker Dashboard"
2. **Add a cover image** (optional) - suggest SEO/analytics theme
3. **Add description**: "Automated SERP tracking system powered by ORCHESTRAI"

### Step 2: Create Databases

#### Create Keywords Tracker Database

1. Type `/database-full` on your dashboard page
2. Name it: **"Keywords Tracker"**
3. Add all properties listed above (use "+" button in table header)
4. Set up formulas for:
   - **Change**: `prop("Previous Position") - prop("Current Position")`
   - **Distance to Target**: `prop("Current Position") - prop("Target Position")`
   - **Position Tier**: Use formula provided above

#### Create Position History Database

1. Type `/database-full` below the Keywords Tracker
2. Name it: **"Position History"**
3. Add all properties
4. Create relation to Keywords Tracker:
   - Add Relation property
   - Select "Keywords Tracker" database
   - Enable "Show on Keywords Tracker" to create bidirectional link

#### Create Competitor Positions Database

1. Type `/database-full`
2. Name it: **"Competitor Positions"**
3. Add all properties
4. Create relation to Keywords Tracker

#### Create Performance Alerts Database

1. Type `/database-full`
2. Name it: **"Performance Alerts"**
3. Add all properties
4. Create relation to Keywords Tracker
5. Add rollup property for Project:
   - Relation: Keyword
   - Property: Project
   - Calculate: Show original

### Step 3: Create Dashboard Views

#### Keywords Tracker Views

1. **All Keywords** (default table view)
   - Group by: Project
   - Sort by: Priority (descending), Current Position (ascending)

2. **High Priority Dashboard** (board view)
   - Filter: Priority = "High"
   - Group by: Position Tier
   - Sort by: Current Position

3. **Need Optimization** (table view)
   - Filter:
     - Current Position is not empty
     - Distance to Target > 5
   - Sort by: Search Volume (descending)

4. **Recent Changes** (table view)
   - Filter: Last Checked is within past 7 days
   - Sort by: Change (descending)

#### Position History Views

1. **Last 30 Days** (calendar view)
   - Show by: Date property
   - Useful for seeing check frequency

2. **Keyword Timeline** (list view)
   - Group by: Keyword
   - Sort by: Date (descending)

#### Performance Alerts Views

1. **New Alerts** (table view)
   - Filter: Status = "🆕 New"
   - Sort by: Priority, Triggered Date (descending)

2. **By Alert Type** (board view)
   - Group by: Alert Type
   - Sort by: Triggered Date (descending)

3. **Critical Issues** (table view)
   - Filter: Alert Type = "🔴 Critical"
   - Sort by: Triggered Date (descending)

### Step 4: Get Database IDs

After creating databases, you need to get their IDs for the sync scripts:

1. **Open each database** as a full page
2. **Copy the URL** from your browser
3. **Extract the database ID**: It's the 32-character string after the workspace name and before the "?v="

Example URL:
```
https://www.notion.so/myworkspace/Keywords-Tracker-1234567890abcdef1234567890abcdef?v=...
                                               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                               This is your database ID
```

4. **Update tracking-config.json**:
```json
"notionConfig": {
  "databaseIds": {
    "keywords": "1234567890abcdef1234567890abcdef",
    "positionHistory": "abcdef1234567890abcdef1234567890",
    "competitors": "567890abcdef1234567890abcdef1234",
    "alerts": "90abcdef1234567890abcdef1234567890"
  }
}
```

### Step 5: Set Up Integration Permissions

1. **Open each database page**
2. **Click "•••" (more menu)** in top right
3. **Select "Add connections"**
4. **Choose your ORCHESTRAI integration**
5. **Repeat for all 4 databases**

---

## Dashboard Templates

### Create Project Dashboard Pages

For each client project, create a dedicated dashboard page:

1. **Create new page**: "DeleteReviews.nl SERP Dashboard"
2. **Add linked views** from main databases:

```
📊 DeleteReviews.nl SERP Performance Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 TOP KEYWORDS
[Linked view: Keywords Tracker filtered by Project = "DeleteReviews.nl"]
View: Table grouped by Priority

📈 POSITION TRENDS (30 DAYS)
[Linked view: Position History filtered by related Keyword → Project = "DeleteReviews.nl"]
View: Line chart (if available) or timeline

⚠️ ACTIVE ALERTS
[Linked view: Performance Alerts filtered by Project rollup = "DeleteReviews.nl"]
View: Board grouped by Alert Type

👥 COMPETITOR TRACKING
[Linked view: Competitor Positions filtered by Keyword → Project = "DeleteReviews.nl"]
View: Table grouped by Competitor Domain
```

### Weekly Report Template

Create a template for weekly reports:

```
📅 SERP Report: [Week of DATE]
Project: [PROJECT NAME]

🎯 KEY METRICS
• Total Keywords Tracked: [NUMBER]
• Average Position: [NUMBER]
• Keywords in Top 10: [NUMBER]
• Biggest Gains: [KEYWORD] (+[X] positions)
• Biggest Losses: [KEYWORD] (-[X] positions)

📊 HIGHLIGHTS
[Embedded linked view: Recent Changes filtered by project]

⚠️ ALERTS THIS WEEK
[Embedded linked view: Alerts from past 7 days]

💡 RECOMMENDED ACTIONS
1. [Action item from alerts]
2. [Optimization opportunity]
3. [Content update needed]
```

---

## Automation Tips

### Formula Examples

**Traffic Potential (in Keywords Tracker):**
```
prop("Search Volume") * (0.30 - prop("CTR")) * 100
```

**Days Since Last Check:**
```
dateBetween(now(), prop("Last Checked"), "days")
```

**Position Health Score (0-100):**
```
if(prop("Current Position") > 50, 0, if(prop("Current Position") <= 3, 100, if(prop("Current Position") <= 10, 80, if(prop("Current Position") <= 20, 60, 40))))
```

### Conditional Formatting

Use Notion's conditional formatting to highlight:

- **Green**: Position improved (Change > 0)
- **Red**: Position declined (Change < 0)
- **Yellow**: New to top 10 (Current Position <= 10 AND Previous Position > 10)

---

## Integration with Sync Scripts

The sync scripts will:

1. **Create new keyword entries** automatically from tracking-config.json
2. **Update Current Position** daily/weekly based on schedule
3. **Create Position History records** after each check
4. **Generate alerts** when thresholds are exceeded
5. **Update competitor data** for specified domains

---

## Maintenance Schedule

### Daily
- Review new alerts
- Check high-priority keyword positions

### Weekly
- Review position trends
- Update target positions if needed
- Mark alerts as reviewed/actioned

### Monthly
- Archive old alerts (>90 days)
- Review and update competitor list
- Audit keyword list (add/remove/reprioritize)
- Export historical data for backup

---

## Mobile App Usage

The Notion mobile app allows you to:
- Check keyword positions on the go
- Receive push notifications for new alerts (set up Notion notifications)
- Review weekly reports
- Quick-add new keywords to track

---

## Troubleshooting

### Common Issues

**Issue**: Relations not working between databases
**Solution**: Make sure relations are bidirectional and databases are in the same workspace

**Issue**: Formulas showing errors
**Solution**: Check property names match exactly (case-sensitive)

**Issue**: Sync script can't find database
**Solution**: Verify database ID is correct and integration has permissions

**Issue**: Charts not showing data
**Solution**: Ensure you have enough data points (minimum 2-3 entries)

---

## Next Steps

After setup:

1. **Manually add 2-3 test keywords** to verify structure
2. **Run initialization script**: `node orchestrai-domains/seo/scripts/init-notion-databases.js`
3. **Verify sync**: `node orchestrai-domains/seo/scripts/sync-to-notion.js --test`
4. **Set up notifications**: Configure which alerts trigger Notion push notifications
5. **Share with team**: Add team members to workspace and assign permissions

---

## Resources

- [Notion API Documentation](https://developers.notion.com/)
- [Notion Formulas Guide](https://www.notion.so/help/formulas)
- [ORCHESTRAI Notion MCP](../../orchestrai-shared/mcp-servers/mcp-config.json)

---

**Setup Status**: ⏳ Pending manual creation in Notion workspace

Once databases are created, update `tracking-config.json` with the database IDs and run the initialization script to populate with your configured keywords.
