import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check active session on mount
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
                setIsAuthenticated(!!session?.user);
            } catch (error) {
                console.error('Error checking session:', error);
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);
                setUser(session?.user ?? null);
                setIsAuthenticated(!!session?.user);
                setLoading(false);
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
    };
}
