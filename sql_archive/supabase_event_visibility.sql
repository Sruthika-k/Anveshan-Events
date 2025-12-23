-- ============================================
-- EVENT VISIBILITY RULES
-- ============================================

-- Add allowed_college field to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS allowed_college TEXT;

-- Add allowed_years field to events table (for future use)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS allowed_years TEXT[];

-- Create index for college-based filtering
CREATE INDEX IF NOT EXISTS idx_events_allowed_college ON public.events(allowed_college);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN public.events.allowed_college IS 'If set, only students from this college can see the event. NULL = public to all.';
COMMENT ON COLUMN public.events.allowed_years IS 'Array of allowed years (e.g., ["1st Year", "2nd Year"]). NULL = all years allowed.';

-- ============================================
-- EXAMPLE QUERIES
-- ============================================

-- Get events visible to a specific user
-- SELECT * FROM public.events
-- WHERE allowed_college IS NULL OR allowed_college = 'IIT Bombay';

-- Get all public events
-- SELECT * FROM public.events WHERE allowed_college IS NULL;

-- Get college-specific events
-- SELECT * FROM public.events WHERE allowed_college = 'IIT Bombay';
