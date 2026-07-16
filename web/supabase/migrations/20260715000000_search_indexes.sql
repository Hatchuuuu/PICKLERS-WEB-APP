-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create search indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_name_trgm ON tournaments USING gin (name gin_trgm_ops);

-- Assuming we have courts and facilities
CREATE INDEX IF NOT EXISTS idx_courts_name_trgm ON courts USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_facilities_name_trgm ON facilities USING gin (name gin_trgm_ops);

-- RPC for fuzzy searching tournaments
CREATE OR REPLACE FUNCTION search_tournaments(search_term TEXT)
RETURNS SETOF tournaments AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM tournaments
  WHERE name % search_term
  ORDER BY similarity(name, search_term) DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- RPC for fuzzy searching facilities/courts
CREATE OR REPLACE FUNCTION search_facilities(search_term TEXT)
RETURNS SETOF facilities AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM facilities
  WHERE name % search_term
  ORDER BY similarity(name, search_term) DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;
