-- Add query optimizations and materialized views for performance
-- This migration creates helper functions and views for common queries

-- Function to get practice member count efficiently
CREATE OR REPLACE FUNCTION get_practice_member_count(p_practice_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM practice_members 
    WHERE practice_id = p_practice_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user is practice member (for RLS)
CREATE OR REPLACE FUNCTION is_practice_member(p_user_id UUID, p_practice_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM practice_members 
    WHERE user_id = p_user_id 
    AND practice_id = p_practice_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get user's practices efficiently
CREATE OR REPLACE FUNCTION get_user_practices(p_user_id UUID)
RETURNS TABLE(practice_id TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT pm.practice_id
  FROM practice_members pm
  WHERE pm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Add updated_at triggers for all tables that need it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to calendar_events
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to user_profiles  
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_practice_member_count TO authenticated;
GRANT EXECUTE ON FUNCTION is_practice_member TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_practices TO authenticated;
