-- =====================================================
-- ANVESHAN BASELINE SCHEMA MIGRATION
-- =====================================================
-- Created: 2025-12-23
-- Purpose: Consolidated baseline schema from all root SQL files
-- Order: Extensions → Tables → Views → Triggers → RLS Policies
-- =====================================================

-- 🔧 Legacy fix: rename user_id → id if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN user_id TO id;
  END IF;
END $$;

-- =====================================================
-- SECTION 1: CORE TABLES
-- =====================================================

-- ----------------------------------------------------
-- 1.1 PROFILES TABLE
-- ----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    college TEXT,
    year TEXT,
    skills TEXT[],  -- FIXED: Changed from TEXT to TEXT[] (array)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add role column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('student', 'organizer'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update existing profiles to have 'student' role
UPDATE public.profiles
SET role = 'student'
WHERE role IS NULL;

-- Add social links
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT;

-- Add constraints for URL format (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'linkedin_url_format' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT linkedin_url_format CHECK (
      linkedin_url IS NULL OR 
      linkedin_url ~ '^https?://(www\.)?linkedin\.com/.*'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'github_url_format' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT github_url_format CHECK (
      github_url IS NULL OR 
      github_url ~ '^https?://(www\.)?github\.com/.*'
    );
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn profile URL (optional)';
COMMENT ON COLUMN public.profiles.github_url IS 'GitHub profile URL (optional)';

-- ----------------------------------------------------
-- 1.2 EVENTS TABLE
-- ----------------------------------------------------

-- FIXED: Added CREATE TABLE statement before ALTER statements
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    deadline DATE,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FIXED: Enable RLS before policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Add required_skills column
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS required_skills TEXT[];

CREATE INDEX IF NOT EXISTS idx_events_required_skills 
ON public.events USING GIN (required_skills);

-- Add organizer tracking
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);

-- Add missing event fields
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS date TEXT NOT NULL DEFAULT '';

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS organizer_name TEXT;

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS eligibility TEXT;

-- Remove the default constraint from date after adding the column
ALTER TABLE public.events
ALTER COLUMN date DROP DEFAULT;

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);

COMMENT ON COLUMN public.events.date IS 'Primary display date used by frontend UI. Deadline is used for filtering/sorting.';
COMMENT ON COLUMN public.events.location IS 'Event location (e.g., "Mumbai, Maharashtra")';
COMMENT ON COLUMN public.events.organizer_name IS 'Name of organizing club/committee';
COMMENT ON COLUMN public.events.eligibility IS 'Eligibility criteria (e.g., "Open to all students")';

-- Add event visibility fields
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS allowed_college TEXT;

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS allowed_years TEXT[];

CREATE INDEX IF NOT EXISTS idx_events_allowed_college ON public.events(allowed_college);

COMMENT ON COLUMN public.events.allowed_college IS 'If set, only students from this college can see the event. NULL = public to all.';
COMMENT ON COLUMN public.events.allowed_years IS 'Array of allowed years (e.g., ["1st Year", "2nd Year"]). NULL = all years allowed.';

-- ----------------------------------------------------
-- 1.3 EVENT INTEREST TABLE
-- ----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.event_interest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_event_interest_user_id ON public.event_interest(user_id);
CREATE INDEX IF NOT EXISTS idx_event_interest_event_id ON public.event_interest(event_id);
CREATE INDEX IF NOT EXISTS idx_event_interest_created_at ON public.event_interest(created_at DESC);

ALTER TABLE public.event_interest ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- 1.4 SAVED EVENTS TABLE
-- ----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.saved_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_events_user_id ON public.saved_events(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_event_id ON public.saved_events(event_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_created_at ON public.saved_events(created_at DESC);

ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- 1.5 TEAMS TABLE
-- ----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_event_id ON public.teams(event_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON public.teams(created_by);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- 1.6 TEAM MEMBERS TABLE
-- ----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id),
    UNIQUE(user_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 2: VIEWS
-- =====================================================

-- Event interest counts
CREATE OR REPLACE VIEW public.event_interest_counts AS
SELECT 
    event_id,
    COUNT(*) as interest_count
FROM public.event_interest
GROUP BY event_id;

-- Saved event counts
CREATE OR REPLACE VIEW public.saved_event_counts AS
SELECT 
    event_id,
    COUNT(*) as save_count
FROM public.saved_events
GROUP BY event_id;

-- Team member counts
CREATE OR REPLACE VIEW public.team_member_counts AS
SELECT 
    team_id,
    COUNT(*) as member_count
FROM public.team_members
GROUP BY team_id;

-- Team members with skills
CREATE OR REPLACE VIEW public.team_members_with_skills AS
SELECT 
    tm.id,
    tm.team_id,
    tm.user_id,
    tm.joined_at,
    p.name,
    p.college,
    p.skills
FROM public.team_members tm
LEFT JOIN public.profiles p ON tm.user_id = p.id;  -- FIXED: Changed p.user_id to p.id

-- Team skills summary
CREATE OR REPLACE VIEW public.team_skills_summary AS
SELECT 
    t.id as team_id,
    t.name as team_name,
    t.event_id,
    array_agg(DISTINCT skill) FILTER (WHERE skill IS NOT NULL) as all_skills,
    COUNT(DISTINCT tm.user_id) as member_count
FROM public.teams t
LEFT JOIN public.team_members tm ON t.id = tm.team_id
LEFT JOIN public.profiles p ON tm.user_id = p.id  -- FIXED: Changed p.user_id to p.id
LEFT JOIN LATERAL unnest(p.skills) as skill ON true
GROUP BY t.id, t.name, t.event_id;

-- =====================================================
-- SECTION 3: TRIGGER FUNCTIONS & TRIGGERS
-- =====================================================

-- ----------------------------------------------------
-- 3.1 PROFILE TRIGGERS
-- ----------------------------------------------------

-- Trigger function for profile updated_at
CREATE OR REPLACE FUNCTION public.handle_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profile_updated_at ON public.profiles;
CREATE TRIGGER set_profile_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------
-- 3.2 TEAM TRIGGERS
-- ----------------------------------------------------

-- Trigger function for team updated_at
CREATE OR REPLACE FUNCTION public.handle_team_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_team_updated_at ON public.teams;
CREATE TRIGGER set_team_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_team_updated_at();

-- Function to check one team per user per event
CREATE OR REPLACE FUNCTION public.check_one_team_per_event()
RETURNS TRIGGER AS $$
DECLARE
    event_id_var UUID;
    existing_team_count INT;
BEGIN
    SELECT event_id INTO event_id_var
    FROM public.teams
    WHERE id = NEW.team_id;

    SELECT COUNT(*) INTO existing_team_count
    FROM public.team_members tm
    JOIN public.teams t ON tm.team_id = t.id
    WHERE tm.user_id = NEW.user_id
      AND t.event_id = event_id_var
      AND tm.team_id != NEW.team_id;

    IF existing_team_count > 0 THEN
        RAISE EXCEPTION 'User is already in a team for this event';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_one_team_per_event ON public.team_members;
CREATE TRIGGER enforce_one_team_per_event
    BEFORE INSERT ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.check_one_team_per_event();

-- ----------------------------------------------------
-- 3.3 ENHANCED TEAM TRIGGERS
-- ----------------------------------------------------

-- FIXED: Removed duplicate old trigger (add_creator_to_team / on_team_created)
-- KEPT ONLY: Enhanced triggers below

-- Drop existing enhanced triggers if any
DROP TRIGGER IF EXISTS after_team_create ON teams;
DROP FUNCTION IF EXISTS auto_add_team_creator();

-- Enhanced function to auto-add creator
CREATE OR REPLACE FUNCTION auto_add_team_creator()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_team_create
AFTER INSERT ON teams
FOR EACH ROW
EXECUTE FUNCTION auto_add_team_creator();

-- Auto-delete empty teams
DROP TRIGGER IF EXISTS after_member_leave ON team_members;
DROP FUNCTION IF EXISTS cleanup_empty_teams();

CREATE OR REPLACE FUNCTION cleanup_empty_teams()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM teams
  WHERE id = OLD.team_id
  AND NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = OLD.team_id
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_member_leave
AFTER DELETE ON team_members
FOR EACH ROW
EXECUTE FUNCTION cleanup_empty_teams();

-- Transfer ownership when creator leaves
DROP TRIGGER IF EXISTS before_creator_leave ON team_members;
DROP FUNCTION IF EXISTS transfer_team_ownership();

CREATE OR REPLACE FUNCTION transfer_team_ownership()
RETURNS TRIGGER AS $$
DECLARE
  team_creator_id UUID;
  new_owner_id UUID;
BEGIN
  SELECT created_by INTO team_creator_id
  FROM teams
  WHERE id = OLD.team_id;
  
  IF OLD.user_id = team_creator_id THEN
    SELECT user_id INTO new_owner_id
    FROM team_members
    WHERE team_id = OLD.team_id
    AND user_id != OLD.user_id
    ORDER BY joined_at ASC
    LIMIT 1;
    
    IF new_owner_id IS NOT NULL THEN
      UPDATE teams
      SET created_by = new_owner_id
      WHERE id = OLD.team_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_creator_leave
BEFORE DELETE ON team_members
FOR EACH ROW
EXECUTE FUNCTION transfer_team_ownership();

-- =====================================================
-- SECTION 4: RLS POLICIES
-- =====================================================

-- ----------------------------------------------------
-- 4.1 PROFILES POLICIES
-- ----------------------------------------------------

DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------
-- 4.2 EVENTS POLICIES
-- ----------------------------------------------------

-- Organizers can create events
DROP POLICY IF EXISTS "Organizers can create events" ON public.events;
CREATE POLICY "Organizers can create events"
    ON public.events
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()  -- FIXED: Changed profiles.user_id to profiles.id
            AND profiles.role = 'organizer'
        )
    );

-- Organizers can update their own events
DROP POLICY IF EXISTS "Organizers can update their own events" ON public.events;
CREATE POLICY "Organizers can update their own events"
    ON public.events
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Organizers can delete their own events
DROP POLICY IF EXISTS "Organizers can delete their own events" ON public.events;
CREATE POLICY "Organizers can delete their own events"
    ON public.events
    FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

COMMENT ON POLICY "Organizers can update their own events" ON public.events IS 
'Allows organizers to update only events they created (based on created_by column)';

COMMENT ON POLICY "Organizers can delete their own events" ON public.events IS 
'Allows organizers to delete only events they created (based on created_by column)';

-- ----------------------------------------------------
-- 4.3 EVENT INTEREST POLICIES
-- ----------------------------------------------------

DROP POLICY IF EXISTS "Event interests are publicly readable" ON public.event_interest;
CREATE POLICY "Event interests are publicly readable"
    ON public.event_interest
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can mark their own interest" ON public.event_interest;
CREATE POLICY "Users can mark their own interest"
    ON public.event_interest
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own interest" ON public.event_interest;
CREATE POLICY "Users can remove their own interest"
    ON public.event_interest
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ----------------------------------------------------
-- 4.4 SAVED EVENTS POLICIES
-- ----------------------------------------------------

DROP POLICY IF EXISTS "Users can read their own saved events" ON public.saved_events;
CREATE POLICY "Users can read their own saved events"
    ON public.saved_events
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save events" ON public.saved_events;
CREATE POLICY "Users can save events"
    ON public.saved_events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave events" ON public.saved_events;
CREATE POLICY "Users can unsave events"
    ON public.saved_events
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ----------------------------------------------------
-- 4.5 TEAMS POLICIES (Enhanced from team_rls_policies.sql)
-- ----------------------------------------------------

-- Drop existing policies if any
DROP POLICY IF EXISTS "Teams are publicly readable" ON teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
DROP POLICY IF EXISTS "Team creator can update team" ON teams;
DROP POLICY IF EXISTS "Team creator can delete team" ON teams;
DROP POLICY IF EXISTS "Users can view teams only if interested" ON teams;
DROP POLICY IF EXISTS "Users can create teams only if interested" ON teams;
DROP POLICY IF EXISTS "Only creator can update team" ON teams;
DROP POLICY IF EXISTS "Only creator can delete team" ON teams;

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
  EXISTS (
    SELECT 1 FROM event_interest
    WHERE event_id = teams.event_id
    AND user_id = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE t.event_id = teams.event_id
    AND tm.user_id = auth.uid()
  )
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

-- ----------------------------------------------------
-- 4.6 TEAM MEMBERS POLICIES (Enhanced)
-- ----------------------------------------------------

-- Drop existing policies if any
DROP POLICY IF EXISTS "Team members are publicly readable" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can join teams" ON team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON team_members;
DROP POLICY IF EXISTS "Users can view team members if interested" ON team_members;
DROP POLICY IF EXISTS "Users can join teams only if interested" ON team_members;

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
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM event_interest ei
    JOIN teams t ON t.id = team_members.team_id
    WHERE ei.event_id = t.event_id
    AND ei.user_id = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    JOIN teams t2 ON t2.id = team_members.team_id
    WHERE tm.user_id = auth.uid()
    AND t.event_id = t2.event_id
  )
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
-- END OF BASELINE MIGRATION
-- =====================================================
