import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../hooks/useAuth.js';

function Events() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCollege, setUserCollege] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      fetchEvents(null);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('college')
        .eq('user_id', user.id)
        .maybeSingle();

      const college = data?.college || null;
      setUserCollege(college);
      fetchEvents(college);
    } catch (err) {
      console.error('Error fetching profile:', err);
      fetchEvents(null);
    }
  };

  const fetchEvents = async (college) => {
    try {
      setLoading(true);
      setError(null);

      // Build query with visibility filter
      let query = supabase
        .from('events')
        .select('*');

      // Apply visibility filter
      if (college) {
        // Show: public events OR events for user's college
        query = query.or(`allowed_college.is.null,allowed_college.eq.${college}`);
      } else {
        // No college = only public events
        query = query.is('allowed_college', null);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Hackathon': 'bg-blue-500 text-white',
      'Workshop': 'bg-green-500 text-white',
      'Competition': 'bg-purple-500 text-white',
      'Tech Talk': 'bg-orange-500 text-white'
    };
    return colors[category] || 'bg-gray-500 text-white';
  };

  const getUrgencyBadge = (deadline) => {
    // Simple urgency logic based on deadline text
    if (deadline.includes('22') || deadline.includes('23') || deadline.includes('24')) {
      return { text: '2-3 days left', color: 'bg-red-100 text-red-700 border-red-300' };
    }
    return { text: 'Closing soon', color: 'bg-orange-100 text-orange-700 border-orange-300' };
  };

  const handleEventClick = (id) => {
    navigate(`/events/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Discover Events
          </h1>
          <p className="text-lg text-gray-600">
            {loading ? 'Loading events...' : `${events.length} live events • Updated daily from top colleges across India`}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-red-900 font-semibold mb-1">Error Loading Events</h3>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={fetchEvents}
                  className="mt-3 text-sm font-semibold text-red-600 hover:text-red-700 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <EventSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Event Cards Grid */}
        {!loading && !error && events.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const urgency = getUrgencyBadge(event.deadline);

              return (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event.id)}
                  className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1"
                >
                  {/* Category Header */}
                  <div className={`${getCategoryColor(event.category)} px-6 py-3 flex items-center justify-between`}>
                    <span className="text-sm font-bold uppercase tracking-wide">
                      {event.category}
                    </span>
                    <svg
                      className="w-5 h-5 opacity-80"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {event.title}
                    </h3>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    {/* College */}
                    <div className="flex items-center gap-2 mb-3 text-gray-700">
                      <svg
                        className="w-4 h-4 text-gray-400 flex-shrink-0"
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
                      <span className="text-sm font-medium truncate">
                        {event.college}
                      </span>
                    </div>


                    {/* Deadline */}
                    <div className="flex items-center gap-2 mb-4 text-gray-700">
                      <svg
                        className="w-4 h-4 text-gray-400 flex-shrink-0"
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
                      <span className="text-sm font-medium">
                        Deadline: {event.deadline}
                      </span>
                    </div>

                    {/* Urgency Badge */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${urgency.color}`}>
                          ⏰ {urgency.text}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {event.deadline}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hover Arrow */}
                  <div className="px-6 pb-5">
                    <div className="flex items-center text-blue-600 text-sm font-semibold group-hover:translate-x-2 transition-transform">
                      View Details
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && events.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Events Available
            </h3>
            <p className="text-gray-500 mb-6">
              {userCollege
                ? `No events available for ${userCollege} right now. Check back soon for new opportunities!`
                : 'No public events available right now. Add your college to your profile to see college-specific events.'}
            </p>
            <button
              onClick={() => fetchEvents(userCollege)}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// Skeleton Loader Component
function EventSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
      {/* Category Header Skeleton */}
      <div className="bg-gray-200 h-12"></div>

      {/* Content Skeleton */}
      <div className="p-6">
        <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-5">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );
}

export default Events;
