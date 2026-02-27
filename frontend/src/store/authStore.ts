import { create } from 'zustand';
import api from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

interface User {
    id: string;
    phone: string;
    name: string | null;
    profilePhoto: string | null;
    isVerified: boolean;
    role: string;
    defaultMode: 'receiver' | 'donor';
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    mode: 'receiver' | 'donor';
    setUser: (user: User | null) => void;
    setMode: (mode: 'receiver' | 'donor') => void;
    login: (accessToken: string, user: User) => void;
    logout: () => Promise<void>;
    fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    mode: 'receiver',

    setUser: (user) => set({ user, isAuthenticated: !!user }),

    setMode: (mode) => {
        set({ mode });
        if (typeof window !== 'undefined') {
            localStorage.setItem('sharecare_mode', mode);
        }
    },

    login: (accessToken, user) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            connectSocket(accessToken);
        }
        const savedMode = typeof window !== 'undefined'
            ? (localStorage.getItem('sharecare_mode') as 'receiver' | 'donor') || user.defaultMode
            : user.defaultMode;
        set({ user, isAuthenticated: true, isLoading: false, mode: savedMode });
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            // ignore
        }
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('sharecare_mode');
        }
        disconnectSocket();
        set({ user: null, isAuthenticated: false, isLoading: false, mode: 'receiver' });
    },

    fetchProfile: async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
            if (!token) {
                set({ isLoading: false });
                return;
            }
            const { data } = await api.get('/users/me');
            if (data.success) {
                connectSocket(token);
                const savedMode = typeof window !== 'undefined'
                    ? (localStorage.getItem('sharecare_mode') as 'receiver' | 'donor') || data.data.defaultMode
                    : data.data.defaultMode;
                set({ user: data.data, isAuthenticated: true, isLoading: false, mode: savedMode });
            } else {
                set({ isLoading: false });
            }
        } catch (err) {
            set({ isLoading: false });
        }
    },
}));
