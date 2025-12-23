-- ============================================
-- ADD SKILLS TO TEAM MEMBERS
-- ============================================

-- We'll fetch member skills from profiles table via JOIN
-- No schema changes needed - just use existing data

-- Helper view to get team members with their skills
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
LEFT JOIN public.profiles p ON tm.user_id = p.user_id;

-- View to get team skill aggregates
CREATE OR REPLACE VIEW public.team_skills_summary AS
SELECT 
    t.id as team_id,
    t.name as team_name,
    t.event_id,
    array_agg(DISTINCT skill) FILTER (WHERE skill IS NOT NULL) as all_skills,
    COUNT(DISTINCT tm.user_id) as member_count
FROM public.teams t
LEFT JOIN public.team_members tm ON t.id = tm.team_id
LEFT JOIN public.profiles p ON tm.user_id = p.user_id
LEFT JOIN LATERAL unnest(p.skills) as skill ON true
GROUP BY t.id, t.name, t.event_id;
