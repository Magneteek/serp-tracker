# SEO Domain

## Domain Overview

The SEO Domain provides comprehensive search engine optimization research, strategy, and implementation across keyword research, competitor analysis, technical SEO, on-page optimization, and search intent mapping. This domain integrates with DATAforSEO MCP server for real-time SEO data and analytics.

**Domain Focus**: Advanced SEO research, topical authority development, semantic clustering, and search intent optimization

---

## Specialized Agents

This domain leverages the following specialized Claude Code agents via the **Universal Agent Delegation Pattern**:

### Research & Analysis Agents
- **`seo-keyword-research`** - Advanced keyword discovery and opportunity identification
- **`seo-competitor-analysis`** - Competitive SEO analysis and intelligence
- **`seo-intent-mapping`** - Search intent analysis and query network optimization
- **`seo-serp-analysis`** - SERP feature analysis and search result optimization

### Content & Authority Agents
- **`seo-content-optimization`** - On-page SEO and content optimization
- **`seo-topical-authority`** - Topical authority development (Koray Gubur frameworks)
- **`seo-semantic-clustering`** - Semantic keyword clustering and topic modeling
- **`seo-query-networks`** - Query network analysis and relationship mapping

### Technical & Strategy Agents
- **`seo-technical-analysis`** - Technical SEO, Core Web Vitals, site architecture
- **`seo-local-seo`** - Local SEO optimization and Google Business Profile
- **`seo-ai-overviews`** - AI Overviews optimization for Google SGE
- **`seo-entity-optimization`** - Entity SEO and knowledge graph optimization

**See [../../.claude/agents/](../../.claude/agents/) for complete agent definitions.**

---

## SEO Workflows

### 1. Comprehensive Keyword Research

**Direct Agent Invocation**

```
Task tool → seo-keyword-research → Keyword Strategy

DATAforSEO Integration:
- Search volume analysis
- Keyword difficulty scores
- Related keywords discovery
- Competitive gap analysis
```

**Use When**: Starting new SEO campaign or content cluster

**Deliverables**:
```
/projects/[uuid]/deliverables/seo/
├── keyword-research.json          # Primary/secondary keywords
├── keyword-clusters.json          # Semantic groupings
└── opportunity-analysis.json      # Quick win opportunities
```

### 2. Competitor SEO Analysis

**Direct Agent Invocation**

```
Task tool → seo-competitor-analysis → Competitive Intelligence

DATAforSEO Queries:
- Competitor domain keywords
- Ranking overlaps
- Content gap analysis
- Backlink profiles
```

**Use When**: Entering competitive market or identifying content gaps

**Deliverables**:
```
/projects/[uuid]/deliverables/seo/
├── competitor-analysis.json       # Top competitors
├── content-gaps.json             # Opportunity gaps
└── keyword-gaps.json             # Untapped keywords
```

### 3. Topical Authority Development

**Direct Agent Invocation**

```
Task tool → seo-topical-authority → Authority Framework

Koray Gubur Methodology:
- Semantic topic networks
- Entity relationships
- Content depth requirements
- Authority signals
```

**Use When**: Building comprehensive topical coverage

**Deliverables**:
```
/projects/[uuid]/deliverables/seo/
├── topical-authority-map.json    # Topic clusters
├── content-network.json          # Internal linking
└── entity-optimization.json      # Entity relationships
```

### 4. Search Intent Mapping

**Direct Agent Invocation**

```
Task tool → seo-intent-mapping → Intent Analysis

Intent Classification:
- Informational
- Navigational
- Commercial
- Transactional
```

**Use When**: Planning content strategy and user journeys

**Deliverables**:
```
/projects/[uuid]/deliverables/seo/
├── intent-mapping.json           # Intent classification
├── user-journey-map.json        # Search paths
└── query-networks.json          # Related searches
```

### 5. Technical SEO Audit

**Direct Agent Invocation**

```
Task tool → seo-technical-analysis → Technical Audit

Analysis Coverage:
- Core Web Vitals
- Crawl analysis
- Site architecture
- Schema markup
- Mobile-first optimization
```

**Use When**: Website launch or technical optimization

**Deliverables**:
```
/projects/[uuid]/deliverables/seo/
├── technical-audit.json          # Issues & recommendations
├── core-web-vitals.json         # Performance metrics
└── schema-recommendations.json   # Structured data
```

---

## Integration with Universal Agent Pattern

All SEO agents follow the **Universal Agent Delegation Pattern** documented in [../../CLAUDE.md](../../CLAUDE.md):

### Direct Invocation Pattern
```javascript
// For single SEO analysis
Task(
  subagent_type="seo-keyword-research",
  prompt="Research keywords for [topic] targeting [audience]..."
)
```

### Parallel Execution Pattern
```javascript
// For comprehensive SEO strategy
// Launch ALL simultaneously in ONE message
Task(subagent_type="seo-keyword-research", prompt="Research keywords...")
Task(subagent_type="seo-competitor-analysis", prompt="Analyze competitors...")
Task(subagent_type="seo-intent-mapping", prompt="Map search intents...")
Task(subagent_type="seo-technical-analysis", prompt="Audit technical SEO...")
// All execute in parallel, massive time savings
```

### DATAforSEO MCP Integration
```javascript
// Agents automatically use DATAforSEO MCP tools
mcp__dataforseo__keyword_overview(keywords: ["keyword1", "keyword2"])
mcp__dataforseo__related_keywords(keyword: "primary keyword")
mcp__dataforseo__competitor_domains(target: "example.com")
mcp__dataforseo__search_intent(keywords: ["keyword1", "keyword2"])
```

---

## DATAforSEO MCP Server Integration

### Available MCP Tools

**Keyword Research**:
```javascript
mcp__dataforseo__keyword_overview
  - Search volume, CPC, competition
  - Up to 1000 keywords per call

mcp__dataforseo__related_keywords
  - Google "searches related to" data
  - Semantic keyword discovery

mcp__dataforseo__keyword_suggestions
  - Autocomplete suggestions
  - Long-tail opportunities

mcp__dataforseo__keyword_ideas
  - Category-based keyword ideas
  - Topical expansion
```

**Competitive Analysis**:
```javascript
mcp__dataforseo__domain_keywords
  - Keywords a domain ranks for
  - Ranking positions and metrics

mcp__dataforseo__competitor_domains
  - Find competitor domains
  - Competitive landscape analysis

mcp__dataforseo__domain_intersection
  - Shared ranking keywords
  - Content overlap analysis

mcp__dataforseo__traffic_estimation
  - Organic traffic estimates
  - Performance benchmarking
```

**SERP Analysis**:
```javascript
mcp__dataforseo__serp_competitors
  - SERP ranking competitors
  - Feature box occupancy

mcp__dataforseo__search_intent
  - Intent classification (info/nav/commercial/transactional)
  - User journey insights
```

**Technical SEO**:
```javascript
mcp__dataforseo__onpage_lighthouse
  - Lighthouse performance audit
  - Technical SEO metrics

mcp__dataforseo__onpage_summary
  - Core Web Vitals
  - On-page optimization

mcp__dataforseo__content_analysis_summary
  - Content quality analysis
  - Optimization opportunities
```

### Usage Example
```javascript
// SEO keyword research agent automatically uses:
const keywordData = await mcp__dataforseo__keyword_overview({
  keywords: ["dental implants", "teeth implants cost"],
  location_code: 2840, // USA
  language_name: "English"
})

const relatedKeywords = await mcp__dataforseo__related_keywords({
  keyword: "dental implants",
  limit: 100
})

const searchIntent = await mcp__dataforseo__search_intent({
  keywords: ["dental implants", "implant dentist near me"]
})
```

---

## File Organization

### SEO Deliverables Structure
```
/projects/[client-uuid]/
├── deliverables/
│   └── seo/
│       ├── keyword-research/
│       │   ├── primary-keywords.json
│       │   ├── secondary-keywords.json
│       │   ├── long-tail-opportunities.json
│       │   └── keyword-clusters/
│       ├── competitor-analysis/
│       │   ├── top-competitors.json
│       │   ├── content-gaps.json
│       │   └── backlink-analysis.json
│       ├── content-strategy/
│       │   ├── topical-authority-map.json
│       │   ├── content-network.json
│       │   └── internal-linking-architecture.json
│       ├── technical-seo/
│       │   ├── technical-audit.json
│       │   ├── core-web-vitals.json
│       │   └── schema-markup-recommendations.json
│       └── search-intent/
│           ├── intent-mapping.json
│           └── user-journey-maps.json
├── client-intelligence/
│   └── icp-analysis.json              # Used for audience targeting
└── crystalline-memory-index.json
```

### Integration with Content Domain
```
SEO Research → Content Creation:
- Keyword strategy informs content topics
- Search intent guides content structure
- Topical authority maps define cluster content
- Query networks inform internal linking
```

---

## SEO Best Practices

### 1. Start with Comprehensive Research
```javascript
// Launch all research agents in parallel
Task(subagent_type="seo-keyword-research", ...)
Task(subagent_type="seo-competitor-analysis", ...)
Task(subagent_type="seo-intent-mapping", ...)
// Complete research foundation before content creation
```

### 2. Use Search Intent for Content Strategy
```javascript
// Map intent to content type
Informational → Blog posts, guides, educational content
Navigational → Brand pages, category pages
Commercial → Comparison pages, reviews, "best of" content
Transactional → Product pages, service pages, CTAs
```

### 3. Build Topical Authority Systematically
```javascript
// Use seo-topical-authority agent
1. Identify core topic pillars
2. Map semantic relationships
3. Create comprehensive cluster content
4. Implement internal linking architecture
5. Optimize entity relationships
```

### 4. Integrate with Client Psychographics
```javascript
// Reference ICP for audience-targeted SEO
const icp = await memory.retrieve(`${clientName}-ICP`)

// Target keywords matching ICP search behavior
"Primary audience: ${icp.segments[0].description}
 Search patterns: ${icp.segments[0].searchBehavior}
 Pain point keywords: ${icp.segments[0].painPoints}"
```

### 5. Monitor Technical SEO Continuously
```javascript
// Regular technical audits
Task(
  subagent_type="seo-technical-analysis",
  prompt="Run comprehensive technical SEO audit focusing on Core Web Vitals..."
)
// Quarterly or after major site changes
```

---

## Topical Authority Development

### Koray Tugberk Gubur Frameworks

The SEO domain implements advanced topical authority frameworks:

**Semantic Topic Networks**:
```
Core Topic (Dental Implants)
  ├── Entity Relationships
  │   ├── Procedure types
  │   ├── Materials (titanium, zirconia)
  │   └── Brands (Nobel Biocare, Straumann)
  ├── Semantic Clusters
  │   ├── Cost & pricing
  │   ├── Procedure & recovery
  │   └── Alternatives & comparisons
  └── Content Depth Requirements
      ├── Comprehensive guides (3000+ words)
      ├── Detailed procedures (1500+ words)
      └── Supporting content (800+ words)
```

**Agent Usage**:
```javascript
Task(
  subagent_type="seo-topical-authority",
  prompt="Develop topical authority framework for [topic] using Koray Gubur methodology..."
)
```

---

## Search Intent Optimization

### Intent Classification Framework

**Informational Intent** (Know):
```
- Question-based queries ("what is", "how to", "why")
- Educational content targeting
- Blog posts, guides, tutorials
```

**Navigational Intent** (Go):
```
- Brand-specific searches
- Category browsing
- Site navigation optimization
```

**Commercial Intent** (Know + Commercial):
```
- Research phase ("best", "top", "vs", "review")
- Comparison content
- Evaluation guides
```

**Transactional Intent** (Do):
```
- Action-oriented ("buy", "book", "schedule", "quote")
- Conversion-focused pages
- Service/product pages with CTAs
```

**Agent Usage**:
```javascript
Task(
  subagent_type="seo-intent-mapping",
  prompt="Map search intent for keyword cluster [cluster name] and recommend content types..."
)
```

---

## Local SEO Optimization

### Google Business Profile Optimization

**Agent**: `seo-local-seo`

**Capabilities**:
```
- Google Maps optimization
- Local citation building
- NAP consistency
- Local keyword targeting
- Review management integration
```

**DATAforSEO Local Tools**:
```javascript
mcp__dataforseo__serp_google_maps
  - Local pack analysis
  - Competitor local rankings

mcp__dataforseo__business_data_search
  - Business discovery
  - Local competitive analysis
```

**Use When**: Local business optimization, multi-location SEO

---

## AI Overviews Optimization

### Google SGE (Search Generative Experience)

**Agent**: `seo-ai-overviews`

**Optimization Focus**:
```
- AI-friendly content structure
- Entity optimization for AI understanding
- Featured snippet targeting
- Question-answer format optimization
- Structured data implementation
```

**Use When**: Preparing for AI-powered search results

---

## Performance Metrics

### SEO Research Quality Targets
- **Keyword Coverage**: 100+ primary/secondary keywords per project
- **Competitive Analysis**: Top 5-10 competitors analyzed
- **Intent Mapping**: All keywords classified by intent
- **Topical Authority**: Complete cluster maps for core topics

### DATAforSEO Integration
- **API Response Time**: <2s average
- **Data Accuracy**: Real-time search volume and metrics
- **Coverage**: Global location and language support

### Content Integration
- **SEO → Content Handoff**: Keyword strategy to content outline
- **Natural Integration**: Keywords flow naturally (not forced)
- **Internal Linking**: 80%+ cluster content interconnected

---

## Troubleshooting

### Common Issues

**1. DATAforSEO API Errors**
```bash
# Check MCP server connection
# Verify API credentials in .env
# Check rate limits (requests per minute)
```

**2. Keyword Data Discrepancies**
```bash
# Different location codes yield different results
# Ensure consistent location_code parameter
# Default: 2840 (USA)
```

**3. Missing Search Intent Data**
```bash
# Use mcp__dataforseo__search_intent tool
# Fallback to SERP analysis for intent classification
```

**4. Technical SEO Audit Timeouts**
```bash
# Large sites may timeout
# Break into smaller sections
# Use pagination parameters
```

---

## Testing

### Manual SEO Research Test
```bash
# 1. Keyword research
Task(
  subagent_type="seo-keyword-research",
  prompt="Research keywords for 'dental implants' targeting anxious patients in USA..."
)

# Expected: 50+ keywords with volume, difficulty, intent

# 2. Competitor analysis
Task(
  subagent_type="seo-competitor-analysis",
  prompt="Analyze top 5 competitors for 'dental implants' niche..."
)

# Expected: Competitor domains, ranking keywords, content gaps

# 3. Intent mapping
Task(
  subagent_type="seo-intent-mapping",
  prompt="Map search intent for dental implants keyword cluster..."
)

# Expected: Intent classification (info/nav/commercial/transactional)
```

---

## Related Documentation

- **[../../CLAUDE.md](../../CLAUDE.md)** - Main ORCHESTRAI architecture
- **[../../UNIVERSAL-AGENT-DELEGATION-PATTERN.md](../../UNIVERSAL-AGENT-DELEGATION-PATTERN.md)** - Agent invocation patterns
- **[../../.claude/agents/seo-keyword-research.md](../../.claude/agents/seo-keyword-research.md)** - Keyword research agent
- **[../../.claude/agents/seo-topical-authority.md](../../.claude/agents/seo-topical-authority.md)** - Topical authority agent
- **[../content/CLAUDE.md](../content/CLAUDE.md)** - Content domain integration

---

**This domain follows the Universal Agent Delegation Pattern with DATAforSEO MCP server integration. See main [CLAUDE.md](../../CLAUDE.md) for system-wide architecture principles.**
