import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../hooks/useAuth.js';

function OrganizerDashboard() {
    const navigate = useNavigate();

    // Defensive guard: prevent crash if useAuth is undefined
    const authHook = useAuth?.() || { user: null };
    const { user } = authHook;

    const [profile, setProfile] = useState(null);
    const [myEvents, setMyEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Form state - matches database schema exactly
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        college: '',
        category: 'Hackathon',
        deadline: '',
        required_skills: '',
        allowed_college: '', // Empty = public to all
        tags: '' // For UI only, not saved to DB
    });

    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchMyEvents();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            if (error) throw error;

            // If profile is null, treat user as student (do not crash)
            if (!data || data.role !== 'organizer') {
                navigate('/dashboard');
                return;
            }

            setProfile(data);
        } catch (err) {
            console.error('Error fetching profile:', err);
            // On error, treat as non-organizer (do not crash)
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyEvents = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('events')
                .select(`
          *,
          event_interest (count),
          teams (count)
        `)
                .eq('created_by', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Add interest and team counts to each event
            const eventsWithCounts = (data || []).map(event => ({
                ...event,
                interest_count: event.event_interest?.[0]?.count || 0,
                team_count: event.teams?.[0]?.count || 0
            }));

            setMyEvents(eventsWithCounts);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        setCreating(true);
        setError(null);

        try {
            // Parse skills and tags
            const skills = formData.required_skills
                .split(',')
                .map(s => s.trim())
                .filter(s => s);

            const tags = formData.tags
                .split(',')
                .map(t => t.trim())
                .filter(t => t);

            // Build payload matching exact schema
            const payload = {
                title: formData.title,
                description: formData.description,
                college: formData.college,
                category: formData.category,
                deadline: formData.deadline, // YYYY-MM-DD format
                required_skills: skills, // Array
                allowed_college: formData.allowed_college || null, // NULL = public
                allowed_years: [], // Empty array for now
                created_by: user.id,
                tags: tags.length > 0 ? tags : null // Array or NULL
            };

            const { data, error: createError } = await supabase
                .from('events')
                .insert(payload)
                .select()
                .single();

            if (createError) throw createError;

            // Show success message
            setSuccessMessage('Event created successfully! Redirecting...');

            // Redirect to event detail page
            setTimeout(() => {
                navigate(`/events/${data.id}`);
            }, 1500);
        } catch (err) {
            console.error('Error creating event:', err);
            setError(`Could not create event: ${err.message || 'Please try again.'}`);
            setTimeout(() => setError(null), 5000);
        } finally {
            setCreating(false);
        }
    };

    // Show loading state while checking profile
    if (!user || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block">
                        <svg className="animate-spin h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <p className="mt-4 text-slate-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    // If profile check failed or user is not organizer, component will redirect
    // This is a safety check - should not render if we get here
    if (!profile) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Demo Banner */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="text-sm font-semibold text-yellow-900">Demo Organizer Mode</p>
                            <p className="text-sm text-yellow-700">This is a demonstration of how organizers can create events. In production, organizer accounts would be verified.</p>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
                        <p className="text-gray-600 mt-1">Manage your events and track interest</p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Event
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-emerald-800">{successMessage}</p>
                    </div>
                )}

                {/* Create Event Form */}
                {showCreateForm && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Event</h2>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        placeholder="e.g., Tech Hackathon 2024"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">College *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.college}
                                        onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        placeholder="e.g., IIT Bombay"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    >
                                        <option value="Hackathon">Hackathon</option>
                                        <option value="Workshop">Workshop</option>
                                        <option value="Competition">Competition</option>
                                        <option value="Tech Talk">Tech Talk</option>
                                    </select>
                                </div>



                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Registration Deadline *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                </div>



                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Restrict to College (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.allowed_college}
                                        onChange={(e) => setFormData({ ...formData, allowed_college: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        placeholder="Leave empty for public event"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.allowed_college ? (
                                            <span className="text-yellow-600 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                                Only students from "{formData.allowed_college}" will see this event
                                            </span>
                                        ) : (
                                            <span className="text-green-600 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Public event - visible to all students
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="Describe your event..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Required Skills (comma-separated)</label>
                                <input
                                    type="text"
                                    value={formData.required_skills}
                                    onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="e.g., React, Python, Node.js"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="e.g., AI, Web Development, Open Source"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {creating ? 'Creating...' : 'Create Event'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    disabled={creating}
                                    className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* My Events */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">My Events</h2>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                </div>
                            ))}
                        </div>
                    ) : myEvents.length > 0 ? (
                        <div className="space-y-3">
                            {myEvents.map(event => (
                                <div
                                    key={event.id}
                                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{event.title}</h3>
                                            <p className="text-sm text-gray-600 mb-2">{event.college} • {event.category}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span>📅 Deadline: {event.deadline}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-semibold text-gray-500 mb-3">Live Engagement</p>
                                            <div className="flex gap-3">
                                                <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg">
                                                    <p className="text-2xl font-bold">{event.interest_count}</p>
                                                    <p className="text-xs">interested</p>
                                                </div>
                                                <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg">
                                                    <p className="text-2xl font-bold">{event.team_count}</p>
                                                    <p className="text-xs">teams</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Yet</h3>
                            <p className="text-gray-600 mb-6">Create your first event to get started</p>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Create Event
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default OrganizerDashboard;
