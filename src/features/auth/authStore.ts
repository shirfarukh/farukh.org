import { create } from 'zustand';
import { User } from '@firebase/auth';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  setUser: (user: User | null, isAdmin?: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: true,
  setUser: (user, isAdmin = false) => set({ user, isAdmin, loading: false }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null, isAdmin: false, loading: false }),
}));
