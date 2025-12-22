import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [role, setRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);

    // Fetch user role from profiles table
    const fetchUserRole = async (userId) => {
        if (!userId) {
            setRole(null);
            setRoleLoading(false);
            return;
        }

        try {
            setRoleLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                console.error('Error fetching user role:', error);
                setRole(null);
            } else {
                setRole(data?.role || null);
            }
        } catch (err) {
            console.error('Error in fetchUserRole:', err);
            setRole(null);
        } finally {
            setRoleLoading(false);
        }
    };

    useEffect(() => {
        // Check active session on mount
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                setIsAuthenticated(!!currentUser);

                // Fetch role if user exists
                if (currentUser) {
                    await fetchUserRole(currentUser.id);
                } else {
                    setRole(null);
                    setRoleLoading(false);
                }
            } catch (error) {
                console.error('Error checking session:', error);
                setUser(null);
                setIsAuthenticated(false);
                setRole(null);
                setRoleLoading(false);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                setIsAuthenticated(!!currentUser);
                setLoading(false);

                // Fetch role on auth state change
                if (currentUser) {
                    await fetchUserRole(currentUser.id);
                } else {
                    setRole(null);
                    setRoleLoading(false);
                }
            }
        );

        // Cleanup subscription on unmount
        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    return {
        user,
        loading,
        isAuthenticated,
        role,
        roleLoading,
    };
}
