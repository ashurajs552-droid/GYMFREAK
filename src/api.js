import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use(async (config) => {
    // Check for admin bypass session first
    const adminSession = localStorage.getItem('gym-freak-admin-session');
    if (adminSession) {
        config.headers.Authorization = 'Bearer admin-bypass-token-789';
        return config;
    }

    // Regular Supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

export default api;
