-- Add a CHECK constraint to enforce player_name length (4-16 characters)
ALTER TABLE leaderboard_entries 
ADD CONSTRAINT check_player_name_length 
CHECK (LENGTH(player_name) >= 4 AND LENGTH(player_name) <= 16);

-- If you need to apply this to a table that already has data, 
-- you may want to first check if there are any violations:
-- SELECT * FROM leaderboard_entries WHERE LENGTH(player_name) < 4 OR LENGTH(player_name) > 16;

-- And possibly fix those entries:
-- UPDATE leaderboard_entries SET player_name = LEFT(player_name, 16) WHERE LENGTH(player_name) > 16;
-- UPDATE leaderboard_entries SET player_name = player_name || REPEAT('x', 4 - LENGTH(player_name)) WHERE LENGTH(player_name) < 4; 