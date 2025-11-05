/**
 * SEO Research Pipeline - Executable Implementation
 *
 * Complete SEO research workflow from keyword discovery to content strategy.
 * Integrates with AsyncCoordinationPatterns for orchestrated execution.
 *
 * Stages:
 * 1. Keyword Discovery & Analysis
 * 2. Search Intent Analysis & User Journey Mapping
 * 3. SERP & Competitive Analysis
 * 4. Semantic Clustering & Topic Architecture
 * 5. SEO Strategy & Content Calendar
 * 6. Crystalline Memory Integration
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

class SEOResearchPipeline extends EventEmitter {
  constructor(coordinationPatterns, crystallineMemory, mcpManager) {
    super();

    this.coordinationPatterns = coordinationPatterns;
    this.crystallineMemory = crystallineMemory;
    this.mcpManager = mcpManager;

    this.pipelineId = 'seo-research';
    this.pipelineName = 'SEO Research Pipeline';

    // Pipeline state
    this.activeExecutions = new Map();
    this.executionHistory = [];

    // Performance metrics
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      averageDuration: 0,
      stageSuccessRates: {}
    };

    console.log('🔍 SEO Research Pipeline initialized');
  }

  /**
   * Execute complete SEO research pipeline
   */
  async execute(projectSpec, options = {}) {
    const executionId = uuidv4();
    const startTime = Date.now();

    try {
      console.log(`🚀 Starting SEO Research Pipeline: ${executionId}`);

      // Validate project specification
      this.validateProjectSpec(projectSpec);

      // Initialize execution state
      const execution = {
        executionId,
        pipelineId: this.pipelineId,
        projectUuid: projectSpec.projectUuid,
        clientName: projectSpec.clientName,
        targetMarket: projectSpec.targetMarket || 'Netherlands',
        language: projectSpec.language || 'Dutch',
        startTime,
        currentStage: null,
        stageResults: {},
        status: 'executing'
      };

      this.activeExecutions.set(executionId, execution);

      // Stage 1: Keyword Discovery & Analysis
      execution.currentStage = 'keyword_discovery';
      const keywordData = await this.executeKeywordDiscovery(execution, projectSpec);
      execution.stageResults.keyword_discovery = keywordData;

      // Stage 2: Search Intent Analysis
      execution.currentStage = 'search_intent_analysis';
      const intentData = await this.executeSearchIntentAnalysis(execution, keywordData);
      execution.stageResults.search_intent_analysis = intentData;

      // Stage 3: Competitor Analysis
      execution.currentStage = 'competitor_analysis';
      const competitorData = await this.executeCompetitorAnalysis(execution, keywordData);
      execution.stageResults.competitor_analysis = competitorData;

      // Stage 4: Semantic Clustering
      execution.currentStage = 'semantic_clustering';
      const semanticData = await this.executeSemanticClustering(execution, keywordData, intentData);
      execution.stageResults.semantic_clustering = semanticData;

      // Stage 5: Strategy Generation
      execution.currentStage = 'strategy_generation';
      const strategyData = await this.executeStrategyGeneration(execution, semanticData, competitorData);
      execution.stageResults.strategy_generation = strategyData;

      // Stage 6: Memory Integration
      execution.currentStage = 'memory_integration';
      const memoryData = await this.executeMemoryIntegration(execution);
      execution.stageResults.memory_integration = memoryData;

      // Complete execution
      const duration = Date.now() - startTime;
      execution.status = 'completed';
      execution.duration = duration;
      execution.completedAt = Date.now();

      // Update metrics
      this.updateMetrics(execution, true);

      // Store in history
      this.executionHistory.push({
        executionId,
        projectUuid: execution.projectUuid,
        clientName: execution.clientName,
        duration,
        success: true,
        completedAt: Date.now()
      });

      this.activeExecutions.delete(executionId);

      console.log(`✅ SEO Research Pipeline completed: ${executionId} (${duration}ms)`);

      this.emit('pipeline-completed', {
        executionId,
        success: true,
        duration,
        results: execution.stageResults
      });

      return {
        success: true,
        executionId,
        duration,
        results: execution.stageResults,
        deliverablePaths: this.getDeliverablePaths(execution)
      };

    } catch (error) {
      console.error(`❌ SEO Research Pipeline failed: ${executionId}`, error);

      const execution = this.activeExecutions.get(executionId);
      if (execution) {
        execution.status = 'failed';
        execution.error = error.message;
        this.updateMetrics(execution, false);
        this.activeExecutions.delete(executionId);
      }

      this.emit('pipeline-failed', {
        executionId,
        error: error.message,
        stage: execution?.currentStage
      });

      throw error;
    }
  }

  /**
   * Stage 1: Keyword Discovery & Analysis
   */
  async executeKeywordDiscovery(execution, projectSpec) {
    console.log('📋 Stage 1: Keyword Discovery & Analysis');

    const stageStart = Date.now();

    try {
      // Use MCP DataForSEO for keyword research
      const primaryKeywords = await this.mcpManager.callMCPTool(
        'dataforseo',
        'keyword_overview',
        {
          keywords: projectSpec.seedKeywords || [projectSpec.primaryKeyword],
          location_code: this.getLocationCode(execution.targetMarket),
          language_name: execution.language
        }
      );

      // Get related keywords
      const relatedKeywords = await this.mcpManager.callMCPTool(
        'dataforseo',
        'related_keywords',
        {
          keyword: projectSpec.primaryKeyword,
          location_code: this.getLocationCode(execution.targetMarket),
          language_name: execution.language,
          limit: 100
        }
      );

      // Get keyword suggestions
      const suggestedKeywords = await this.mcpManager.callMCPTool(
        'dataforseo',
        'keyword_suggestions',
        {
          keyword: projectSpec.primaryKeyword,
          location_code: this.getLocationCode(execution.targetMarket),
          language_name: execution.language,
          limit: 100
        }
      );

      // Combine and analyze keywords
      const allKeywords = this.combineAndRankKeywords(
        primaryKeywords,
        relatedKeywords,
        suggestedKeywords
      );

      // Save keyword data
      const outputPath = await this.saveKeywordData(execution, allKeywords);

      const result = {
        success: true,
        duration: Date.now() - stageStart,
        keywords: allKeywords,
        outputPath,
        stats: {
          totalKeywords: allKeywords.length,
          highVolumeKeywords: allKeywords.filter(k => k.searchVolume > 1000).length,
          lowDifficultyKeywords: allKeywords.filter(k => k.difficulty < 30).length
        }
      };

      this.emit('stage-completed', {
        executionId: execution.executionId,
        stage: 'keyword_discovery',
        result
      });

      return result;

    } catch (error) {
      console.error('❌ Keyword discovery failed:', error);
      throw new Error(`Keyword discovery failed: ${error.message}`);
    }
  }

  /**
   * Stage 2: Search Intent Analysis
   */
  async executeSearchIntentAnalysis(execution, keywordData) {
    console.log('🎯 Stage 2: Search Intent Analysis');

    const stageStart = Date.now();

    try {
      const keywords = keywordData.keywords.slice(0, 50); // Top 50 keywords

      // Analyze search intent using DataForSEO
      const intentAnalysis = await this.mcpManager.callMCPTool(
        'dataforseo',
        'search_intent',
        {
          keywords: keywords.map(k => k.keyword),
          location_code: this.getLocationCode(execution.targetMarket),
          language_name: execution.language
        }
      );

      // Map keywords to user journey stages
      const journeyMapping = this.mapKeywordsToUserJourney(keywords, intentAnalysis);

      // Save intent analysis
      const outputPath = await this.saveIntentAnalysis(execution, {
        intentAnalysis,
        journeyMapping
      });

      const result = {
        success: true,
        duration: Date.now() - stageStart,
        intentAnalysis,
        journeyMapping,
        outputPath,
        stats: {
          informational: journeyMapping.awareness.length,
          commercial: journeyMapping.consideration.length,
          transactional: journeyMapping.decision.length
        }
      };

      this.emit('stage-completed', {
        executionId: execution.executionId,
        stage: 'search_intent_analysis',
        result
      });

      return result;

    } catch (error) {
      console.error('❌ Search intent analysis failed:', error);
      throw new Error(`Search intent analysis failed: ${error.message}`);
    }
  }

  /**
   * Stage 3: Competitor Analysis
   */
  async executeCompetitorAnalysis(execution, keywordData) {
    console.log('🔍 Stage 3: Competitor Analysis');

    const stageStart = Date.now();

    try {
      const topKeywords = keywordData.keywords.slice(0, 10);
      const competitorData = [];

      // Analyze SERP competitors for top keywords
      for (const keyword of topKeywords) {
        const serpData = await this.mcpManager.callMCPTool(
          'dataforseo',
          'serp_competitors',
          {
            keyword: keyword.keyword,
            location_code: this.getLocationCode(execution.targetMarket),
            language_name: execution.language
          }
        );

        competitorData.push({
          keyword: keyword.keyword,
          competitors: serpData
        });
      }

      // Identify content gaps
      const contentGaps = this.identifyContentGaps(competitorData, execution.clientName);

      // Save competitor analysis
      const outputPath = await this.saveCompetitorAnalysis(execution, {
        competitorData,
        contentGaps
      });

      const result = {
        success: true,
        duration: Date.now() - stageStart,
        competitorData,
        contentGaps,
        outputPath,
        stats: {
          competitorsAnalyzed: competitorData.reduce((sum, c) => sum + c.competitors.length, 0),
          contentGaps: contentGaps.length,
          opportunityScore: this.calculateOpportunityScore(contentGaps)
        }
      };

      this.emit('stage-completed', {
        executionId: execution.executionId,
        stage: 'competitor_analysis',
        result
      });

      return result;

    } catch (error) {
      console.error('❌ Competitor analysis failed:', error);
      throw new Error(`Competitor analysis failed: ${error.message}`);
    }
  }

  /**
   * Stage 4: Semantic Clustering
   */
  async executeSemanticClustering(execution, keywordData, intentData) {
    console.log('🧩 Stage 4: Semantic Clustering');

    const stageStart = Date.now();

    try {
      const keywords = keywordData.keywords;

      // Create semantic clusters using LSA/topic modeling
      const clusters = this.createSemanticClusters(keywords, intentData.journeyMapping);

      // Build topic architecture
      const topicArchitecture = this.buildTopicArchitecture(clusters);

      // Plan internal linking structure
      const linkingArchitecture = this.planInternalLinking(clusters, topicArchitecture);

      // Save semantic clustering
      const outputPath = await this.saveSemanticClustering(execution, {
        clusters,
        topicArchitecture,
        linkingArchitecture
      });

      const result = {
        success: true,
        duration: Date.now() - stageStart,
        clusters,
        topicArchitecture,
        linkingArchitecture,
        outputPath,
        stats: {
          totalClusters: clusters.length,
          averageClusterSize: Math.round(clusters.reduce((sum, c) => sum + c.keywords.length, 0) / clusters.length),
          hubPages: topicArchitecture.hubs.length,
          spokePages: topicArchitecture.spokes.length
        }
      };

      this.emit('stage-completed', {
        executionId: execution.executionId,
        stage: 'semantic_clustering',
        result
      });

      return result;

    } catch (error) {
      console.error('❌ Semantic clustering failed:', error);
      throw new Error(`Semantic clustering failed: ${error.message}`);
    }
  }

  /**
   * Stage 5: Strategy Generation
   */
  async executeStrategyGeneration(execution, semanticData, competitorData) {
    console.log('📊 Stage 5: SEO Strategy & Content Calendar');

    const stageStart = Date.now();

    try {
      // Create content calendar from clusters
      const contentCalendar = this.createContentCalendar(
        semanticData.clusters,
        semanticData.topicArchitecture,
        competitorData.contentGaps
      );

      // Prioritize content opportunities
      const priorityMatrix = this.prioritizeContentOpportunities(
        contentCalendar,
        competitorData.contentGaps
      );

      // Create implementation roadmap
      const roadmap = this.createImplementationRoadmap(
        contentCalendar,
        priorityMatrix
      );

      // Save strategy
      const outputPath = await this.saveSEOStrategy(execution, {
        contentCalendar,
        priorityMatrix,
        roadmap
      });

      const result = {
        success: true,
        duration: Date.now() - stageStart,
        contentCalendar,
        priorityMatrix,
        roadmap,
        outputPath,
        stats: {
          totalContentPieces: contentCalendar.length,
          highPriorityContent: priorityMatrix.filter(p => p.priority === 'high').length,
          estimatedTimeline: roadmap.totalWeeks
        }
      };

      this.emit('stage-completed', {
        executionId: execution.executionId,
        stage: 'strategy_generation',
        result
      });

      return result;

    } catch (error) {
      console.error('❌ Strategy generation failed:', error);
      throw new Error(`Strategy generation failed: ${error.message}`);
    }
  }

  /**
   * Stage 6: Memory Integration
   */
  async executeMemoryIntegration(execution) {
    console.log('🧠 Stage 6: Crystalline Memory Integration');

    const stageStart = Date.now();

    try {
      const results = execution.stageResults;

      // Create memory entities for SEO research
      const entities = [];

      // Store keyword data
      entities.push({
        name: `${execution.clientName}_seo_keywords`,
        entityType: 'SEOKeywordResearch',
        observations: [
          `Total keywords analyzed: ${results.keyword_discovery.stats.totalKeywords}`,
          `High-volume keywords: ${results.keyword_discovery.stats.highVolumeKeywords}`,
          `Target market: ${execution.targetMarket}`,
          `Language: ${execution.language}`,
          `Research date: ${new Date().toISOString()}`
        ]
      });

      // Store semantic clusters
      entities.push({
        name: `${execution.clientName}_semantic_clusters`,
        entityType: 'SemanticClustering',
        observations: [
          `Total clusters: ${results.semantic_clustering.stats.totalClusters}`,
          `Hub pages planned: ${results.semantic_clustering.stats.hubPages}`,
          `Spoke pages planned: ${results.semantic_clustering.stats.spokePages}`,
          `Topic architecture: Hub-Spoke model`
        ]
      });

      // Store content strategy
      entities.push({
        name: `${execution.clientName}_content_strategy`,
        entityType: 'ContentStrategy',
        observations: [
          `Content pieces planned: ${results.strategy_generation.stats.totalContentPieces}`,
          `High priority content: ${results.strategy_generation.stats.highPriorityContent}`,
          `Implementation timeline: ${results.strategy_generation.stats.estimatedTimeline} weeks`,
          `Strategy focus: SEO-driven content marketing`
        ]
      });

      // Create entities in crystalline memory
      if (this.crystallineMemory) {
        for (const entity of entities) {
          await this.crystallineMemory.storeMemory(
            'seo-research',
            entity,
            {
              importance: 0.9,
              semantic_tags: ['seo', 'keyword-research', 'content-strategy', execution.targetMarket.toLowerCase()],
              retention: 'long-term'
            }
          );
        }
      }

      // Create cross-domain connections
      const connections = await this.createCrossDomainConnections(execution);

      const result = {
        success: true,
        duration: Date.now() - stageStart,
        entitiesCreated: entities.length,
        connectionsCreated: connections.length,
        memoryIntegrationComplete: true
      };

      this.emit('stage-completed', {
        executionId: execution.executionId,
        stage: 'memory_integration',
        result
      });

      return result;

    } catch (error) {
      console.error('❌ Memory integration failed:', error);
      // Non-fatal - log and continue
      return {
        success: false,
        error: error.message,
        duration: Date.now() - stageStart
      };
    }
  }

  /**
   * Helper: Validate project specification
   */
  validateProjectSpec(projectSpec) {
    if (!projectSpec.clientName) {
      throw new Error('Project specification must include clientName');
    }

    if (!projectSpec.primaryKeyword && !projectSpec.seedKeywords) {
      throw new Error('Project specification must include primaryKeyword or seedKeywords');
    }

    if (!projectSpec.projectUuid) {
      projectSpec.projectUuid = `${projectSpec.clientName.toLowerCase()}-${uuidv4().substring(0, 8)}`;
    }
  }

  /**
   * Helper: Get location code for DataForSEO
   */
  getLocationCode(targetMarket) {
    const locationCodes = {
      'Netherlands': 2528,
      'United States': 2840,
      'United Kingdom': 2826,
      'Germany': 2276,
      'Slovenia': 2705
    };

    return locationCodes[targetMarket] || 2528;
  }

  /**
   * Helper: Combine and rank keywords
   */
  combineAndRankKeywords(primary, related, suggested) {
    const keywordMap = new Map();

    // Process primary keywords
    if (primary?.tasks?.[0]?.result) {
      for (const item of primary.tasks[0].result) {
        if (item.keyword_data) {
          keywordMap.set(item.keyword_data.keyword, {
            keyword: item.keyword_data.keyword,
            searchVolume: item.keyword_data.keyword_info?.search_volume || 0,
            difficulty: item.keyword_data.keyword_properties?.keyword_difficulty || 0,
            cpc: item.keyword_data.keyword_info?.cpc || 0,
            competition: item.keyword_data.keyword_info?.competition || 0,
            intent: 'informational',
            source: 'primary'
          });
        }
      }
    }

    // Process related keywords
    if (related?.tasks?.[0]?.result) {
      for (const item of related.tasks[0].result) {
        if (item.keyword_data && !keywordMap.has(item.keyword_data.keyword)) {
          keywordMap.set(item.keyword_data.keyword, {
            keyword: item.keyword_data.keyword,
            searchVolume: item.keyword_data.keyword_info?.search_volume || 0,
            difficulty: item.keyword_data.keyword_properties?.keyword_difficulty || 0,
            cpc: item.keyword_data.keyword_info?.cpc || 0,
            competition: item.keyword_data.keyword_info?.competition || 0,
            intent: 'informational',
            source: 'related'
          });
        }
      }
    }

    // Process suggested keywords
    if (suggested?.tasks?.[0]?.result) {
      for (const item of suggested.tasks[0].result) {
        if (item.keyword_data && !keywordMap.has(item.keyword_data.keyword)) {
          keywordMap.set(item.keyword_data.keyword, {
            keyword: item.keyword_data.keyword,
            searchVolume: item.keyword_data.keyword_info?.search_volume || 0,
            difficulty: item.keyword_data.keyword_properties?.keyword_difficulty || 0,
            cpc: item.keyword_data.keyword_info?.cpc || 0,
            competition: item.keyword_data.keyword_info?.competition || 0,
            intent: 'informational',
            source: 'suggested'
          });
        }
      }
    }

    // Convert to array and sort by opportunity score
    const keywords = Array.from(keywordMap.values());

    keywords.forEach(kw => {
      kw.opportunityScore = this.calculateKeywordOpportunityScore(kw);
    });

    return keywords.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  /**
   * Helper: Calculate keyword opportunity score
   */
  calculateKeywordOpportunityScore(keyword) {
    const volumeScore = Math.min(keyword.searchVolume / 1000, 10);
    const difficultyScore = (100 - keyword.difficulty) / 10;
    const commercialScore = keyword.cpc > 0 ? 2 : 0;

    return volumeScore + difficultyScore + commercialScore;
  }

  /**
   * Helper: Map keywords to user journey
   */
  mapKeywordsToUserJourney(keywords, intentAnalysis) {
    const journeyMapping = {
      awareness: [],
      consideration: [],
      decision: []
    };

    keywords.forEach(keyword => {
      // Simplified intent mapping - in production, use intentAnalysis data
      if (keyword.keyword.includes('what') || keyword.keyword.includes('how') || keyword.keyword.includes('guide')) {
        journeyMapping.awareness.push(keyword);
      } else if (keyword.keyword.includes('best') || keyword.keyword.includes('vs') || keyword.keyword.includes('review')) {
        journeyMapping.consideration.push(keyword);
      } else if (keyword.keyword.includes('buy') || keyword.keyword.includes('price') || keyword.keyword.includes('cost')) {
        journeyMapping.decision.push(keyword);
      } else {
        journeyMapping.awareness.push(keyword);
      }
    });

    return journeyMapping;
  }

  /**
   * Helper: Identify content gaps
   */
  identifyContentGaps(competitorData, clientName) {
    const gaps = [];

    competitorData.forEach(data => {
      const clientRanking = data.competitors.find(c => c.domain?.includes(clientName.toLowerCase()));

      if (!clientRanking || clientRanking.rank_absolute > 10) {
        gaps.push({
          keyword: data.keyword,
          currentRank: clientRanking?.rank_absolute || 'Not ranking',
          topCompetitors: data.competitors.slice(0, 3).map(c => c.domain),
          opportunityScore: this.calculateGapOpportunity(data, clientRanking)
        });
      }
    });

    return gaps.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  /**
   * Helper: Calculate gap opportunity score
   */
  calculateGapOpportunity(data, clientRanking) {
    const competitorStrength = data.competitors.slice(0, 3).reduce((sum, c) => sum + (c.domain_rank || 0), 0) / 3;
    const rankingGap = clientRanking ? (100 - clientRanking.rank_absolute) : 100;

    return (rankingGap + (100 - competitorStrength)) / 2;
  }

  /**
   * Helper: Create semantic clusters
   */
  createSemanticClusters(keywords, journeyMapping) {
    // Simplified clustering - in production, use LSA/topic modeling
    const clusters = [];
    const clusterMap = new Map();

    keywords.forEach(keyword => {
      const topic = this.extractMainTopic(keyword.keyword);

      if (!clusterMap.has(topic)) {
        clusterMap.set(topic, {
          topic,
          keywords: [],
          totalVolume: 0,
          avgDifficulty: 0,
          intent: 'informational'
        });
      }

      const cluster = clusterMap.get(topic);
      cluster.keywords.push(keyword);
      cluster.totalVolume += keyword.searchVolume;
    });

    // Calculate averages and add to clusters array
    for (const [topic, cluster] of clusterMap.entries()) {
      cluster.avgDifficulty = Math.round(
        cluster.keywords.reduce((sum, k) => sum + k.difficulty, 0) / cluster.keywords.length
      );
      clusters.push(cluster);
    }

    return clusters.sort((a, b) => b.totalVolume - a.totalVolume);
  }

  /**
   * Helper: Extract main topic from keyword
   */
  extractMainTopic(keyword) {
    // Simplified topic extraction
    const words = keyword.toLowerCase().split(' ');
    const stopWords = new Set(['what', 'how', 'best', 'top', 'the', 'a', 'an', 'is', 'are', 'for', 'to']);

    const meaningfulWords = words.filter(w => !stopWords.has(w) && w.length > 3);

    return meaningfulWords[0] || 'general';
  }

  /**
   * Helper: Build topic architecture
   */
  buildTopicArchitecture(clusters) {
    const hubs = [];
    const spokes = [];

    // Top 3 clusters become hub pages
    clusters.slice(0, 3).forEach(cluster => {
      hubs.push({
        topic: cluster.topic,
        targetKeyword: cluster.keywords[0].keyword,
        supportingKeywords: cluster.keywords.slice(1, 6).map(k => k.keyword),
        contentType: 'pillar-page'
      });
    });

    // Remaining clusters become spoke pages
    clusters.slice(3).forEach(cluster => {
      spokes.push({
        topic: cluster.topic,
        targetKeyword: cluster.keywords[0].keyword,
        hubConnection: hubs[0]?.topic || 'main',
        contentType: 'supporting-content'
      });
    });

    return { hubs, spokes };
  }

  /**
   * Helper: Plan internal linking
   */
  planInternalLinking(clusters, topicArchitecture) {
    const linkingStructure = {
      hubToSpoke: [],
      spokeToHub: [],
      spokeToSpoke: []
    };

    // Hub to spoke links
    topicArchitecture.hubs.forEach(hub => {
      const relatedSpokes = topicArchitecture.spokes.filter(
        spoke => spoke.hubConnection === hub.topic
      );

      relatedSpokes.forEach(spoke => {
        linkingStructure.hubToSpoke.push({
          from: hub.topic,
          to: spoke.topic,
          anchorText: spoke.targetKeyword
        });
      });
    });

    // Spoke to hub links
    topicArchitecture.spokes.forEach(spoke => {
      const hub = topicArchitecture.hubs.find(h => h.topic === spoke.hubConnection);
      if (hub) {
        linkingStructure.spokeToHub.push({
          from: spoke.topic,
          to: hub.topic,
          anchorText: hub.targetKeyword
        });
      }
    });

    return linkingStructure;
  }

  /**
   * Helper: Create content calendar
   */
  createContentCalendar(clusters, topicArchitecture, contentGaps) {
    const calendar = [];

    // Add hub pages
    topicArchitecture.hubs.forEach((hub, index) => {
      calendar.push({
        week: index + 1,
        contentType: 'Hub Page',
        topic: hub.topic,
        targetKeyword: hub.targetKeyword,
        wordCount: 3000,
        priority: 'high',
        status: 'planned'
      });
    });

    // Add spoke pages
    topicArchitecture.spokes.forEach((spoke, index) => {
      calendar.push({
        week: Math.floor(index / 2) + 4,
        contentType: 'Spoke Content',
        topic: spoke.topic,
        targetKeyword: spoke.targetKeyword,
        wordCount: 1500,
        priority: index < 5 ? 'medium' : 'low',
        status: 'planned'
      });
    });

    return calendar.sort((a, b) => a.week - b.week);
  }

  /**
   * Helper: Prioritize content opportunities
   */
  prioritizeContentOpportunities(contentCalendar, contentGaps) {
    return contentCalendar.map(content => {
      const gap = contentGaps.find(g => g.keyword.toLowerCase().includes(content.targetKeyword.toLowerCase()));

      return {
        ...content,
        gapOpportunity: gap?.opportunityScore || 0,
        estimatedTraffic: this.estimateTrafficPotential(content, gap),
        priority: this.calculatePriority(content, gap)
      };
    }).sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Helper: Calculate priority
   */
  calculatePriority(content, gap) {
    if (content.contentType === 'Hub Page') return 'high';
    if (gap && gap.opportunityScore > 70) return 'high';
    if (gap && gap.opportunityScore > 50) return 'medium';
    return 'low';
  }

  /**
   * Helper: Estimate traffic potential
   */
  estimateTrafficPotential(content, gap) {
    if (!gap) return 'Low';

    if (gap.opportunityScore > 70) return 'High';
    if (gap.opportunityScore > 50) return 'Medium';
    return 'Low';
  }

  /**
   * Helper: Create implementation roadmap
   */
  createImplementationRoadmap(contentCalendar, priorityMatrix) {
    const highPriority = priorityMatrix.filter(p => p.priority === 'high');
    const mediumPriority = priorityMatrix.filter(p => p.priority === 'medium');
    const lowPriority = priorityMatrix.filter(p => p.priority === 'low');

    return {
      phase1: {
        name: 'Foundation (Weeks 1-4)',
        content: highPriority.slice(0, 4),
        focus: 'Hub pages and high-opportunity content'
      },
      phase2: {
        name: 'Expansion (Weeks 5-8)',
        content: highPriority.slice(4).concat(mediumPriority.slice(0, 4)),
        focus: 'Supporting content and medium-opportunity keywords'
      },
      phase3: {
        name: 'Optimization (Weeks 9+)',
        content: mediumPriority.slice(4).concat(lowPriority),
        focus: 'Long-tail content and optimization'
      },
      totalWeeks: Math.max(...contentCalendar.map(c => c.week))
    };
  }

  /**
   * Helper: Create cross-domain connections
   */
  async createCrossDomainConnections(execution) {
    const connections = [];

    // Connect to psychographic data if exists
    if (this.crystallineMemory) {
      const psychographicData = await this.crystallineMemory.searchMemory(
        execution.clientName,
        { semantic_tags: ['psychographic'], limit: 3 }
      );

      if (psychographicData && psychographicData.length > 0) {
        connections.push({
          from: `${execution.clientName}_seo_keywords`,
          to: `${execution.clientName}_psychographic`,
          relationType: 'informs'
        });
      }
    }

    return connections;
  }

  /**
   * Helper: Calculate opportunity score
   */
  calculateOpportunityScore(contentGaps) {
    if (contentGaps.length === 0) return 0;

    return Math.round(
      contentGaps.reduce((sum, gap) => sum + gap.opportunityScore, 0) / contentGaps.length
    );
  }

  /**
   * Helper: Get deliverable paths
   */
  getDeliverablePaths(execution) {
    const basePath = `/Users/kris/CLAUDEtools/ORCHESTRAI/projects/${execution.projectUuid}/deliverables/seo`;

    return {
      keywordResearch: `${basePath}/keyword-research/keywords-${execution.executionId}.json`,
      intentAnalysis: `${basePath}/search-intent/intent-analysis-${execution.executionId}.json`,
      competitorAnalysis: `${basePath}/competitive-analysis/competitor-analysis-${execution.executionId}.json`,
      semanticClusters: `${basePath}/semantic-clusters/clusters-${execution.executionId}.json`,
      contentStrategy: `${basePath}/content-strategy/strategy-${execution.executionId}.json`
    };
  }

  /**
   * Helper: Save keyword data
   */
  async saveKeywordData(execution, keywords) {
    const outputPath = this.getDeliverablePaths(execution).keywordResearch;
    const outputDir = path.dirname(outputPath);

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(keywords, null, 2));

    return outputPath;
  }

  /**
   * Helper: Save intent analysis
   */
  async saveIntentAnalysis(execution, data) {
    const outputPath = this.getDeliverablePaths(execution).intentAnalysis;
    const outputDir = path.dirname(outputPath);

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));

    return outputPath;
  }

  /**
   * Helper: Save competitor analysis
   */
  async saveCompetitorAnalysis(execution, data) {
    const outputPath = this.getDeliverablePaths(execution).competitorAnalysis;
    const outputDir = path.dirname(outputPath);

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));

    return outputPath;
  }

  /**
   * Helper: Save semantic clustering
   */
  async saveSemanticClustering(execution, data) {
    const outputPath = this.getDeliverablePaths(execution).semanticClusters;
    const outputDir = path.dirname(outputPath);

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));

    return outputPath;
  }

  /**
   * Helper: Save SEO strategy
   */
  async saveSEOStrategy(execution, data) {
    const outputPath = this.getDeliverablePaths(execution).contentStrategy;
    const outputDir = path.dirname(outputPath);

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));

    return outputPath;
  }

  /**
   * Helper: Update metrics
   */
  updateMetrics(execution, success) {
    this.metrics.totalExecutions++;
    if (success) {
      this.metrics.successfulExecutions++;
    }

    if (execution.duration) {
      this.metrics.averageDuration = Math.round(
        (this.metrics.averageDuration * (this.metrics.totalExecutions - 1) + execution.duration) /
        this.metrics.totalExecutions
      );
    }
  }

  /**
   * Get pipeline status
   */
  getStatus() {
    return {
      pipelineId: this.pipelineId,
      pipelineName: this.pipelineName,
      activeExecutions: this.activeExecutions.size,
      metrics: this.metrics,
      recentExecutions: this.executionHistory.slice(-5)
    };
  }
}

module.exports = SEOResearchPipeline;
