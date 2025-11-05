-- ORCHESTRAI SERP Tracker Database Schema
-- PostgreSQL Schema for tracking keyword positions over time
-- Integrates with GSC MCP and DataForSEO MCP

-- ============================================================================
-- TABLE: tracked_keywords
-- Core table for keywords being monitored across client projects
-- ============================================================================
CREATE TABLE IF NOT EXISTS tracked_keywords (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  project_id VARCHAR(50) NOT NULL,
  project_name VARCHAR(255),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  search_volume INTEGER,
  target_position INTEGER,
  tracking_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (tracking_frequency IN ('daily', 'weekly', 'monthly')),
  location_code INTEGER DEFAULT 2840, -- USA by default
  location_name VARCHAR(100),
  device VARCHAR(10) DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(keyword, project_id, device, location_code)
);

CREATE INDEX idx_tracked_keywords_project ON tracked_keywords(project_id);
CREATE INDEX idx_tracked_keywords_priority ON tracked_keywords(priority);
CREATE INDEX idx_tracked_keywords_active ON tracked_keywords(is_active);

-- ============================================================================
-- TABLE: position_history
-- Time-series data for keyword position tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS position_history (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER NOT NULL REFERENCES tracked_keywords(id) ON DELETE CASCADE,
  position INTEGER,
  url TEXT,
  date DATE NOT NULL,
  device VARCHAR(10) DEFAULT 'desktop',
  location VARCHAR(100),
  serp_features JSONB, -- Featured snippet, local pack, etc.
  data_source VARCHAR(20) NOT NULL CHECK (data_source IN ('gsc', 'dataforseo')),
  raw_data JSONB, -- Store full API response for debugging
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(keyword_id, date, device, location, data_source)
);

CREATE INDEX idx_position_history_date ON position_history(date DESC);
CREATE INDEX idx_position_history_keyword ON position_history(keyword_id);
CREATE INDEX idx_position_history_keyword_date ON position_history(keyword_id, date DESC);
CREATE INDEX idx_position_history_source ON position_history(data_source);

-- Partition by month for better performance (PostgreSQL 10+)
-- CREATE TABLE position_history_2025_01 PARTITION OF position_history
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- ============================================================================
-- TABLE: gsc_performance
-- Google Search Console performance metrics (clicks, impressions, CTR)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gsc_performance (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER NOT NULL REFERENCES tracked_keywords(id) ON DELETE CASCADE,
  page_url TEXT,
  date DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5,4),
  position DECIMAL(5,2),
  device VARCHAR(10) DEFAULT 'desktop',
  country VARCHAR(3), -- ISO country code
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(keyword_id, page_url, date, device, country)
);

CREATE INDEX idx_gsc_performance_date ON gsc_performance(date DESC);
CREATE INDEX idx_gsc_performance_keyword ON gsc_performance(keyword_id);
CREATE INDEX idx_gsc_performance_keyword_date ON gsc_performance(keyword_id, date DESC);

-- ============================================================================
-- TABLE: competitor_positions
-- Track competitor rankings for target keywords
-- ============================================================================
CREATE TABLE IF NOT EXISTS competitor_positions (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER NOT NULL REFERENCES tracked_keywords(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  position INTEGER,
  url TEXT,
  date DATE NOT NULL,
  device VARCHAR(10) DEFAULT 'desktop',
  serp_features JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(keyword_id, domain, date, device)
);

CREATE INDEX idx_competitor_positions_keyword ON competitor_positions(keyword_id);
CREATE INDEX idx_competitor_positions_date ON competitor_positions(date DESC);
CREATE INDEX idx_competitor_positions_domain ON competitor_positions(domain);

-- ============================================================================
-- TABLE: tracking_alerts
-- Store alerts for significant rank changes
-- ============================================================================
CREATE TABLE IF NOT EXISTS tracking_alerts (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER NOT NULL REFERENCES tracked_keywords(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('critical', 'warning', 'opportunity', 'competitor')),
  position_change INTEGER,
  old_position INTEGER,
  new_position INTEGER,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tracking_alerts_keyword ON tracking_alerts(keyword_id);
CREATE INDEX idx_tracking_alerts_type ON tracking_alerts(alert_type);
CREATE INDEX idx_tracking_alerts_unread ON tracking_alerts(is_read) WHERE is_read = false;

-- ============================================================================
-- TABLE: sync_log
-- Track sync operations for debugging and monitoring
-- ============================================================================
CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL, -- 'gsc', 'dataforseo', 'notion', etc.
  project_id VARCHAR(50),
  keywords_processed INTEGER,
  keywords_success INTEGER,
  keywords_failed INTEGER,
  errors JSONB,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,
  status VARCHAR(20) CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX idx_sync_log_type ON sync_log(sync_type);
CREATE INDEX idx_sync_log_project ON sync_log(project_id);
CREATE INDEX idx_sync_log_started ON sync_log(started_at DESC);

-- ============================================================================
-- VIEWS: Convenience views for common queries
-- ============================================================================

-- Latest position for each keyword
CREATE OR REPLACE VIEW v_latest_positions AS
SELECT
  tk.id,
  tk.keyword,
  tk.project_id,
  tk.project_name,
  tk.priority,
  tk.target_position,
  ph.position AS current_position,
  ph.url AS ranking_url,
  ph.date AS last_checked,
  ph.serp_features,
  tk.target_position - ph.position AS distance_to_target,
  CASE
    WHEN ph.position <= 3 THEN 'top-3'
    WHEN ph.position <= 10 THEN 'top-10'
    WHEN ph.position <= 20 THEN 'top-20'
    WHEN ph.position <= 50 THEN 'top-50'
    ELSE 'beyond-50'
  END AS position_tier
FROM tracked_keywords tk
LEFT JOIN LATERAL (
  SELECT position, url, date, serp_features
  FROM position_history
  WHERE keyword_id = tk.id
  ORDER BY date DESC
  LIMIT 1
) ph ON true
WHERE tk.is_active = true;

-- Position changes (current vs 7 days ago)
CREATE OR REPLACE VIEW v_position_changes_7d AS
SELECT
  tk.id,
  tk.keyword,
  tk.project_id,
  current_pos.position AS current_position,
  current_pos.date AS current_date,
  prev_pos.position AS previous_position,
  prev_pos.date AS previous_date,
  current_pos.position - prev_pos.position AS position_change,
  CASE
    WHEN current_pos.position - prev_pos.position < 0 THEN 'improved'
    WHEN current_pos.position - prev_pos.position > 0 THEN 'declined'
    ELSE 'stable'
  END AS trend
FROM tracked_keywords tk
LEFT JOIN LATERAL (
  SELECT position, date
  FROM position_history
  WHERE keyword_id = tk.id
  ORDER BY date DESC
  LIMIT 1
) current_pos ON true
LEFT JOIN LATERAL (
  SELECT position, date
  FROM position_history
  WHERE keyword_id = tk.id
    AND date <= (current_pos.date - INTERVAL '7 days')
  ORDER BY date DESC
  LIMIT 1
) prev_pos ON true
WHERE tk.is_active = true;

-- GSC performance summary (last 30 days)
CREATE OR REPLACE VIEW v_gsc_performance_30d AS
SELECT
  tk.id,
  tk.keyword,
  tk.project_id,
  SUM(gp.clicks) AS total_clicks,
  SUM(gp.impressions) AS total_impressions,
  AVG(gp.ctr) AS avg_ctr,
  AVG(gp.position) AS avg_position,
  MIN(gp.date) AS period_start,
  MAX(gp.date) AS period_end
FROM tracked_keywords tk
INNER JOIN gsc_performance gp ON tk.id = gp.keyword_id
WHERE gp.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY tk.id, tk.keyword, tk.project_id;

-- ============================================================================
-- FUNCTIONS: Helper functions for analytics
-- ============================================================================

-- Calculate position change between two dates
CREATE OR REPLACE FUNCTION get_position_change(
  p_keyword_id INTEGER,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  keyword_id INTEGER,
  start_position INTEGER,
  end_position INTEGER,
  position_change INTEGER,
  improvement BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_keyword_id,
    start_pos.position,
    end_pos.position,
    end_pos.position - start_pos.position,
    end_pos.position < start_pos.position
  FROM (
    SELECT position
    FROM position_history
    WHERE keyword_id = p_keyword_id
      AND date <= p_start_date
    ORDER BY date DESC
    LIMIT 1
  ) start_pos
  CROSS JOIN (
    SELECT position
    FROM position_history
    WHERE keyword_id = p_keyword_id
      AND date <= p_end_date
    ORDER BY date DESC
    LIMIT 1
  ) end_pos;
END;
$$ LANGUAGE plpgsql;

-- Get keywords needing optimization (high impressions, low CTR)
CREATE OR REPLACE FUNCTION get_optimization_opportunities(
  p_project_id VARCHAR(50) DEFAULT NULL,
  p_min_impressions INTEGER DEFAULT 100,
  p_max_ctr DECIMAL DEFAULT 0.02
) RETURNS TABLE (
  keyword TEXT,
  project_id VARCHAR(50),
  avg_position DECIMAL,
  total_impressions INTEGER,
  avg_ctr DECIMAL,
  opportunity_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tk.keyword,
    tk.project_id,
    AVG(gp.position) AS avg_position,
    SUM(gp.impressions) AS total_impressions,
    AVG(gp.ctr) AS avg_ctr,
    (SUM(gp.impressions) * (p_max_ctr - AVG(gp.ctr))) AS opportunity_score
  FROM tracked_keywords tk
  INNER JOIN gsc_performance gp ON tk.id = gp.keyword_id
  WHERE
    gp.date >= CURRENT_DATE - INTERVAL '30 days'
    AND (p_project_id IS NULL OR tk.project_id = p_project_id)
  GROUP BY tk.id, tk.keyword, tk.project_id
  HAVING
    SUM(gp.impressions) >= p_min_impressions
    AND AVG(gp.ctr) < p_max_ctr
  ORDER BY opportunity_score DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Automatic timestamp updates
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tracked_keywords_updated_at
  BEFORE UPDATE ON tracked_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA: Sample configuration
-- ============================================================================

-- Insert sample tracking configuration (commented out - run manually if needed)
/*
INSERT INTO tracked_keywords (keyword, project_id, project_name, priority, search_volume, target_position, tracking_frequency, location_code, location_name) VALUES
('deletereviews verwijderen', 'drnl-A0582FF4-6715-4266-9A54-A7E311912E41', 'DeleteReviews.nl', 'high', 590, 1, 'daily', 2528, 'Netherlands'),
('slechte google reviews verwijderen', 'drnl-A0582FF4-6715-4266-9A54-A7E311912E41', 'DeleteReviews.nl', 'high', 320, 3, 'daily', 2528, 'Netherlands'),
('negatieve recensies verwijderen', 'drnl-A0582FF4-6715-4266-9A54-A7E311912E41', 'DeleteReviews.nl', 'medium', 210, 5, 'weekly', 2528, 'Netherlands');
*/

-- ============================================================================
-- COMMENTS: Documentation
-- ============================================================================

COMMENT ON TABLE tracked_keywords IS 'Core table for keywords being monitored across all client projects';
COMMENT ON TABLE position_history IS 'Time-series data for keyword position tracking from multiple sources';
COMMENT ON TABLE gsc_performance IS 'Google Search Console performance metrics (actual clicks and impressions)';
COMMENT ON TABLE competitor_positions IS 'Track competitor rankings for target keywords';
COMMENT ON TABLE tracking_alerts IS 'Automated alerts for significant rank changes or opportunities';
COMMENT ON TABLE sync_log IS 'Audit log for sync operations and API calls';

COMMENT ON COLUMN tracked_keywords.tracking_frequency IS 'How often to check this keyword: daily, weekly, or monthly';
COMMENT ON COLUMN tracked_keywords.priority IS 'Business priority: high (money keywords), medium (service), low (informational)';
COMMENT ON COLUMN position_history.data_source IS 'Which API provided this data: gsc or dataforseo';
COMMENT ON COLUMN position_history.serp_features IS 'JSON array of SERP features present for this keyword';

-- ============================================================================
-- GRANTS: Set up permissions (adjust as needed)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO orchestrai_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO orchestrai_app;
