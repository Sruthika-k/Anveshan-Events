-- =====================================================
-- TEAM FORMATION SYSTEM - DATABASE TRIGGERS
-- =====================================================
-- Purpose: Auto-add creator to team and cleanup empty teams
-- Created: 2025-12-23
-- Demo Ready: YES
-- =====================================================

-- =====================================================
-- TRIGGER 1: Auto-add team creator to team_members
-- =====================================================

-- Drop existing function/trigger if any
DROP TRIGGER IF EXISTS after_team_create ON teams;
DROP FUNCTION IF EXISTS auto_add_team_creator();

-- Create function to auto-add creator
CREATE OR REPLACE FUNCTION auto_add_team_creator()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically add the team creator to team_members
  INSERT INTO team_members (team_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER after_team_create
AFTER INSERT ON teams
FOR EACH ROW
EXECUTE FUNCTION auto_add_team_creator();

-- =====================================================
-- TRIGGER 2: Auto-delete empty teams
-- =====================================================

-- Drop existing function/trigger if any
DROP TRIGGER IF EXISTS after_member_leave ON team_members;
DROP FUNCTION IF EXISTS cleanup_empty_teams();

-- Create function to cleanup empty teams
CREATE OR REPLACE FUNCTION cleanup_empty_teams()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete team if no members remain
  DELETE FROM teams
  WHERE id = OLD.team_id
  AND NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = OLD.team_id
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER after_member_leave
AFTER DELETE ON team_members
FOR EACH ROW
EXECUTE FUNCTION cleanup_empty_teams();

-- =====================================================
-- TRIGGER 3: Transfer ownership when creator leaves
-- =====================================================

-- Drop existing function/trigger if any
DROP TRIGGER IF EXISTS before_creator_leave ON team_members;
DROP FUNCTION IF EXISTS transfer_team_ownership();

-- Create function to transfer ownership
CREATE OR REPLACE FUNCTION transfer_team_ownership()
RETURNS TRIGGER AS $$
DECLARE
  team_creator_id UUID;
  new_owner_id UUID;
BEGIN
  -- Get the team's creator
  SELECT created_by INTO team_creator_id
  FROM teams
  WHERE id = OLD.team_id;
  
  -- Check if the leaving member is the creator
  IF OLD.user_id = team_creator_id THEN
    -- Find the oldest remaining member (by joined_at)
    SELECT user_id INTO new_owner_id
    FROM team_members
    WHERE team_id = OLD.team_id
    AND user_id != OLD.user_id
    ORDER BY joined_at ASC
    LIMIT 1;
    
    -- If there's another member, transfer ownership
    IF new_owner_id IS NOT NULL THEN
      UPDATE teams
      SET created_by = new_owner_id
      WHERE id = OLD.team_id;
    END IF;
    -- If no other members, the cleanup_empty_teams trigger will delete the team
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (runs BEFORE delete so we can still query team_members)
CREATE TRIGGER before_creator_leave
BEFORE DELETE ON team_members
FOR EACH ROW
EXECUTE FUNCTION transfer_team_ownership();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- To verify triggers are active:
-- SELECT tgname, tgtype, tgenabled 
-- FROM pg_trigger 
-- WHERE tgrelid IN ('teams'::regclass, 'team_members'::regclass);

-- To test:
-- 1. Create a team (creator should auto-join)
-- 2. Add another member
-- 3. Creator leaves (ownership should transfer)
-- 4. Last member leaves (team should auto-delete)
