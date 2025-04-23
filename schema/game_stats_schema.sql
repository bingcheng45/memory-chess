-- Game statistics database schema for Memory Chess

-- Create the game_stats table
CREATE TABLE game_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL UNIQUE,
  metric_value BIGINT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on metric_name for fast lookups
CREATE INDEX idx_game_stats_metric_name ON game_stats (metric_name);

-- Insert initial metrics
INSERT INTO game_stats (metric_name, metric_value) VALUES
  ('total_plays', 0),
  ('total_completed_games', 0),
  ('total_correct_pieces', 0);

-- Create a function to increment a metric
CREATE OR REPLACE FUNCTION increment_metric(p_metric_name TEXT, p_increment BIGINT DEFAULT 1)
RETURNS BIGINT AS $$
DECLARE
  v_new_value BIGINT;
BEGIN
  -- Insert the metric if it doesn't exist, otherwise update it
  INSERT INTO game_stats (metric_name, metric_value, last_updated)
  VALUES (p_metric_name, p_increment, NOW())
  ON CONFLICT (metric_name) 
  DO UPDATE SET 
    metric_value = game_stats.metric_value + p_increment,
    last_updated = NOW()
  RETURNING metric_value INTO v_new_value;
  
  RETURN v_new_value;
END;
$$ LANGUAGE plpgsql; 