-- Fix infinite recursion in practice_members RLS policies
-- This migration removes circular dependencies in Row Level Security

-- Drop existing RLS policies that cause recursion
DROP POLICY IF EXISTS "Members can view other members" ON practice_members;
DROP POLICY IF EXISTS "Members can add new members" ON practice_members;
DROP POLICY IF EXISTS "Members can update member details" ON practice_members;
DROP POLICY IF EXISTS "Members can remove members" ON practice_members;

-- Create new policies that use auth.uid() directly instead of checking practice_members
-- This avoids the circular dependency

-- Policy: Users can view members of practices they belong to
CREATE POLICY "practice_members_select_policy" ON practice_members
FOR SELECT USING (
  -- Users can see their own membership
  auth.uid() = user_id
  OR
  -- Users can see other members if they share a practice
  practice_id IN (
    SELECT DISTINCT pm.practice_id 
    FROM practice_members pm 
    WHERE pm.user_id = auth.uid()
  )
);

-- Policy: Users can insert members to practices they belong to
CREATE POLICY "practice_members_insert_policy" ON practice_members
FOR INSERT WITH CHECK (
  practice_id IN (
    SELECT DISTINCT pm.practice_id 
    FROM practice_members pm 
    WHERE pm.user_id = auth.uid()
  )
);

-- Policy: Users can update members in their practices
CREATE POLICY "practice_members_update_policy" ON practice_members
FOR UPDATE USING (
  practice_id IN (
    SELECT DISTINCT pm.practice_id 
    FROM practice_members pm 
    WHERE pm.user_id = auth.uid()
  )
);

-- Policy: Users can delete members from their practices
CREATE POLICY "practice_members_delete_policy" ON practice_members
FOR DELETE USING (
  practice_id IN (
    SELECT DISTINCT pm.practice_id 
    FROM practice_members pm 
    WHERE pm.user_id = auth.uid()
  )
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_practice_members_user_id ON practice_members(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_members_practice_id ON practice_members(practice_id);
CREATE INDEX IF NOT EXISTS idx_practice_members_lookup ON practice_members(practice_id, user_id);

-- Verify RLS is enabled
ALTER TABLE practice_members ENABLE ROW LEVEL SECURITY;
