import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';
import Navbar from '../components/Navbar.jsx';
import EventHeatmap from '../components/EventHeatmap.jsx';
import SkillMatchBar from '../components/SkillMatchBar.jsx';
import { supabase } from '../lib/supabase.js';
import { useCountUp } from '../hooks/useCountUp.js';
import {
  rankRecommendations,
  getMatchQuality,
  getMatchColors,
  calculateSkillMatch
} from '../utils/recommendationScore.js';

function Dashboard() {
  const navigate = useNavigate();

  // Defensive guard: prevent crash if useAuth is undefined
  const authHook = useAuth?.() || { user: null, profile: null, profileLoading: false };
  const { user, profile: cachedProfile, profileLoading: cachedProfileLoading } = authHook;
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    activeEvents: 0,
    deadlinesThisWeek: 0,
    partnerColleges: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Personalized feed state
  const [profile, setProfile] = useState(null);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Saved events state
  const [savedEvents, setSavedEvents] = useState([]);
  const [savedEventIds, setSavedEventIds] = useState(new Set());
  const [savedEventsLoading, setSavedEventsLoading] = useState(false);

  // Profile completeness
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  // Animated counters for stats
  const animatedActiveEvents = useCountUp(stats.activeEvents, 1500);
  const animatedDeadlines = useCountUp(stats.deadlinesThisWeek, 1500);
  const animatedColleges = useCountUp(stats.partnerColleges, 1500);

  // PERFORMANCE: Proper dependency arrays
  useEffect(() => {
    // Check if this is the user's first login
    const isFirstLogin = localStorage.getItem('isFirstLogin');
    if (isFirstLogin === 'true') {
      setShowOnboarding(true);
    }

    // Fetch stats once on mount
    fetchDashboardStats();
  }, []); // Run once on mount

  // Fetch personalized feed when user is available
  useEffect(() => {
    if (user) {
      fetchPersonalizedFeed();
      fetchSavedEvents();
    }
  }, [user?.id]); // Re-fetch when user changes

  const fetchDashboardData = async () => {
    await Promise.all([
      fetchDashboardStats(),
      fetchPersonalizedFeed(),
      fetchSavedEvents()
    ]);
  };

  const fetchPersonalizedFeed = async () => {
    try {
      setEventsLoading(true);

      // GUARD: If no user, load nothing
      if (!user) {
        setRecommendedEvents([]);
        setEventsLoading(false);
        return;
      }

      // Profile can be null - that's OK, we'll show generic events
      // Fetch profile if not already available
      let profileData = cachedProfile;
      if (!profileData && user) {
        try {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            profileData = null;
          } else {
            profileData = data || null;
          }
        } catch (err) {
          console.error('Error in profile fetch:', err);
          profileData = null;
        }
      }
      
      setProfile(profileData);

      // Calculate profile completeness (safe with null)
      const completeness = calculateProfileCompleteness(profileData);
      setProfileCompleteness(completeness);

      // Fetch all active events with visibility filtering
      let query = supabase
        .from('events')
        .select('*');

      // RULE 1: If profile is null → fetch public events
      // RULE 2: If profile.college is null → fetch public events
      // RULE 3: Only apply college filter if college exists
      if (profileData?.college) {
        // Show: public events OR events for user's college
        query = query.or(`allowed_college.is.null,allowed_college.eq.${profileData.college}`);
      } else {
        // No profile or no college = only public events
        query = query.is('allowed_college', null);
      }

      const { data: events, error } = await query.order('deadline', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        setRecommendedEvents([]);
        setEventsLoading(false);
        return;
      }

      if (!events || events.length === 0) {
        setRecommendedEvents([]);
        setEventsLoading(false);
        return;
      }

      // Filter and score events
      const today = new Date();
      today.setHours(0, 0, 0);

      const scoredEvents = events
        .filter(event => {
          // Only show events with future deadlines
          const deadlineDate = parseDeadlineDate(event.deadline);
          return deadlineDate && deadlineDate >= today;
        })
        .map(event => {
          const reasons = [];
          let score = 0;
          let matchedSkills = [];

          // PRIORITY 1: Skill Overlap (HIGHEST PRIORITY)
          if (profileData?.skills && Array.isArray(profileData.skills) && profileData.skills.length > 0) {
            if (event.required_skills && Array.isArray(event.required_skills) && event.required_skills.length > 0) {
              // Find overlapping skills (case-insensitive)
              const userSkillsLower = profileData.skills.map(s => s.toLowerCase());
              const eventSkillsLower = event.required_skills.map(s => s.toLowerCase());

              matchedSkills = profileData.skills.filter(skill =>
                eventSkillsLower.includes(skill.toLowerCase())
              );

              if (matchedSkills.length > 0) {
                // Each matching skill adds significant points
                score += matchedSkills.length * 200; // 200 points per skill match

                // Add reason with matched skills
                if (matchedSkills.length === 1) {
                  reasons.push(`Matches your skill: ${matchedSkills[0]}`);
                } else if (matchedSkills.length <= 3) {
                  reasons.push(`Matches your skills: ${matchedSkills.join(', ')}`);
                } else {
                  reasons.push(`Matches ${matchedSkills.length} of your skills`);
                }
              }
            }
          }

          // PRIORITY 2: Same college
          if (profileData?.college && event.college === profileData.college) {
            reasons.push('From your college');
            score += 100;
          }


          // PRIORITY 3: Deadline urgency (closer deadline = higher score)
          const deadlineDate = parseDeadlineDate(event.deadline);
          if (deadlineDate) {
            const daysUntilDeadline = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilDeadline <= 7) {
              reasons.push('Deadline this week');
              score += 30;
            } else if (daysUntilDeadline <= 14) {
              score += 20;
            } else {
              score += 10;
            }
          }

          // Default reason if no specific matches
          if (reasons.length === 0) {
            reasons.push('Upcoming event');
          }

          return {
            ...event,
            reasons,
            score,
            matchedSkills // Store for potential future use
          };
        })
        .sort((a, b) => b.score - a.score)  // Sort by score (highest first)
        .slice(0, 6);  // Show top 6 recommendations

      // Use smart ranking algorithm
      const rankedEvents = rankRecommendations(scoredEvents, profileData);
      setRecommendedEvents(rankedEvents);
    } catch (err) {
      console.error('Error fetching personalized feed:', err);
      setRecommendedEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchSavedEvents = async () => {
    try {
      setSavedEventsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch saved event IDs
      const { data: saves, error: savesError } = await supabase
        .from('saved_events')
        .select('event_id')
        .eq('user_id', user.id);

      if (savesError) {
        console.error('Error fetching saved events:', savesError);
        return;
      }

      const eventIds = saves?.map(s => s.event_id) || [];
      setSavedEventIds(new Set(eventIds));

      if (eventIds.length === 0) {
        setSavedEvents([]);
        return;
      }

      // Fetch full event details for saved events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .order('deadline', { ascending: true });

      if (eventsError) {
        console.error('Error fetching saved event details:', eventsError);
        return;
      }

      setSavedEvents(events || []);
    } catch (err) {
      console.error('Error in fetchSavedEvents:', err);
    } finally {
      setSavedEventsLoading(false);
    }
  };

  const handleSaveEvent = async (eventId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { error } = await supabase
        .from('saved_events')
        .insert({ user_id: user.id, event_id: eventId });

      if (error) {
        console.error('Error saving event:', error);
        return;
      }

      // Update local state
      setSavedEventIds(prev => new Set([...prev, eventId]));
      await fetchSavedEvents(); // Refresh saved events list
    } catch (err) {
      console.error('Error in handleSaveEvent:', err);
    }
  };

  const handleUnsaveEvent = async (eventId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('saved_events')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (error) {
        console.error('Error unsaving event:', error);
        return;
      }

      // Update local state
      setSavedEventIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
      await fetchSavedEvents(); // Refresh saved events list
    } catch (err) {
      console.error('Error in handleUnsaveEvent:', err);
    }
  };

  const calculateProfileCompleteness = (profileData) => {
    if (!profileData) return 0;

    let completed = 0;
    let total = 3;

    if (profileData.name) completed++;
    if (profileData.college) completed++;
    if (profileData.skills && Array.isArray(profileData.skills) && profileData.skills.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);

      // Fetch all events
      const { data: events, error } = await supabase
        .from('events')
        .select('deadline, college');

      if (error) throw error;

      if (!events || events.length === 0) {
        setStats({
          activeEvents: 0,
          deadlinesThisWeek: 0,
          partnerColleges: 0
        });
        return;
      }

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get date 7 days from now
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Calculate stats
      let activeCount = 0;
      let weekCount = 0;
      const collegeSet = new Set();

      events.forEach(event => {
        // Add to unique colleges set
        if (event.college) {
          collegeSet.add(event.college);
        }

        // Parse deadline (format: "December 24, 2025" or similar)
        if (event.deadline) {
          const deadlineDate = parseDeadlineDate(event.deadline);

          if (deadlineDate) {
            // Active events: deadline >= today
            if (deadlineDate >= today) {
              activeCount++;
            }

            // Deadlines this week: deadline between today and next 7 days
            if (deadlineDate >= today && deadlineDate <= nextWeek) {
              weekCount++;
            }
          }
        }
      });

      setStats({
        activeEvents: activeCount,
        deadlinesThisWeek: weekCount,
        partnerColleges: collegeSet.size
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setStats({
        activeEvents: 0,
        deadlinesThisWeek: 0,
        partnerColleges: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Helper function to parse deadline strings
  const parseDeadlineDate = (deadlineStr) => {
    try {
      // Handle formats like "December 24, 2025"
      const date = new Date(deadlineStr);
      if (!isNaN(date.getTime())) {
        date.setHours(0, 0, 0, 0);
        return date;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleDismissOnboarding = () => {
    localStorage.removeItem('isFirstLogin');
    setShowOnboarding(false);
  };

  const handleCompleteProfile = () => {
    localStorage.removeItem('isFirstLogin');
    setShowOnboarding(false);
    navigate('/profile');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('isFirstLogin');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar */}
      <Navbar />

      {/* Onboarding Banner for First-Time Users */}
      {showOnboarding && (
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 border-b border-indigo-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold mb-1">Welcome to Anveshan!</h3>
                  <p className="text-indigo-100 text-sm">
                    Start discovering events and marking your interests
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCompleteProfile}
                  className="px-4 py-2 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors text-sm whitespace-nowrap"
                >
                  View Profile
                </button>
                <button
                  onClick={handleDismissOnboarding}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Dismiss"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Your Gateway to College Events
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl">
            Discover hackathons, workshops, and competitions happening across India's top colleges. Never miss a deadline again.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Active Events Stat */}
          <StatCard
            loading={statsLoading}
            value={animatedActiveEvents}
            label="Active Events"
            icon={
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            gradient="from-indigo-50 to-indigo-100"
          />

          {/* Deadlines This Week Stat */}
          <StatCard
            loading={statsLoading}
            value={animatedDeadlines}
            label="Deadlines This Week"
            icon={
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            gradient="from-emerald-50 to-emerald-100"
          />

          {/* Partner Colleges Stat */}
          <StatCard
            loading={statsLoading}
            value={animatedColleges}
            label="Partner Colleges"
            icon={
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            gradient="from-blue-50 to-blue-100"
          />
        </div>

        {/* Event Activity Heatmap */}
        <div className="mb-12">
          <EventHeatmap
            events={recommendedEvents}
            loading={eventsLoading}
          />
        </div>

        {/* Personalized Event Feed */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {profile?.college || profile?.year ? 'For You' : 'Upcoming Events'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {profile?.college || profile?.year
                  ? 'Events matched to your profile'
                  : 'Complete your profile for personalized recommendations'}
              </p>
            </div>
            <button
              onClick={() => navigate('/events')}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {eventsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : recommendedEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedEvents.slice(0, 6).map(event => {
                const skillMatch = calculateSkillMatch(profile?.skills, event?.required_skills);
                const matchColors = getMatchColors(event.recommendationScore || skillMatch);
                const matchQuality = getMatchQuality(event.recommendationScore || skillMatch);
                const daysUntil = event.deadline ? differenceInDays(parseISO(event.deadline), new Date()) : null;
                const isPerfectMatch = (event.recommendationScore || skillMatch) >= 90;

                return (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className={`bg-white rounded-2xl border-2 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative overflow-hidden ${(event.recommendationScore || skillMatch) >= 80 ? matchColors.border : 'border-gray-200'
                      } ${(event.recommendationScore || skillMatch) >= 80 ? matchColors.ring : ''}`}
                  >
                    {/* Gradient Overlay for High Matches */}
                    {(event.recommendationScore || skillMatch) >= 80 && (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 pointer-events-none"></div>
                    )}

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Match Score Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`px-4 py-2 rounded-xl font-bold text-sm shadow-lg ${matchColors.badge
                          } ${isPerfectMatch ? 'animate-pulse-slow' : ''}`}>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{event.recommendationScore || skillMatch}% Match</span>
                          </div>
                          <div className="text-xs font-normal opacity-90 mt-0.5">
                            {matchQuality}
                          </div>
                        </div>

                        {/* Category Badge */}
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg">
                          {event.category}
                        </span>
                      </div>

                      {/* Event Title */}
                      <h4 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {event.title}
                      </h4>

                      {/* College */}
                      <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {event.college}
                      </p>

                      {/* Skill Match Visualization */}
                      <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                        <SkillMatchBar
                          userSkills={profile?.skills || []}
                          requiredSkills={event?.required_skills || []}
                          matchPercentage={skillMatch}
                        />
                      </div>

                      {/* Why This Event? */}
                      <div className="space-y-2 mb-4">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                          Why Recommended?
                        </p>
                        <div className="space-y-1.5">
                          {/* Skill Match */}
                          {skillMatch > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs">
                                You have {event.required_skills?.filter(skill =>
                                  profile?.skills?.map(s => s.toLowerCase()).includes(skill.toLowerCase())
                                ).length || 0}/{event.required_skills?.length || 0} required skills
                              </span>
                            </div>
                          )}

                          {/* College Match */}
                          {profile?.college && event.college === profile.college && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                              </svg>
                              <span className="text-xs">From your college</span>
                            </div>
                          )}

                          {/* Urgency */}
                          {daysUntil !== null && daysUntil <= 7 && daysUntil >= 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-semibold text-orange-600">
                                Deadline in {daysUntil} {daysUntil === 1 ? 'day' : 'days'}!
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Deadline */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Deadline: {event.deadline}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Events Available
              </h3>
              <p className="text-gray-600 mb-6">
                {profile?.college || profile?.year
                  ? 'No events match your profile right now. Check back soon!'
                  : 'Complete your profile to see personalized recommendations'}
              </p>
              {!(profile?.college || profile?.year) && (
                <button
                  onClick={() => navigate('/profile')}
                  className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Complete Profile
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Explore Events Card - Primary */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Explore Events
                </h3>
                <p className="text-blue-100 text-sm">
                  Discover upcoming college events, workshops, and competitions
                </p>
              </div>
              <svg
                className="w-8 h-8 text-blue-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <button
              onClick={() => navigate('/events')}
              className="w-full bg-white text-blue-600 py-3 px-4 rounded-md hover:bg-blue-50 transition font-semibold shadow-sm"
            >
              Browse Events
            </button>
          </div>

          {/* My Profile Card - Secondary */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  My Profile
                </h3>
                <p className="text-gray-600 text-sm">
                  View your account information and settings
                </p>
              </div>
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-full bg-white text-blue-600 py-3 px-4 rounded-md border-2 border-blue-600 hover:bg-blue-50 transition font-semibold"
            >
              View Profile
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({ loading, value, label, icon, gradient }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl border border-gray-200 shadow-sm p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl cursor-default`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-1">
            {label}
          </p>
          <p className="text-4xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="w-14 h-14 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
