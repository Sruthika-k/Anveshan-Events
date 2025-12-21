import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

function Navbar() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-sm">A</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">
                            Anveshan
                        </h1>
                    </button>

                    {/* Navigation */}
                    <nav className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/events')}
                            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            Events
                        </button>
                        <button
                            onClick={() => navigate('/profile')}
                            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            Profile
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
                        >
                            Logout
                        </button>
                    </nav>
                </div>
            </div>
        </header>
    );
}

export default Navbar;
