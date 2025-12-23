-- ============================================
-- ADD MISSING EVENT FIELDS
-- Migration to add date, location, organizer_name, and eligibility
-- ============================================

-- Add date column (event date)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS date TEXT NOT NULL DEFAULT '';

-- Add location column (event location)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add organizer_name column (organizer/club name)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS organizer_name TEXT;

-- Add eligibility column (eligibility criteria)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS eligibility TEXT;

-- Remove the default constraint from date after adding the column
ALTER TABLE public.events
ALTER COLUMN date DROP DEFAULT;

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN public.events.date IS 'Event date (format: YYYY-MM-DD or text)';
COMMENT ON COLUMN public.events.location IS 'Event location (e.g., "Mumbai, Maharashtra")';
COMMENT ON COLUMN public.events.organizer_name IS 'Name of organizing club/committee';
COMMENT ON COLUMN public.events.eligibility IS 'Eligibility criteria (e.g., "Open to all students")';

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Check the updated schema
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'events'
-- ORDER BY ordinal_position;
