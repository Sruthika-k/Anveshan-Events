-- ============================================
-- ADD REQUIRED_SKILLS TO EVENTS TABLE
-- ============================================

-- Add required_skills column (optional text array)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS required_skills TEXT[];

-- Create index for faster skill-based queries
CREATE INDEX IF NOT EXISTS idx_events_required_skills 
ON public.events USING GIN (required_skills);

-- ============================================
-- UPDATE EXISTING EVENTS WITH SAMPLE SKILLS
-- ============================================

-- HackNITT 5.0
UPDATE public.events 
SET required_skills = ARRAY['JavaScript', 'Python', 'React', 'Node.js']
WHERE title LIKE '%HackNITT%';

-- React Workshop
UPDATE public.events 
SET required_skills = ARRAY['JavaScript', 'HTML', 'CSS', 'React']
WHERE title LIKE '%React Workshop%';

-- CodeChef SnackDown
UPDATE public.events 
SET required_skills = ARRAY['C++', 'Python', 'Java', 'Algorithms']
WHERE title LIKE '%CodeChef%';

-- AI in Healthcare
UPDATE public.events 
SET required_skills = ARRAY['Python', 'Machine Learning', 'Data Science']
WHERE title LIKE '%AI in Healthcare%';

-- Product Design Challenge
UPDATE public.events 
SET required_skills = ARRAY['Design Thinking', 'Prototyping', 'UI/UX']
WHERE title LIKE '%Product Design%';

-- Cybersecurity Bootcamp
UPDATE public.events 
SET required_skills = ARRAY['Networking', 'Linux', 'Python', 'Security']
WHERE title LIKE '%Cybersecurity%';

-- E-Summit Pitch
UPDATE public.events 
SET required_skills = ARRAY['Business', 'Presentation', 'Entrepreneurship']
WHERE title LIKE '%E-Summit%';

-- ML Study Jams
UPDATE public.events 
SET required_skills = ARRAY['Python', 'Machine Learning', 'TensorFlow', 'Data Science']
WHERE title LIKE '%Machine Learning Study%';

-- Robotics Challenge
UPDATE public.events 
SET required_skills = ARRAY['Arduino', 'C++', 'Electronics', 'Robotics']
WHERE title LIKE '%Robotics%';

-- Open Source Workshop
UPDATE public.events 
SET required_skills = ARRAY['Git', 'GitHub', 'JavaScript', 'Python']
WHERE title LIKE '%Open Source%';

-- ============================================
-- VERIFICATION
-- ============================================

-- Check updated events
-- SELECT title, required_skills FROM public.events;

-- Test skill overlap query
-- SELECT title, required_skills 
-- FROM public.events 
-- WHERE required_skills && ARRAY['Python', 'React'];
