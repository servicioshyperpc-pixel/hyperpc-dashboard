import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  isBootstrapping: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  bootstrapAuth: () => Promise<void>;
}

const TOKEN_KEY = 'hyperpc_dashboard_token';
const USER_KEY = 'hyperpc_dashboard_user';

const persistSession = (token: string, user: User) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  isBootstrapping: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await axiosInstance.post('/auth/login', { email, password });
      persistSession(data.token, data.user);
      set({
        isAuthenticated: true,
        user: data.user,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      clearSession();
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: error.response?.data?.message || error.message || 'No se pudo iniciar sesión',
      });
    }
  },

  logout: () => {
    clearSession();
    set({
      isAuthenticated: false,
      user: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),

  bootstrapAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const cachedUser = localStorage.getItem(USER_KEY);

    if (!token) {
      set({ isBootstrapping: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      const { data } = await axiosInstance.get('/auth/me');
      const user = data.user as User;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({
        isAuthenticated: true,
        user,
        isBootstrapping: false,
        error: null,
      });
    } catch {
      clearSession();
      set({
        isAuthenticated: false,
        user: cachedUser ? JSON.parse(cachedUser) : null,
        isBootstrapping: false,
        error: null,
      });
      set({ user: null });
    }
  },
}));
