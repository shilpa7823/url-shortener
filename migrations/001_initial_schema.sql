-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- URLs table
CREATE TABLE IF NOT EXISTS urls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  short_code VARCHAR(12) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  url_hash VARCHAR(64) UNIQUE NOT NULL,
  created_by UUID,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  clicks INT DEFAULT 0
);

-- Create indexes for better query performance
CREATE INDEX idx_short_code ON urls(short_code);
CREATE INDEX idx_url_hash ON urls(url_hash);
CREATE INDEX idx_created_at ON urls(created_at);
CREATE INDEX idx_expires_at ON urls(expires_at);

-- Clicks/Analytics table
CREATE TABLE IF NOT EXISTS clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  short_code VARCHAR(12) NOT NULL REFERENCES urls(short_code) ON DELETE CASCADE,
  ip VARCHAR(45),
  user_agent TEXT,
  referer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for analytics queries
CREATE INDEX idx_clicks_short_code ON clicks(short_code);
CREATE INDEX idx_clicks_created_at ON clicks(created_at);
CREATE INDEX idx_clicks_ip ON clicks(ip);

-- Materialized view for quick analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS url_analytics AS
SELECT 
  u.short_code,
  u.original_url,
  COUNT(c.id)::INT as total_clicks,
  COUNT(DISTINCT c.ip)::INT as unique_clicks,
  MAX(c.created_at) as last_click_at
FROM urls u
LEFT JOIN clicks c ON u.short_code = c.short_code
GROUP BY u.id, u.short_code, u.original_url;

CREATE INDEX idx_url_analytics_short_code ON url_analytics(short_code);
