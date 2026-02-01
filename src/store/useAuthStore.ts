import { create } from 'zustand';

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
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Mock users para demo
const MOCK_USERS = [
  { id: '1', email: 'admin@hyperpc.cl', password: 'admin123', name: 'Administrador', role: 'admin' as const },
  { id: '2', email: 'user@hyperpc.cl', password: 'user123', name: 'Usuario', role: 'user' as const }
];

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      set({ 
        isAuthenticated: true, 
        user: userWithoutPassword,
        isLoading: false,
        error: null 
      });
    } else {
      set({ 
        isAuthenticated: false, 
        user: null,
        isLoading: false,
        error: 'Credenciales incorrectas' 
      });
    }
  },

  logout: () => {
    set({ 
      isAuthenticated: false, 
      user: null, 
      error: null 
    });
  },

  clearError: () => {
    set({ error: null });
  }
}));
