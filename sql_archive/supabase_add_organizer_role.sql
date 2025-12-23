-- ============================================
-- ADD ROLE TO PROFILES
-- ============================================

-- Add role column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('student', 'organizer'));

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update existing profiles to have 'student' role
UPDATE public.profiles
SET role = 'student'
WHERE role IS NULL;

-- ============================================
-- UPDATE EVENTS TABLE FOR ORGANIZER TRACKING
-- ============================================

-- Add created_by column to events if not exists
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create index for organizer queries
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);

-- ============================================
-- RLS POLICIES FOR EVENT CREATION
-- ============================================

-- Allow organizers to create events
CREATE POLICY "Organizers can create events"
    ON public.events
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'organizer'
        )
    );

-- Allow organizers to update their own events
CREATE POLICY "Organizers can update their own events"
    ON public.events
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Allow organizers to delete their own events
CREATE POLICY "Organizers can delete their own events"
    ON public.events
    FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());
