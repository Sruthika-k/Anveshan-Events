-- =====================================================
-- TEAM FORMATION SYSTEM - RLS POLICIES
-- =====================================================
-- Purpose: Enforce privacy and data integrity for teams
-- Created: 2025-12-23
-- Demo Ready: YES
-- =====================================================

-- =====================================================
-- TEAMS TABLE POLICIES
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view teams only if interested" ON teams;
DROP POLICY IF EXISTS "Users can create teams only if interested" ON teams;
DROP POLICY IF EXISTS "Only creator can update team" ON teams;
DROP POLICY IF EXISTS "Only creator can delete team" ON teams;

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- SELECT: Only interested users can see teams
CREATE POLICY "Users can view teams only if interested"
ON teams FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_interest
    WHERE event_id = teams.event_id
    AND user_id = auth.uid()
  )
);

-- INSERT: Only interested users can create teams (and not already in a team)
CREATE POLICY "Users can create teams only if interested"
ON teams FOR INSERT
WITH CHECK (
  -- Must be interested in the event
  EXISTS (
    SELECT 1 FROM event_interest
    WHERE event_id = teams.event_id
    AND user_id = auth.uid()
  )
  -- Must not already be in a team for this event
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE t.event_id = teams.event_id
    AND tm.user_id = auth.uid()
  )
  -- Must be the creator
  AND created_by = auth.uid()
);

-- UPDATE: Only team creator can update
CREATE POLICY "Only creator can update team"
ON teams FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- DELETE: Only creator can delete
CREATE POLICY "Only creator can delete team"
ON teams FOR DELETE
USING (created_by = auth.uid());

-- =====================================================
-- TEAM_MEMBERS TABLE POLICIES
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view team members if interested" ON team_members;
DROP POLICY IF EXISTS "Users can join teams only if interested" ON team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON team_members;

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- SELECT: Only interested users can see team members
CREATE POLICY "Users can view team members if interested"
ON team_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_interest ei
    JOIN teams t ON t.id = team_members.team_id
    WHERE ei.event_id = t.event_id
    AND ei.user_id = auth.uid()
  )
);

-- INSERT: Only interested users can join teams (with validations)
CREATE POLICY "Users can join teams only if interested"
ON team_members FOR INSERT
WITH CHECK (
  -- Must be joining as yourself
  user_id = auth.uid()
  -- Must be interested in the event
  AND EXISTS (
    SELECT 1 FROM event_interest ei
    JOIN teams t ON t.id = team_members.team_id
    WHERE ei.event_id = t.event_id
    AND ei.user_id = auth.uid()
  )
  -- Must not already be in a team for this event
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    JOIN teams t2 ON t2.id = team_members.team_id
    WHERE tm.user_id = auth.uid()
    AND t.event_id = t2.event_id
  )
  -- Team must not be full (max 4 members)
  AND (
    SELECT COUNT(*) FROM team_members
    WHERE team_id = team_members.team_id
  ) < 4
);

-- DELETE: Users can leave their own teams
CREATE POLICY "Users can leave teams"
ON team_members FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- To verify policies are active:
-- SELECT tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('teams', 'team_members');
