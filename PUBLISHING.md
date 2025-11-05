# 📦 Publishing Guide - SERP Tracker

Complete guide to publishing the SERP Tracker tool to npm and GitHub.

---

## Prerequisites

- [x] npm account ([Sign up](https://www.npmjs.com/signup))
- [x] GitHub account
- [x] Git installed locally
- [x] Node.js v18+

---

## Step 1: Create GitHub Repository

### Option A: Via GitHub Website

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `serp-tracker`
3. Description: "Professional keyword position tracking tool using DataForSEO and PostgreSQL"
4. Visibility: **Public** (for npm publication)
5. **Do NOT initialize with README** (we already have one)
6. Click "Create repository"

### Option B: Via GitHub CLI

```bash
# Install GitHub CLI if needed
brew install gh  # macOS
# or download from https://cli.github.com

# Login
gh auth login

# Create repository
gh repo create serp-tracker --public --description "Professional keyword position tracking tool using DataForSEO and PostgreSQL"
```

---

## Step 2: Initialize Git and Push

```bash
# Navigate to project
cd /Users/kris/standalone-serp-tracker

# Initialize git (if not already)
git init

# Add remote (replace 'yourusername' with your GitHub username)
git remote add origin https://github.com/yourusername/serp-tracker.git

# Add all files
git add .

# Commit
git commit -m "Initial release - v1.0.0

Features:
- Precise SERP position tracking with DataForSEO
- PostgreSQL time-series database
- Interactive CLI setup wizard
- Beautiful terminal dashboard
- Notion and GSC integration
- Automated tracking with cron support
- Intelligent caching and cost optimization"

# Push to GitHub
git push -u origin main
```

---

## Step 3: Update package.json

Before publishing, update these fields in `package.json`:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOURUSERNAME/serp-tracker"
  },
  "bugs": {
    "url": "https://github.com/YOURUSERNAME/serp-tracker/issues"
  },
  "homepage": "https://github.com/YOURUSERNAME/serp-tracker#readme"
}
```

Replace `YOURUSERNAME` with your actual GitHub username.

---

## Step 4: Publish to npm

### First-Time Setup

```bash
# Login to npm (if not already logged in)
npm login

# Verify you're logged in
npm whoami
```

### Publish Package

```bash
# Navigate to project
cd /Users/kris/standalone-serp-tracker

# Test package before publishing
npm pack
# This creates a .tgz file - you can inspect it

# Publish to npm
npm publish --access public

# If using scoped package (@magneteek/serp-tracker)
npm publish --access public
```

**Important:** The `--access public` flag is required for scoped packages (@organization/package-name).

### Verify Publication

```bash
# Check on npm
npm info @magneteek/serp-tracker

# Or visit
# https://www.npmjs.com/package/@magneteek/serp-tracker
```

---

## Step 5: Create GitHub Release

### Via GitHub Website

1. Go to your repository: `https://github.com/yourusername/serp-tracker`
2. Click "Releases" → "Create a new release"
3. Tag version: `v1.0.0`
4. Release title: `v1.0.0 - Initial Release`
5. Description:

```markdown
## 🎉 Initial Release

Professional SERP tracking tool with DataForSEO integration and PostgreSQL storage.

### ✨ Features

- 🎯 Precise position tracking (1-100)
- 📊 Historical data with PostgreSQL
- 🌍 200+ countries and languages
- 🚨 Smart alerts and notifications
- 🎨 Beautiful CLI dashboard
- 📝 Notion integration
- 🔍 Google Search Console sync
- 💰 Cost-optimized tracking

### 📦 Installation

```bash
npm install -g @magneteek/serp-tracker
```

### 🚀 Quick Start

```bash
# Set up database
docker run --name serp-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=serp_tracker \
  -p 5432:5432 -d postgres:15

# Configure and add project
npm run setup

# Start tracking
npm run track:high

# View results
npm run dashboard
```

### 📖 Documentation

- [Installation Guide](INSTALLATION.md)
- [README](README.md)
- [Quick Start](QUICK-START.md)

### 💰 Pricing

**$0.00075 per keyword check**

Example: 50 keywords = ~$1.13/month

### 🙏 Credits

Built with ❤️ by ORCHESTRAI
```

6. Click "Publish release"

### Via GitHub CLI

```bash
gh release create v1.0.0 \
  --title "v1.0.0 - Initial Release" \
  --notes "Initial release of SERP Tracker - Professional keyword position tracking tool"
```

---

## Step 6: Add Topics and Tags (GitHub)

1. Go to repository homepage
2. Click ⚙️ (settings icon) next to "About"
3. Add topics:
   - `seo`
   - `serp`
   - `tracking`
   - `keyword-tracking`
   - `rank-tracker`
   - `dataforseo`
   - `google-search-console`
   - `postgresql`
   - `cli-tool`
   - `seo-tools`

---

## Step 7: Create Documentation (Optional but Recommended)

### Add GitHub Wiki

1. Go to repository → Wiki
2. Create pages:
   - Getting Started
   - Configuration Guide
   - API Reference
   - Troubleshooting
   - FAQ

### Add Issue Templates

Create `.github/ISSUE_TEMPLATE/`:

```bash
mkdir -p .github/ISSUE_TEMPLATE
```

**Bug Report** (`.github/ISSUE_TEMPLATE/bug_report.md`):
```markdown
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Run command '...'
2. See error

**Expected behavior**
What you expected to happen.

**Environment:**
 - OS: [e.g., macOS 14]
 - Node version: [e.g., v18.0.0]
 - Package version: [e.g., 1.0.0]

**Additional context**
Any other information about the problem.
```

**Feature Request** (`.github/ISSUE_TEMPLATE/feature_request.md`):
```markdown
---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

---

## Step 8: Update Version for Future Releases

```bash
# Increment version (patch: 1.0.0 → 1.0.1)
npm version patch

# Or minor version (1.0.0 → 1.1.0)
npm version minor

# Or major version (1.0.0 → 2.0.0)
npm version major

# This automatically creates a git tag and commits

# Push changes and tags
git push && git push --tags

# Publish updated version
npm publish --access public
```

---

## Step 9: Promote Your Package

### npm README

The README.md automatically becomes your npm package page. Make sure it's comprehensive!

### Social Media

Share on:
- Twitter/X with hashtags: #SEO #SERP #OpenSource
- LinkedIn
- Reddit: r/SEO, r/opensource, r/node
- Dev.to article

### Example Tweet

```
🚀 Just published SERP Tracker - an open-source keyword position tracking tool!

✨ Features:
📊 PostgreSQL time-series data
🎯 DataForSEO integration
🎨 Beautiful CLI dashboard
💰 ~$1/month for 50 keywords

Try it: npm i -g @magneteek/serp-tracker

#SEO #OpenSource #NodeJS
```

---

## Step 10: Maintenance

### Monitoring

- Watch GitHub issues
- Monitor npm download stats: `npm info @magneteek/serp-tracker`
- Check security vulnerabilities: `npm audit`

### Regular Updates

```bash
# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Update and publish
npm version patch
git push && git push --tags
npm publish --access public
```

---

## Checklist Before Publishing

- [ ] All credentials removed from code
- [ ] `.env.example` file created
- [ ] `.gitignore` properly configured
- [ ] README.md is comprehensive
- [ ] INSTALLATION.md is complete
- [ ] package.json has correct metadata
- [ ] GitHub repository created
- [ ] Code committed and pushed
- [ ] Tested installation from npm
- [ ] GitHub release created
- [ ] Topics/tags added
- [ ] License file included (MIT)

---

## Unpublishing (Emergency Only)

If you need to unpublish (not recommended):

```bash
# Unpublish specific version
npm unpublish @magneteek/serp-tracker@1.0.0

# Unpublish entire package (within 72 hours of publish)
npm unpublish @magneteek/serp-tracker --force
```

**Note:** npm discourages unpublishing. Instead, publish a new fixed version.

---

## Success! 🎉

Your package is now live:
- **npm:** `https://www.npmjs.com/package/@magneteek/serp-tracker`
- **GitHub:** `https://github.com/yourusername/serp-tracker`

Users can now install with:
```bash
npm install -g @magneteek/serp-tracker
```

---

## Next Steps

1. Star your own repository ⭐
2. Share with the community
3. Respond to issues and PRs
4. Keep dependencies updated
5. Add new features based on feedback
6. Write blog posts/tutorials
7. Create video walkthrough

**Happy publishing! 🚀**
