-- ============================================
-- EVENT INTEREST TRACKING SCHEMA
-- ============================================

-- Create event_interest table
CREATE TABLE IF NOT EXISTS public.event_interest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id) -- Prevent duplicate interest per user per event
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_interest_user_id ON public.event_interest(user_id);
CREATE INDEX IF NOT EXISTS idx_event_interest_event_id ON public.event_interest(event_id);
CREATE INDEX IF NOT EXISTS idx_event_interest_created_at ON public.event_interest(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.event_interest ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Policy 1: Anyone can read event interests (to see who's interested)
CREATE POLICY "Event interests are publicly readable"
    ON public.event_interest
    FOR SELECT
    USING (true);

-- Policy 2: Authenticated users can insert their own interest
CREATE POLICY "Users can mark their own interest"
    ON public.event_interest
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can delete their own interest (unmark interest)
CREATE POLICY "Users can remove their own interest"
    ON public.event_interest
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- HELPER VIEWS (Optional but useful)
-- ============================================

-- View to get interest count per event
CREATE OR REPLACE VIEW public.event_interest_counts AS
SELECT 
    event_id,
    COUNT(*) as interest_count
FROM public.event_interest
GROUP BY event_id;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if table was created
-- SELECT * FROM public.event_interest;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'event_interest';

-- Get interest count for a specific event
-- SELECT COUNT(*) FROM public.event_interest WHERE event_id = 'your-event-id';

-- Get list of interested users for an event (with email from auth.users)
-- SELECT ei.*, u.email 
-- FROM public.event_interest ei
-- JOIN auth.users u ON ei.user_id = u.id
-- WHERE ei.event_id = 'your-event-id'
-- ORDER BY ei.created_at DESC;
