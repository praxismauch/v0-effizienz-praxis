-- Add single_group_mode column to user_sidebar_preferences table
-- This column controls whether only one sidebar menu group can be open at a time

-- Add the column with default value of true (single group mode on by default)
ALTER TABLE user_sidebar_preferences 
ADD COLUMN IF NOT EXISTS single_group_mode BOOLEAN DEFAULT true;

-- Update the RPC function to handle the new column
CREATE OR REPLACE FUNCTION upsert_sidebar_preferences(
  p_user_id UUID,
  p_practice_id TEXT,
  p_expanded_groups TEXT[] DEFAULT NULL,
  p_expanded_items JSONB DEFAULT NULL,
  p_is_collapsed BOOLEAN DEFAULT NULL,
  p_favorites TEXT[] DEFAULT NULL,
  p_collapsed_sections TEXT[] DEFAULT NULL,
  p_single_group_mode BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_sidebar_preferences (
    user_id, 
    practice_id, 
    expanded_groups, 
    expanded_items, 
    is_collapsed, 
    favorites, 
    collapsed_sections,
    single_group_mode
  )
  VALUES (
    p_user_id,
    p_practice_id,
    COALESCE(p_expanded_groups, ARRAY['overview', 'planning', 'data', 'strategy', 'team-personal', 'praxis-einstellungen']),
    COALESCE(p_expanded_items, '{}'::jsonb),
    COALESCE(p_is_collapsed, false),
    COALESCE(p_favorites, ARRAY[]::text[]),
    COALESCE(p_collapsed_sections, ARRAY[]::text[]),
    COALESCE(p_single_group_mode, true)
  )
  ON CONFLICT (user_id, practice_id) DO UPDATE SET
    expanded_groups = CASE 
      WHEN p_expanded_groups IS NOT NULL THEN p_expanded_groups 
      ELSE user_sidebar_preferences.expanded_groups 
    END,
    expanded_items = CASE 
      WHEN p_expanded_items IS NOT NULL THEN p_expanded_items 
      ELSE user_sidebar_preferences.expanded_items 
    END,
    is_collapsed = CASE 
      WHEN p_is_collapsed IS NOT NULL THEN p_is_collapsed 
      ELSE user_sidebar_preferences.is_collapsed 
    END,
    favorites = CASE 
      WHEN p_favorites IS NOT NULL THEN p_favorites 
      ELSE user_sidebar_preferences.favorites 
    END,
    collapsed_sections = CASE 
      WHEN p_collapsed_sections IS NOT NULL THEN p_collapsed_sections 
      ELSE user_sidebar_preferences.collapsed_sections 
    END,
    single_group_mode = CASE 
      WHEN p_single_group_mode IS NOT NULL THEN p_single_group_mode 
      ELSE user_sidebar_preferences.single_group_mode 
    END,
    updated_at = NOW();
END;
$$;
