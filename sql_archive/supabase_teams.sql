-- ============================================
-- TEAM FORMATION SCHEMA
-- ============================================

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id),  -- Prevent duplicate memberships
    UNIQUE(user_id, team_id)   -- Ensure one team per user per event (enforced via trigger)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_event_id ON public.teams(event_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON public.teams(created_by);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - TEAMS
-- ============================================

-- Policy 1: Anyone can read teams
CREATE POLICY "Teams are publicly readable"
    ON public.teams
    FOR SELECT
    USING (true);

-- Policy 2: Authenticated users can create teams
CREATE POLICY "Authenticated users can create teams"
    ON public.teams
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Policy 3: Team creator can update team
CREATE POLICY "Team creator can update team"
    ON public.teams
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Policy 4: Team creator can delete team
CREATE POLICY "Team creator can delete team"
    ON public.teams
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- ============================================
-- RLS POLICIES - TEAM MEMBERS
-- ============================================

-- Policy 1: Anyone can read team members
CREATE POLICY "Team members are publicly readable"
    ON public.team_members
    FOR SELECT
    USING (true);

-- Policy 2: Authenticated users can join teams
CREATE POLICY "Authenticated users can join teams"
    ON public.team_members
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can leave teams (delete their own membership)
CREATE POLICY "Users can leave teams"
    ON public.team_members
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger function to auto-add creator as team member
CREATE OR REPLACE FUNCTION public.add_creator_to_team()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.team_members (team_id, user_id)
    VALUES (NEW.id, NEW.created_by);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-add creator when team is created
CREATE TRIGGER on_team_created
    AFTER INSERT ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.add_creator_to_team();

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_team_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER set_team_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_team_updated_at();

-- ============================================
-- FUNCTION TO CHECK ONE TEAM PER USER PER EVENT
-- ============================================

CREATE OR REPLACE FUNCTION public.check_one_team_per_event()
RETURNS TRIGGER AS $$
DECLARE
    event_id_var UUID;
    existing_team_count INT;
BEGIN
    -- Get the event_id for the team
    SELECT event_id INTO event_id_var
    FROM public.teams
    WHERE id = NEW.team_id;

    -- Check if user is already in a team for this event
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

-- Trigger to enforce one team per user per event
CREATE TRIGGER enforce_one_team_per_event
    BEFORE INSERT ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.check_one_team_per_event();

-- ============================================
-- HELPER VIEWS
-- ============================================

-- View to get team member counts
CREATE OR REPLACE VIEW public.team_member_counts AS
SELECT 
    team_id,
    COUNT(*) as member_count
FROM public.team_members
GROUP BY team_id;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if tables were created
-- SELECT * FROM public.teams;
-- SELECT * FROM public.team_members;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename IN ('teams', 'team_members');

-- Get teams for an event with member counts
-- SELECT t.*, COUNT(tm.user_id) as member_count
-- FROM public.teams t
-- LEFT JOIN public.team_members tm ON t.id = tm.team_id
-- WHERE t.event_id = 'your-event-id'
-- GROUP BY t.id;
