-- ============================================
-- ANVESHAN - SUPABASE DATABASE SCHEMA
-- ============================================

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    college TEXT NOT NULL,
    location TEXT,
    date TEXT NOT NULL,
    deadline TEXT NOT NULL,
    eligibility TEXT,
    organizer_name TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_deadline ON public.events(deadline);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policy: Anyone can read events (public access)
CREATE POLICY "Events are publicly readable"
    ON public.events
    FOR SELECT
    USING (true);

-- Optional: Create policy for authenticated users to insert events
-- (Uncomment when you add event creation feature)
-- CREATE POLICY "Authenticated users can create events"
--     ON public.events
--     FOR INSERT
--     TO authenticated
--     WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- SEED DATA (Sample Events)
-- ============================================

INSERT INTO public.events (title, description, category, college, location, date, deadline, eligibility, organizer_name, tags) VALUES
(
    'HackNITT 5.0 - 36 Hour Hackathon',
    'Join India''s premier student hackathon! Build innovative solutions across tracks like AI/ML, Web3, Healthcare, and Sustainability. Prizes worth ₹5 lakhs, mentorship from industry experts, and networking opportunities with top tech companies.',
    'Hackathon',
    'National Institute of Technology, Tiruchirappalli',
    'NIT Trichy Campus',
    'December 28-29, 2025',
    'December 24, 2025',
    'Open to all undergraduate and postgraduate students',
    'Delta Force, NIT Trichy',
    ARRAY['Hackathon', 'AI/ML', 'Web3', '36-hour']
),
(
    'React Workshop: Building Modern Web Apps',
    'Hands-on workshop covering React fundamentals, hooks, state management with Redux, and deployment. Perfect for beginners and intermediate developers. Build a complete project from scratch.',
    'Workshop',
    'IIT Bombay',
    'Seminar Hall, CSE Department',
    'December 23, 2025',
    'December 22, 2025',
    'Basic JavaScript knowledge required',
    'Web and Coding Club, IIT Bombay',
    ARRAY['Workshop', 'React', 'Web Development', 'Frontend']
),
(
    'CodeChef SnackDown Qualifier',
    'Compete in one of the world''s largest coding competitions. Solve algorithmic challenges, compete with peers globally, and stand a chance to win exciting prizes and internship opportunities.',
    'Competition',
    'IIIT Hyderabad',
    'Online',
    'December 26, 2025',
    'December 25, 2025',
    'Open to all',
    'Programming Club, IIIT Hyderabad',
    ARRAY['Competitive Programming', 'Algorithms', 'Online', 'CodeChef']
),
(
    'AI in Healthcare: Guest Lecture by Dr. Priya Sharma',
    'Explore how artificial intelligence is revolutionizing healthcare. Learn about real-world applications in diagnostics, drug discovery, and personalized medicine from a leading researcher at AIIMS.',
    'Tech Talk',
    'BITS Pilani',
    'Auditorium Block A',
    'December 24, 2025',
    'December 23, 2025',
    'Open to all students and faculty',
    'IEEE Student Branch, BITS Pilani',
    ARRAY['AI', 'Healthcare', 'Guest Lecture', 'Research']
),
(
    'Shaastra 2026 - Product Design Challenge',
    'Design innovative products solving real-world problems. Multidisciplinary challenge welcoming ideas from engineering, design, and business students. Top teams get funding and mentorship.',
    'Competition',
    'Indian Institute of Technology, Madras',
    'IIT Madras Campus',
    'January 3-5, 2026',
    'December 27, 2025',
    'Teams of 2-4 students from any discipline',
    'Shaastra, IIT Madras',
    ARRAY['Product Design', 'Innovation', 'Multidisciplinary', 'Shaastra']
),
(
    'Cybersecurity Bootcamp: Ethical Hacking 101',
    '2-day intensive bootcamp on cybersecurity fundamentals. Learn penetration testing, network security, cryptography, and ethical hacking techniques. Industry certification provided.',
    'Workshop',
    'Delhi Technological University',
    'Computer Lab 3, IT Department',
    'December 30-31, 2025',
    'December 26, 2025',
    'CS/IT students, basic networking knowledge preferred',
    'CyberCell DTU',
    ARRAY['Cybersecurity', 'Ethical Hacking', 'Bootcamp', 'Certification']
),
(
    'E-Summit Startup Pitch Competition',
    'Pitch your startup idea to VCs and industry leaders. Win seed funding up to ₹10 lakhs, incubation support, and mentorship. Open to early-stage startups and aspiring entrepreneurs.',
    'Competition',
    'IIT Delhi',
    'Main Auditorium',
    'January 2, 2026',
    'December 28, 2025',
    'Students with startup ideas or early-stage ventures',
    'E-Cell, IIT Delhi',
    ARRAY['Startup', 'Entrepreneurship', 'Pitch', 'Funding']
),
(
    'Machine Learning Study Jams by Google',
    'Collaborative learning sessions on ML fundamentals using TensorFlow. Complete hands-on labs, earn Google Cloud credits, and get certified. Perfect for ML beginners.',
    'Workshop',
    'VIT Vellore',
    'Online + Offline Hybrid',
    'December 27, 2025',
    'December 24, 2025',
    'Open to all, Python basics recommended',
    'Google Developer Student Club, VIT',
    ARRAY['Machine Learning', 'TensorFlow', 'Google', 'Certification']
),
(
    'Techfest Robotics Challenge',
    'Build autonomous robots to complete challenging tasks. Categories include line following, maze solving, and combat robotics. Prizes worth ₹3 lakhs and internship opportunities.',
    'Competition',
    'IIT Bombay',
    'Sports Complex Ground',
    'January 4-5, 2026',
    'December 29, 2025',
    'Teams of 3-5 students, any branch',
    'Techfest, IIT Bombay',
    ARRAY['Robotics', 'Hardware', 'Automation', 'Techfest']
),
(
    'Open Source Contribution Workshop',
    'Learn how to contribute to open source projects. Understand Git workflows, find beginner-friendly issues, and make your first pull request. Connect with the global developer community.',
    'Workshop',
    'IIIT Bangalore',
    'Online (Zoom)',
    'December 25, 2025',
    'December 23, 2025',
    'Basic programming knowledge required',
    'FOSS Club, IIIT Bangalore',
    ARRAY['Open Source', 'Git', 'GitHub', 'Community']
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if table was created successfully
-- SELECT * FROM public.events ORDER BY created_at DESC;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'events';

-- Count total events
-- SELECT COUNT(*) as total_events FROM public.events;
