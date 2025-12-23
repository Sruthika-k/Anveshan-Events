-- ============================================
-- SAVED EVENTS / WATCHLIST
-- ============================================

-- Create saved_events table
CREATE TABLE IF NOT EXISTS public.saved_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)  -- Prevent duplicate saves
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_events_user_id ON public.saved_events(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_event_id ON public.saved_events(event_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_created_at ON public.saved_events(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Policy 1: Users can read their own saved events
CREATE POLICY "Users can read their own saved events"
    ON public.saved_events
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy 2: Users can save events (insert)
CREATE POLICY "Users can save events"
    ON public.saved_events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can unsave events (delete their own saves)
CREATE POLICY "Users can unsave events"
    ON public.saved_events
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- HELPER VIEW (Optional)
-- ============================================

-- View to get saved event counts per event
CREATE OR REPLACE VIEW public.saved_event_counts AS
SELECT 
    event_id,
    COUNT(*) as save_count
FROM public.saved_events
GROUP BY event_id;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if table was created
-- SELECT * FROM public.saved_events;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'saved_events';

-- Get user's saved events with event details
-- SELECT e.*, se.created_at as saved_at
-- FROM public.saved_events se
-- JOIN public.events e ON se.event_id = e.id
-- WHERE se.user_id = auth.uid()
-- ORDER BY se.created_at DESC;
