import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            await supabase.auth.signOut();

            // Clear all localStorage
            localStorage.removeItem('isFirstLogin');

            // Close mobile menu
            setMobileMenuOpen(false);

            // Redirect to landing page
            navigate('/');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setLoggingOut(false);
        }
    };

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/events', label: 'Events' },
        { path: '/profile', label: 'Profile' }
    ];

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <img
                            src="/logo.png"
                            alt="Anveshan Logo"
                            className="w-8 h-8 object-contain"
                        />
                        <h1 className="text-xl font-bold text-gray-900">
                            Anveshan
                        </h1>
                    </button>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navLinks.map(link => (
                            <button
                                key={link.path}
                                onClick={() => navigate(link.path)}
                                className={`text-sm font-medium transition-colors ${isActive(link.path)
                                        ? 'text-indigo-600'
                                        : 'text-gray-700 hover:text-indigo-600'
                                    }`}
                            >
                                {link.label}
                            </button>
                        ))}
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loggingOut ? 'Logging out...' : 'Logout'}
                        </button>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
                        <nav className="flex flex-col gap-3">
                            {navLinks.map(link => (
                                <button
                                    key={link.path}
                                    onClick={() => {
                                        navigate(link.path);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.path)
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {link.label}
                                </button>
                            ))}
                            <button
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className="text-left px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loggingOut ? 'Logging out...' : 'Logout'}
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Navbar;
