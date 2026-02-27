import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for hardcoded admin session first
        const adminSession = localStorage.getItem('gym-freak-admin-session');
        if (adminSession) {
            const sessionData = JSON.parse(adminSession);
            setSession(sessionData);
            setUser(sessionData.user);
            setLoading(false);
            return;
        }

        // Check active sessions
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // Only update if we are not in a bypass session
            if (!localStorage.getItem('gym-freak-admin-session')) {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password) => {
        // Hardcoded admin bypass
        if (email === 'ashu@gmail.com' && password === '123456') {
            const fakeSession = {
                access_token: 'admin-bypass-token-789',
                user: { id: 'admin-bypass-uuid', email: 'ashu@gmail.com', user_metadata: { name: 'Admin' } }
            };
            localStorage.setItem('gym-freak-admin-session', JSON.stringify(fakeSession));
            setSession(fakeSession);
            setUser(fakeSession.user);
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const register = async (email, password, metaData) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: metaData }
        });
        if (error) throw error;
    };

    const logout = async () => {
        localStorage.removeItem('gym-freak-admin-session');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
    };

    const isAdmin = user?.email === 'ashu@gmail.com';

    return (
        <AuthContext.Provider value={{ user, session, login, register, logout, loading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};
