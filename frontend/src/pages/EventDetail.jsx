import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../hooks/useAuth.js';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interest tracking states
  const [interestCount, setInterestCount] = useState(0);
  const [isInterested, setIsInterested] = useState(false);
  const [interestedUsers, setInterestedUsers] = useState([]);
  const [interestLoading, setInterestLoading] = useState(false);
  const [showInterestedUsers, setShowInterestedUsers] = useState(false);
  const [interestError, setInterestError] = useState(null);

  // Team states
  const [teams, setTeams] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [teamError, setTeamError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchEvent();
      fetchInterestData();
      fetchTeams();
    }
  }, [id, user]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      setEvent(data);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Event not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInterestData = async () => {
    try {
      // Get interest count
      const { data: interests, error: countError } = await supabase
        .from('event_interest')
        .select('user_id')
        .eq('event_id', id);

      if (countError) throw countError;

      setInterestCount(interests?.length || 0);

      // Check if current user is interested
      if (user) {
        const userInterest = interests?.find(i => i.user_id === user.id);
        setIsInterested(!!userInterest);
      }

      // Fetch interested users with their emails
      const { data: usersData, error: usersError } = await supabase
        .from('event_interest')
        .select(`
          id,
          created_at,
          user_id
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (usersError) throw usersError;

      // Get user emails from auth.users (need to use RPC or separate query)
      if (usersData && usersData.length > 0) {
        const userIds = usersData.map(u => u.user_id);

        // Fetch user metadata (emails) - Note: This requires a helper function or RPC
        // For now, we'll just show user IDs or create a simple display
        setInterestedUsers(usersData);
      }
    } catch (err) {
      console.error('Error fetching interest data:', err);
    }
  };

  const handleToggleInterest = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Prevent double-clicks
    if (interestLoading) return;

    setInterestLoading(true);
    setInterestError(null);

    try {
      if (isInterested) {
        // Remove interest
        const { error: deleteError } = await supabase
          .from('event_interest')
          .delete()
          .eq('event_id', id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        setIsInterested(false);
        setInterestCount(prev => Math.max(0, prev - 1));
      } else {
        // Add interest
        const { error: insertError } = await supabase
          .from('event_interest')
          .insert({
            event_id: id,
            user_id: user.id
          });

        if (insertError) {
          // Check if it's a duplicate error (user already interested)
          if (insertError.code === '23505') {
            setIsInterested(true);
            setInterestLoading(false);
            return;
          }
          throw insertError;
        }

        setIsInterested(true);
        setInterestCount(prev => prev + 1);
      }

      // Refresh interested users list
      await fetchInterestData();
    } catch (err) {
      console.error('Error toggling interest:', err);
      setInterestError('Could not update interest. Please try again.');
      // Auto-clear error after 5 seconds
      setTimeout(() => setInterestError(null), 5000);
    } finally {
      setInterestLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      setTeamsLoading(true);

      // Fetch teams for this event with member counts
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          team_members (
            user_id,
            joined_at
          )
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;

      // Add member count to each team
      const teamsWithCounts = (teamsData || []).map(team => ({
        ...team,
        member_count: team.team_members?.length || 0
      }));

      setTeams(teamsWithCounts);

      // Check if user is in any team for this event
      if (user && teamsData) {
        const userTeamData = teamsData.find(team =>
          team.team_members?.some(member => member.user_id === user.id)
        );
        setUserTeam(userTeamData || null);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setTeamsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!teamName.trim()) {
      setTeamError('Please enter a team name');
      setTimeout(() => setTeamError(null), 3000);
      return;
    }

    // Prevent double-clicks
    if (creatingTeam) return;

    try {
      setCreatingTeam(true);
      setTeamError(null);

      // Create team
      const { data: newTeam, error: createError } = await supabase
        .from('teams')
        .insert({
          event_id: id,
          name: teamName.trim(),
          created_by: user.id
        })
        .select()
        .single();

      if (createError) throw createError;

      // Refresh teams
      await fetchTeams();
      setShowCreateTeam(false);
      setTeamName('');
    } catch (err) {
      console.error('Error creating team:', err);
      if (err.message.includes('already in a team')) {
        setTeamError('You are already in a team for this event');
      } else {
        setTeamError('Could not create team. Please try again.');
      }
      setTimeout(() => setTeamError(null), 5000);
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleJoinTeam = async (teamId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setTeamError(null);

      const { error: joinError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: user.id
        });

      if (joinError) {
        if (joinError.message.includes('already in a team')) {
          setTeamError('You are already in a team for this event');
        } else {
          setTeamError('Could not join team. Please try again.');
        }
        setTimeout(() => setTeamError(null), 5000);
        return;
      }

      // Refresh teams
      await fetchTeams();
    } catch (err) {
      console.error('Error joining team:', err);
      setTeamError('Could not join team. Please try again.');
      setTimeout(() => setTeamError(null), 5000);
    }
  };

  const handleLeaveTeam = async () => {
    if (!user || !userTeam) return;

    const confirmLeave = window.confirm('Are you sure you want to leave this team?');
    if (!confirmLeave) return;

    try {
      setTeamError(null);

      const { error: leaveError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', userTeam.id)
        .eq('user_id', user.id);

      if (leaveError) throw leaveError;

      // Refresh teams
      await fetchTeams();
    } catch (err) {
      console.error('Error leaving team:', err);
      setTeamError('Could not leave team. Please try again.');
      setTimeout(() => setTeamError(null), 5000);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Hackathon': 'from-blue-500 to-blue-600',
      'Workshop': 'from-green-500 to-green-600',
      'Competition': 'from-purple-500 to-purple-600',
      'Tech Talk': 'from-orange-500 to-orange-600'
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-8 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error or Not Found State
  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Event Not Found
            </h2>
            <p className="text-gray-600 mb-8">
              {error || 'This event may have been removed or the link is incorrect'}
            </p>
            <button
              onClick={() => navigate('/events')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Events
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className="mb-8 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors group"
        >
          <svg
            className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Events
        </button>

        {/* Event Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Hero Header with Gradient */}
          <div className={`bg-gradient-to-r ${getCategoryColor(event.category)} px-8 py-12 text-white`}>
            <div className="flex items-start justify-between mb-6">
              <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold uppercase tracking-wide">
                {event.category}
              </span>
              <button
                onClick={() => setShowInterestedUsers(!showInterestedUsers)}
                className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="text-sm font-semibold">
                  {interestCount} {interestCount === 1 ? 'student' : 'students'} interested
                </span>
              </button>
            </div>

            <h1 className="text-4xl font-bold mb-4 leading-tight">
              {event.title}
            </h1>

            <p className="text-lg text-white/90 leading-relaxed max-w-3xl">
              {event.description}
            </p>
          </div>

          {/* Event Details Grid */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Date & Time */}
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-7 h-7 text-blue-600"
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
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Event Date</p>
                  <p className="text-lg font-bold text-gray-900">{event.date}</p>
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-7 h-7 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-1">Location</p>
                    <p className="text-lg font-bold text-gray-900">{event.location}</p>
                  </div>
                </div>
              )}

              {/* Organizer */}
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-7 h-7 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Organized By</p>
                  <p className="text-lg font-bold text-gray-900">{event.college}</p>
                  {event.organizer_name && (
                    <p className="text-sm text-gray-600 mt-1">{event.organizer_name}</p>
                  )}
                </div>
              </div>

              {/* Deadline */}
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-7 h-7 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Registration Closes</p>
                  <p className="text-lg font-bold text-red-600">{event.deadline}</p>
                </div>
              </div>
            </div>

            {/* Eligibility */}
            {event.eligibility && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-blue-900 mb-1">Eligibility</p>
                    <p className="text-blue-800">{event.eligibility}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="mb-8">
                <p className="text-sm font-bold text-gray-700 mb-3">Topics</p>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interest Section */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-8 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Interested in this event?
                </h3>
                <p className="text-sm text-gray-600">
                  Mark your interest and connect with other participants
                </p>
              </div>
              <button
                onClick={handleToggleInterest}
                disabled={interestLoading}
                className={`px-8 py-4 rounded-xl font-bold flex items-center gap-3 min-w-[200px] justify-center transition-all ${isInterested
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {interestLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : isInterested ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>I'm Interested</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Mark Interest</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {interestError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{interestError}</p>
              </div>
            )}

            {/* Interested Users List */}
            {showInterestedUsers && interestedUsers.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4">
                  Students Interested ({interestCount})
                </h4>
                <div className="space-y-3">
                  {interestedUsers.map((interest, index) => (
                    <div key={interest.id} className="flex items-center gap-3 py-2">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-bold text-sm">
                          {String.fromCharCode(65 + (index % 26))}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          Student {index + 1}
                          {interest.user_id === user?.id && (
                            <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          Interested {new Date(interest.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {interestCount > 10 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      + {interestCount - 10} more students interested
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Teams Section */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-8 py-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Teams for this Event</h3>

            {userTeam ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-emerald-700">You're in a team</span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-1">{userTeam.name}</h4>
                    <p className="text-sm text-gray-600">
                      {userTeam.member_count} {userTeam.member_count === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                  <button
                    onClick={handleLeaveTeam}
                    className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Leave Team
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                {!showCreateTeam ? (
                  <button
                    onClick={() => setShowCreateTeam(true)}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create a Team
                  </button>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h4 className="font-bold text-gray-900 mb-4">Create Your Team</h4>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="teamName" className="block text-sm font-semibold text-gray-700 mb-2">
                          Team Name
                        </label>
                        <input
                          type="text"
                          id="teamName"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="Enter team name"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                          disabled={creatingTeam}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleCreateTeam}
                          disabled={creatingTeam}
                          className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {creatingTeam ? 'Creating...' : 'Create Team'}
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateTeam(false);
                            setTeamName('');
                          }}
                          disabled={creatingTeam}
                          className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-all disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Teams List */}
            {teamsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : teams.length > 0 ? (
              <div className="space-y-3">
                {teams.map(team => (
                  <div
                    key={team.id}
                    className={`bg-white rounded-xl border p-6 transition-all ${userTeam?.id === team.id
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{team.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                      </div>
                      {!userTeam && user && (
                        <button
                          onClick={() => handleJoinTeam(team.id)}
                          className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Join Team
                        </button>
                      )}
                      {userTeam?.id === team.id && (
                        <span className="px-4 py-2 bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-sm">
                          Your Team
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Teams Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Be the first to create a team for this event
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default EventDetail;
