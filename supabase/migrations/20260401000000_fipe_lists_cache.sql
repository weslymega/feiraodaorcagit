-- Create table for FIPE lists cache (brands, models, years)
CREATE TABLE IF NOT EXISTS fipe_lists_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'brands' | 'models' | 'years'
  key TEXT UNIQUE NOT NULL, -- ex: 'carros_brands', 'carros_models_21'
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Index for fast key lookups
CREATE INDEX IF NOT EXISTS idx_fipe_lists_cache_key ON fipe_lists_cache(key);

-- Add RBAC: allow public reads (since FIPE is global) and service_role inserts
ALTER TABLE fipe_lists_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to fipe_lists_cache" 
  ON fipe_lists_cache FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert/update to fipe_lists_cache" 
  ON fipe_lists_cache FOR ALL WITH CHECK (true);
