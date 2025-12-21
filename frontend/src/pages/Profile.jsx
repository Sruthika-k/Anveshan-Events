import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import { supabase } from '../lib/supabase.js';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error('Failed to load user:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Static profile data for demo
  const profileData = {
    name: "Rahul Sharma",
    bio: "Computer Science student passionate about hackathons, web development, and open source. Always looking for opportunities to learn and collaborate on innovative projects.",
    skills: ["React", "Python", "Machine Learning", "UI/UX Design", "Node.js", "Git"],
    interests: ["Hackathons", "Web Development", "AI/ML", "Open Source"],
    college: "Indian Institute of Technology, Bombay",
    year: "3rd Year"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-600">Loading profile...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Profile
          </h1>
          <p className="text-gray-600">
            Manage your profile information and preferences
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header Section with Avatar */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-12">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold shadow-lg">
                {profileData.name.charAt(0)}
              </div>

              {/* Name & Email */}
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-1">
                  {profileData.name}
                </h2>
                <p className="text-blue-100">
                  {user?.email || 'user@college.edu'}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8 space-y-6">
            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">About</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Coming Soon
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {profileData.bio}
              </p>
            </div>

            {/* College & Year */}
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">College</p>
                <p className="text-gray-900 font-medium">{profileData.college}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Year</p>
                <p className="text-gray-900 font-medium">{profileData.year}</p>
              </div>
            </div>

            {/* Skills */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Coming Soon
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Interests</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Coming Soon
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileData.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* Account Info */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email Address</p>
                    <p className="text-sm text-gray-600">{user?.email || 'Not available'}</p>
                  </div>
                  <svg
                    className="w-5 h-5 text-green-500"
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
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Account Status</p>
                    <p className="text-sm text-gray-600">Active</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Profile editing and customization features coming soon
              </p>
              <button
                disabled
                className="bg-gray-300 text-gray-500 py-2 px-6 rounded-md font-medium cursor-not-allowed flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;
