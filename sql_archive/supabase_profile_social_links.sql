-- ============================================
-- PROFILE SOCIAL LINKS
-- ============================================

-- Add social links to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT;

-- Add constraints for URL format (optional validation)
ALTER TABLE public.profiles
ADD CONSTRAINT linkedin_url_format CHECK (
  linkedin_url IS NULL OR 
  linkedin_url ~ '^https?://(www\.)?linkedin\.com/.*'
);

ALTER TABLE public.profiles
ADD CONSTRAINT github_url_format CHECK (
  github_url IS NULL OR 
  github_url ~ '^https?://(www\.)?github\.com/.*'
);

COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn profile URL (optional)';
COMMENT ON COLUMN public.profiles.github_url IS 'GitHub profile URL (optional)';
