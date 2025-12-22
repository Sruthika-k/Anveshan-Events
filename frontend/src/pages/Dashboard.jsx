import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { supabase } from '../lib/supabase.js';
import { useCountUp } from '../hooks/useCountUp.js';

function Dashboard() {
  const navigate = useNavigate();
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

  useEffect(() => {
    // Check if this is the user's first login
    const isFirstLogin = localStorage.getItem('isFirstLogin');
    if (isFirstLogin === 'true') {
      setShowOnboarding(true);
    }

    // Fetch stats and personalized feed
    fetchDashboardData();
  }, []);

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

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile using user_id column
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, college, year, skills, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile for dashboard:', profileError);
      }

      console.log('USER ROLE:', profileData?.role); // Debug log

      setProfile(profileData);

      // Calculate profile completeness
      const completeness = calculateProfileCompleteness(profileData);
      setProfileCompleteness(completeness);

      // Fetch all active events with visibility filtering
      let query = supabase
        .from('events')
        .select('*');

      // Apply visibility filter based on user's college
      if (profile?.college) {
        // Show: public events OR events for user's college
        query = query.or(`allowed_college.is.null,allowed_college.eq.${profile.college}`);
      } else {
        // No college = only public events
        query = query.is('allowed_college', null);
      }

      const { data: events, error } = await query.order('deadline', { ascending: true });

      if (error) throw error;

      if (!events || events.length === 0) {
        setRecommendedEvents([]);
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

      setRecommendedEvents(scoredEvents);
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedEvents.map(event => {
                // Category color mapping
                const categoryColors = {
                  'Hackathon': 'border-l-4 border-purple-500',
                  'Workshop': 'border-l-4 border-blue-500',
                  'Competition': 'border-l-4 border-orange-500',
                  'Tech Talk': 'border-l-4 border-green-500'
                };
                const categoryBorder = categoryColors[event.category] || 'border-l-4 border-gray-300';

                return (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className={`bg-white rounded-xl border border-gray-200 ${categoryBorder} p-6 hover:shadow-lg hover:border-indigo-300 transition-all duration-200 hover:scale-[1.02] cursor-pointer group relative`}
                  >
                    {/* Popular Badge */}
                    {event.interest_count && event.interest_count > 10 && (
                      <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Popular
                      </div>
                    )}

                    {/* Event Title */}
                    <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {event.title}
                    </h4>

                    {/* College */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                      {event.college}
                    </p>

                    {/* Why This Event? */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {event.reasons.map((reason, index) => (
                        <span
                          key={index}
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${reason.startsWith('Matches your skill')
                            ? 'bg-indigo-100 text-indigo-700'
                            : reason === 'From your college'
                              ? 'bg-indigo-100 text-indigo-700'
                              : reason === 'Eligible for your year'
                                ? 'bg-emerald-100 text-emerald-700'
                                : reason === 'Deadline this week'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                          {reason}
                        </span>
                      ))}
                    </div>

                    {/* Deadline */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Deadline: {event.deadline}
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
