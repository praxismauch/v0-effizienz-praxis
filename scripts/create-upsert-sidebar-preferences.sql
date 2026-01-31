-- Create a stored procedure to upsert sidebar preferences
-- This bypasses PostgREST's schema cache issues

CREATE OR REPLACE FUNCTION upsert_sidebar_preferences(
  p_user_id UUID,
  p_practice_id TEXT,
  p_expanded_groups JSONB DEFAULT NULL,
  p_expanded_items JSONB DEFAULT NULL,
  p_is_collapsed BOOLEAN DEFAULT NULL,
  p_favorites JSONB DEFAULT NULL,
  p_collapsed_sections JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  INSERT INTO user_sidebar_preferences (
    user_id,
    practice_id,
    expanded_groups,
    expanded_items,
    is_collapsed,
    favorites,
    collapsed_sections,
    updated_at
  )
  VALUES (
    p_user_id,
    p_practice_id,
    COALESCE(p_expanded_groups, '["overview", "planning", "data", "strategy", "team-personal", "praxis-einstellungen"]'::jsonb),
    COALESCE(p_expanded_items, '{}'::jsonb),
    COALESCE(p_is_collapsed, false),
    COALESCE(p_favorites, '[]'::jsonb),
    COALESCE(p_collapsed_sections, '[]'::jsonb),
    NOW()
  )
  ON CONFLICT (user_id, practice_id)
  DO UPDATE SET
    expanded_groups = COALESCE(p_expanded_groups, user_sidebar_preferences.expanded_groups),
    expanded_items = COALESCE(p_expanded_items, user_sidebar_preferences.expanded_items),
    is_collapsed = COALESCE(p_is_collapsed, user_sidebar_preferences.is_collapsed),
    favorites = COALESCE(p_favorites, user_sidebar_preferences.favorites),
    collapsed_sections = COALESCE(p_collapsed_sections, user_sidebar_preferences.collapsed_sections),
    updated_at = NOW()
  RETURNING jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'practice_id', practice_id,
    'expanded_groups', expanded_groups,
    'expanded_items', expanded_items,
    'is_collapsed', is_collapsed,
    'favorites', favorites,
    'collapsed_sections', collapsed_sections,
    'updated_at', updated_at
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission (using public for broader compatibility)
GRANT EXECUTE ON FUNCTION upsert_sidebar_preferences TO public;
