import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    // Keep role/profile for backward compatibility but don't fetch them here
    // Components can fetch separately if needed
    const [role, setRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(false);
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        // Fetch role/profile asynchronously (non-blocking)
        const fetchRoleProfile = async (userId) => {
            if (!userId || !mounted) return;

            try {
                setRoleLoading(true);
                setProfileLoading(true);

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                if (mounted) {
                    if (error) {
                        setRole(null);
                        setProfile(null);
                    } else {
                        setRole(data?.role || null);
                        setProfile(data || null);
                    }
                    setRoleLoading(false);
                    setProfileLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setRole(null);
                    setProfile(null);
                    setRoleLoading(false);
                    setProfileLoading(false);
                }
            }
        };

        // Check active session on mount
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const currentUser = session?.user ?? null;

                if (mounted) {
                    setUser(currentUser);
                    setIsAuthenticated(!!currentUser);
                }

                // Resolve loading FIRST (non-blocking)
                if (mounted) {
                    setLoading(false);
                }

                // THEN fetch role/profile asynchronously (doesn't block auth)
                if (currentUser) {
                    fetchRoleProfile(currentUser.id);
                } else if (mounted) {
                    setRole(null);
                    setProfile(null);
                    setRoleLoading(false);
                    setProfileLoading(false);
                }
            } catch (error) {
                if (mounted) {
                    setUser(null);
                    setIsAuthenticated(false);
                    setRole(null);
                    setProfile(null);
                    setLoading(false);
                    setRoleLoading(false);
                    setProfileLoading(false);
                }
            }
        };

        checkSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (!mounted) return;
                
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                setIsAuthenticated(!!currentUser);

                // Fetch role/profile asynchronously when auth changes
                if (currentUser) {
                    fetchRoleProfile(currentUser.id);
                } else {
                    setRole(null);
                    setProfile(null);
                    setRoleLoading(false);
                    setProfileLoading(false);
                }
            }
        );

        // Cleanup subscription on unmount
        return () => {
            mounted = false;
            subscription?.unsubscribe();
        };
    }, []);

    return {
        user,
        loading,
        isAuthenticated,
        role,
        roleLoading,
        profile,
        profileLoading,
    };
}
