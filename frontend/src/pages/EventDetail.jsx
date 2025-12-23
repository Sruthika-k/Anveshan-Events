import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import TeamCompatibilityCard from '../components/TeamCompatibilityCard.jsx';
import TeamCardSkeleton from '../components/TeamCardSkeleton.jsx';
import InterestCelebration from '../components/InterestCelebration.jsx';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../hooks/useAuth.js';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Defensive guard: prevent crash if useAuth is undefined
  const authHook = useAuth?.() || { user: null, profile: null, profileLoading: false };
  const { user, profile: cachedProfile, profileLoading } = authHook;

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

  // Celebration states
  const [showCelebration, setShowCelebration] = useState(false);
  const [animatedCount, setAnimatedCount] = useState(0);

  // Team states
  const [teams, setTeams] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [joiningTeamId, setJoiningTeamId] = useState(null);
  const [leavingTeam, setLeavingTeam] = useState(false);
  const [teamError, setTeamError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Edit/Delete states
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // PERFORMANCE: Sequential fetching with proper dependencies

  // Step 1: Fetch event when ID changes
  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]); // Only re-fetch when ID changes

  // Step 2: Fetch interest data ONLY after event loads
  useEffect(() => {
    if (event?.id && !loading) {
      fetchInterestData();
    }
  }, [event?.id, user?.id]); // Only when event or user changes

  // Step 3: Fetch teams ONLY if user is interested
  useEffect(() => {
    if (isInterested && event?.id && !loading) {
      fetchTeams();
    }
  }, [isInterested, event?.id]); // Only when interest status or event changes

  // Step 4: Use cached profile from useAuth
  useEffect(() => {
    if (cachedProfile && !profileLoading) {
      setUserProfile(cachedProfile);
    }
  }, [cachedProfile, profileLoading]); // Use cached profile instead of fetching

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      setEvent(null);

      // Validate event ID exists
      if (!id) {
        setError('Invalid event ID');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle(); // ✅ Changed from .single() to .maybeSingle()

      if (fetchError) {
        console.error('Error fetching event:', fetchError);
        setError('Failed to load event. Please try again.');
        setLoading(false);
        return;
      }

      // ✅ Explicit check for no data
      if (!data) {
        setError('Event not found');
        setLoading(false);
        return;
      }

      // Check visibility - if event is college-restricted
      if (data.allowed_college) {
        // PERFORMANCE: Use cached profile instead of fetching
        if (user && cachedProfile && cachedProfile.college) {
          // Check if user has access - only if profile and college exist
          if (cachedProfile.college !== data.allowed_college) {
            // User doesn't have access to this restricted event
            setError('You do not have access to this event. This event is restricted to students from ' + data.allowed_college + '.');
            setEvent(null);
            setLoading(false);
            return;
          }
        } else if (user && profileLoading) {
          // Profile is still loading, wait
          setLoading(true);
          return;
        } else if (user) {
          // User logged in but no profile or no college - can't access restricted event
          setError('This event is restricted to students from ' + data.allowed_college + '. Please complete your profile with your college information.');
          setEvent(null);
          setLoading(false);
          return;
        } else {
          // Not logged in, can't access restricted event
          setError('This event is restricted. Please log in to view.');
          setEvent(null);
          setLoading(false);
          return;
        }
      }

      // ✅ Only set event if all checks pass
      setEvent(data);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('An unexpected error occurred. Please try again.');
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterestData = async () => {
    // ✅ Safety guard - don't fetch if no event ID
    if (!id) return;

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
      // Don't set error state - this is non-critical data
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

    // Store old values for rollback
    const oldIsInterested = isInterested;
    const oldCount = interestCount;

    try {
      if (isInterested) {
        // Remove interest - optimistic update
        setIsInterested(false);
        setInterestCount(prev => Math.max(0, prev - 1));
        setAnimatedCount(Math.max(0, oldCount - 1));

        const { error: deleteError } = await supabase
          .from('event_interest')
          .delete()
          .eq('event_id', id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
      } else {
        // Add interest - optimistic update
        setIsInterested(true);
        const newCount = oldCount + 1;
        setInterestCount(newCount);
        setAnimatedCount(newCount);

        // Trigger celebration!
        setShowCelebration(true);

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
      }

      // Refresh interested users list
      await fetchInterestData();
    } catch (err) {
      console.error('Error toggling interest:', err);

      // Rollback on error
      setIsInterested(oldIsInterested);
      setInterestCount(oldCount);
      setAnimatedCount(oldCount);

      setInterestError('Could not update interest. Please try again.');
      // Auto-clear error after 5 seconds
      setTimeout(() => setInterestError(null), 5000);
    } finally {
      setInterestLoading(false);
    }
  };

  const fetchTeams = async () => {
    // ✅ Safety guard - don't fetch if no event ID
    if (!id) return;

    try {
      setTeamsLoading(true);

      // PERFORMANCE: Use cached profile instead of fetching
      // Profile is already set via useEffect from cachedProfile

      // PERFORMANCE: Simplified query - no nested joins
      // Step 1: Fetch teams only
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;

      // Step 2: Fetch team members separately (lighter query)
      const teamIds = (teamsData || []).map(t => t.id);

      let teamsWithDetails = teamsData || [];

      if (teamIds.length > 0) {
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select('team_id, user_id, joined_at')
          .in('team_id', teamIds);

        if (!membersError && membersData) {
          // Group members by team
          const membersByTeam = membersData.reduce((acc, member) => {
            if (!acc[member.team_id]) acc[member.team_id] = [];
            acc[member.team_id].push({
              user_id: member.user_id,
              joined_at: member.joined_at
            });
            return acc;
          }, {});

          // Attach members to teams
          teamsWithDetails = teamsData.map(team => ({
            ...team,
            members: membersByTeam[team.id] || [],
            member_count: (membersByTeam[team.id] || []).length
          }));
        }
      }

      setTeams(teamsWithDetails);

      // Check if user is in any team for this event
      if (user && teamsWithDetails) {
        const userTeamData = teamsWithDetails.find(team =>
          team.members?.some(member => member.user_id === user.id)
        );
        setUserTeam(userTeamData || null);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      // Don't set error state - this is non-critical data
    } finally {
      setTeamsLoading(false);
    }
  };

  // TEAM NAME VALIDATION
  const validateTeamName = (name) => {
    if (!name || name.trim().length < 3) {
      return 'Team name must be at least 3 characters';
    }
    if (name.trim().length > 50) {
      return 'Team name must be less than 50 characters';
    }
    if (!/^[a-zA-Z0-9\s\-]+$/.test(name.trim())) {
      return 'Team name can only contain letters, numbers, spaces, and hyphens';
    }
    return null;
  };

  const handleCreateTeam = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // CRITICAL: Check if user is interested
    if (!isInterested) {
      setTeamError('❌ You must mark interest in this event first');
      setTimeout(() => setTeamError(null), 5000);
      return;
    }

    // Validate team name
    const nameError = validateTeamName(teamName);
    if (nameError) {
      setTeamError(nameError);
      setTimeout(() => setTeamError(null), 3000);
      return;
    }

    // Check for duplicate team names
    const isDuplicate = teams.some(t =>
      t.name.toLowerCase() === teamName.trim().toLowerCase()
    );
    if (isDuplicate) {
      setTeamError('A team with this name already exists');
      setTimeout(() => setTeamError(null), 5000);
      return;
    }

    // Check if already in a team
    if (userTeam) {
      setTeamError('You are already in a team for this event');
      setTimeout(() => setTeamError(null), 5000);
      return;
    }

    // Prevent double-clicks
    if (creatingTeam) return;

    try {
      setCreatingTeam(true);
      setTeamError(null);

      // Create team (trigger will auto-add creator to team_members)
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

      // Success! Show toast
      setTeamError(null);

      // Refresh teams
      await fetchTeams();
      setShowCreateTeam(false);
      setTeamName('');

      // Show success message
      alert('✅ Team created successfully! You have been added to the team.');
    } catch (err) {
      console.error('Error creating team:', err);

      // Improved error messages
      if (err.message.includes('already in a team') || err.code === '23505') {
        setTeamError('You are already in a team for this event');
      } else if (err.message.includes('interest')) {
        setTeamError('You must mark interest in this event first');
      } else if (err.message.includes('duplicate')) {
        setTeamError('A team with this name already exists');
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

    // CRITICAL: Check if user is interested
    if (!isInterested) {
      setTeamError('❌ You must mark interest in this event first');
      setTimeout(() => setTeamError(null), 5000);
      return;
    }

    // Check if already in a team
    if (userTeam) {
      setTeamError('You are already in a team for this event');
      setTimeout(() => setTeamError(null), 5000);
      return;
    }

    // Check team capacity
    const team = teams.find(t => t.id === teamId);
    if (team && team.member_count >= 4) {
      setTeamError('This team is full (max 4 members)');
      setTimeout(() => setTeamError(null), 5000);
      return;
    }

    // Prevent double-clicks (debouncing)
    if (joiningTeamId) return;
    setJoiningTeamId(teamId);

    // Optimistic UI update
    const oldUserTeam = userTeam;
    const oldTeams = [...teams];

    if (team) {
      setUserTeam(team);
      setTeams(teams.map(t =>
        t.id === teamId
          ? { ...t, member_count: t.member_count + 1 }
          : t
      ));
    }

    try {
      setTeamError(null);

      const { error: joinError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: user.id
        });

      if (joinError) throw joinError;

      // Success! Refresh to get accurate data
      await fetchTeams();

      // Show success message
      alert(`✅ You joined ${team?.name || 'the team'}!`);
    } catch (err) {
      console.error('Error joining team:', err);

      // Rollback optimistic update
      setUserTeam(oldUserTeam);
      setTeams(oldTeams);

      // Improved error messages
      if (err.message.includes('already in a team') || err.code === '23505') {
        setTeamError('You are already in a team for this event');
      } else if (err.message.includes('interest')) {
        setTeamError('You must mark interest in this event first');
      } else if (err.message.includes('full')) {
        setTeamError('This team is full (max 4 members)');
      } else {
        setTeamError('Could not join team. Please try again.');
      }
      setTimeout(() => setTeamError(null), 5000);
    } finally {
      setJoiningTeamId(null);
    }
  };

  const handleLeaveTeam = async () => {
    if (!user || !userTeam) return;

    const confirmLeave = window.confirm(
      `Are you sure you want to leave "${userTeam.name}"?\n\n` +
      (userTeam.created_by === user.id
        ? 'Note: As the creator, ownership will transfer to the oldest member.'
        : '')
    );
    if (!confirmLeave) return;

    // Prevent double-clicks
    if (leavingTeam) return;
    setLeavingTeam(true);

    // Optimistic UI update
    const oldUserTeam = userTeam;
    const oldTeams = [...teams];

    setUserTeam(null);
    setTeams(teams.map(t =>
      t.id === userTeam.id
        ? { ...t, member_count: Math.max(0, t.member_count - 1) }
        : t
    ));

    try {
      setTeamError(null);

      const { error: leaveError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', userTeam.id)
        .eq('user_id', user.id);

      if (leaveError) throw leaveError;

      // Refresh teams (team may be auto-deleted if last member)
      await fetchTeams();

      // Show success message
      alert('✅ You left the team successfully');
    } catch (err) {
      console.error('Error leaving team:', err);

      // Rollback optimistic update
      setUserTeam(oldUserTeam);
      setTeams(oldTeams);

      setTeamError('Could not leave team. Please try again.');
      setTimeout(() => setTeamError(null), 5000);
    } finally {
      setLeavingTeam(false);
    }
  };

  // Edit Event Handlers
  const handleEditClick = () => {
    setEditFormData({
      title: event.title,
      description: event.description,
      college: event.college,
      category: event.category,
      deadline: event.deadline,
      required_skills: event.required_skills?.join(', ') || '',
      allowed_college: event.allowed_college || '',
      tags: event.tags?.join(', ') || ''
    });
    setIsEditing(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);

    try {
      const skills = editFormData.required_skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      const tags = editFormData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t);

      const { error: updateError } = await supabase
        .from('events')
        .update({
          title: editFormData.title,
          description: editFormData.description,
          college: editFormData.college,
          category: editFormData.category,
          deadline: editFormData.deadline,
          required_skills: skills,
          allowed_college: editFormData.allowed_college || null,
          tags: tags.length > 0 ? tags : null
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Refresh event data
      await fetchEvent();
      setIsEditing(false);
      setEditFormData(null);
    } catch (err) {
      console.error('Error updating event:', err);
      setError('Failed to update event. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdating(false);
    }
  };

  // Delete Event Handler
  const handleDeleteEvent = async () => {
    setDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Redirect to events page
      navigate('/events');
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again.');
      setShowDeleteConfirm(false);
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeleting(false);
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

            {/* Edit/Delete Buttons - Only for event owner */}
            {user && event && user.id === event.created_by && !isEditing && (
              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleEditClick}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Event
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600/80 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Event
                </button>
              </div>
            )}

            <p className="text-lg text-white/90 leading-relaxed max-w-3xl">
              {event.description}
            </p>
          </div>

          {/* Edit Form - Only shown when editing */}
          {isEditing && editFormData && (
            <div className="p-8 border-b border-gray-200 bg-gray-50">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Event</h3>
              <form onSubmit={handleUpdateEvent} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">College *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.college}
                      onChange={(e) => setEditFormData({ ...editFormData, college: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                    <select
                      required
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="Hackathon">Hackathon</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Competition">Competition</option>
                      <option value="Tech Talk">Tech Talk</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Deadline *</label>
                    <input
                      type="date"
                      required
                      value={editFormData.deadline}
                      onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Required Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={editFormData.required_skills}
                    onChange={(e) => setEditFormData({ ...editFormData, required_skills: e.target.value })}
                    placeholder="e.g., React, Python, Machine Learning"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editFormData.tags}
                    onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                    placeholder="e.g., AI, Web Development, Innovation"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Restrict to College (Optional)</label>
                  <input
                    type="text"
                    value={editFormData.allowed_college}
                    onChange={(e) => setEditFormData({ ...editFormData, allowed_college: e.target.value })}
                    placeholder="Leave empty for public event"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editFormData.allowed_college ? (
                      <span className="text-yellow-600">⚠️ Only students from {editFormData.allowed_college} will see this event</span>
                    ) : (
                      <span className="text-green-600">✓ Event is public to all colleges</span>
                    )}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? 'Updating...' : 'Update Event'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditFormData(null);
                    }}
                    disabled={updating}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Event Details Grid */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Deadline */}
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-7 h-7 text-indigo-600"
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
                  <p className="text-sm font-semibold text-gray-500 mb-1">Registration Deadline</p>
                  <p className="text-lg font-bold text-gray-900">{event.deadline}</p>
                </div>
              </div>


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
                className={`px-8 py-4 rounded-xl font-bold flex items-center gap-3 min-w-[200px] justify-center transition-all duration-300 ${isInterested
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 scale-100'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:scale-105'
                  } disabled:opacity-50 disabled:cursor-not-allowed ${interestLoading ? '' : 'active:scale-95'}`}
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
                    disabled={leavingTeam}
                    className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {leavingTeam ? 'Leaving...' : 'Leave Team'}
                  </button>
                </div>
              </div>
            ) : isInterested ? (
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
            ) : null}

            {/* Team Error Message */}
            {teamError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{teamError}</p>
              </div>
            )}

            {/* Teams List - ONLY visible to interested users */}
            {isInterested && (
              <>
                {teamsLoading ? (
                  <TeamCardSkeleton count={3} />
                ) : teams.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map((team, index) => (
                      <TeamCompatibilityCard
                        key={team.id}
                        team={team}
                        event={event}
                        userProfile={userProfile || cachedProfile}
                        onJoinTeam={() => handleJoinTeam(team.id)}
                        isUserInTeam={userTeam?.id === team.id}
                        isJoining={joiningTeamId === team.id}
                        disabled={!!userTeam || joiningTeamId !== null}
                        animationDelay={index * 100}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-dashed border-gray-300">
                    <div className="text-6xl mb-4 animate-bounce">🚀</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Be the First to Form a Team!
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      No teams yet for this event. Create one and others will join you based on skill compatibility.
                    </p>
                    {!userTeam && (
                      <button
                        onClick={() => setShowCreateTeam(true)}
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Team
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Message for non-interested users */}
            {!isInterested && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Mark Your Interest First
                </h3>
                <p className="text-gray-600">
                  To view and join teams, please mark your interest in this event above
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Event?</h3>
                <p className="text-gray-600 mb-1">
                  This action cannot be undone. The event will be permanently deleted.
                </p>
                <p className="text-sm text-red-600 font-semibold">
                  All teams and interest data will be lost.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteEvent}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Event'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interest Celebration */}
      <InterestCelebration
        show={showCelebration}
        interestCount={animatedCount || interestCount}
        onComplete={() => setShowCelebration(false)}
      />
    </div>
  );
}

export default EventDetail;
