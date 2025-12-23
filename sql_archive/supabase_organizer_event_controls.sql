-- ============================================
-- ORGANIZER EVENT CONTROLS - RLS POLICIES
-- ============================================
-- Allows organizers to UPDATE and DELETE only their own events
-- Based on ownership (auth.uid() = created_by)

-- UPDATE policy: Organizers can update only their own events
CREATE POLICY "Organizers can update their own events"
ON public.events
FOR UPDATE
USING (auth.uid() = created_by);

-- DELETE policy: Organizers can delete only their own events
CREATE POLICY "Organizers can delete their own events"
ON public.events
FOR DELETE
USING (auth.uid() = created_by);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all policies on events table
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'events';

-- Expected policies:
-- 1. "Anyone can view events" (SELECT)
-- 2. "Organizers can create events" (INSERT)
-- 3. "Organizers can update their own events" (UPDATE) <- NEW
-- 4. "Organizers can delete their own events" (DELETE) <- NEW

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON POLICY "Organizers can update their own events" ON public.events IS 
'Allows organizers to update only events they created (based on created_by column)';

COMMENT ON POLICY "Organizers can delete their own events" ON public.events IS 
'Allows organizers to delete only events they created (based on created_by column)';
