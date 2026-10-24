import { create } from 'zustand';
import { User } from 'firebase/auth';

export type UserRole = 'admin' | 'instructor' | 'student';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isInstructor: boolean;
  role: UserRole;
  instructorMode: boolean; // toggle mode when user is an instructor
  loading: boolean;
  setUser: (user: User | null, isAdmin?: boolean, isInstructor?: boolean) => void;
  setInstructorMode: (mode: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  isInstructor: false,
  role: 'student',
  instructorMode: true,
  loading: true,
  setUser: (user, isAdmin = false, isInstructor = false) => {
    const role: UserRole = isAdmin ? 'admin' : isInstructor ? 'instructor' : 'student';
    set({
      user,
      isAdmin,
      isInstructor,
      role,
      instructorMode: isInstructor,
      loading: false,
    });
  },
  setInstructorMode: (mode: boolean) => set({ instructorMode: mode }),
  setLoading: (loading) => set({ loading }),
  logout: () =>
    set({
      user: null,
      isAdmin: false,
      isInstructor: false,
      role: 'student',
      instructorMode: false,
      loading: false,
    }),
}));
