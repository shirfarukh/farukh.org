import { create } from 'zustand';
import { User } from 'firebase/auth';

export type UserRole = 'admin' | 'instructor' | 'student';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isInstructor: boolean;
  isSchoolTeacher: boolean;
  schoolTeacherApprovedGrades: number[];
  role: UserRole;
  instructorMode: boolean; // toggle mode when user is an instructor
  loading: boolean;
  setUser: (
    user: User | null,
    isAdmin?: boolean,
    isInstructor?: boolean,
    isSchoolTeacher?: boolean,
    schoolTeacherApprovedGrades?: number[]
  ) => void;
  setSchoolTeacherInfo: (isSchoolTeacher: boolean, approvedGrades: number[]) => void;
  setInstructorMode: (mode: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  isInstructor: false,
  isSchoolTeacher: false,
  schoolTeacherApprovedGrades: [],
  role: 'student',
  instructorMode: true,
  loading: true,
  setUser: (
    user,
    isAdmin = false,
    isInstructor = false,
    isSchoolTeacher = false,
    schoolTeacherApprovedGrades = []
  ) => {
    const role: UserRole = isAdmin ? 'admin' : isInstructor ? 'instructor' : 'student';
    set({
      user,
      isAdmin,
      isInstructor,
      isSchoolTeacher: isSchoolTeacher || isAdmin,
      schoolTeacherApprovedGrades: isAdmin && schoolTeacherApprovedGrades.length === 0
        ? [7, 8, 9, 10, 11, 12]
        : schoolTeacherApprovedGrades,
      role,
      instructorMode: isInstructor,
      loading: false,
    });
  },
  setSchoolTeacherInfo: (isSchoolTeacher: boolean, approvedGrades: number[]) =>
    set({ isSchoolTeacher, schoolTeacherApprovedGrades: approvedGrades }),
  setInstructorMode: (mode: boolean) => set({ instructorMode: mode }),
  setLoading: (loading) => set({ loading }),
  logout: () =>
    set({
      user: null,
      isAdmin: false,
      isInstructor: false,
      isSchoolTeacher: false,
      schoolTeacherApprovedGrades: [],
      role: 'student',
      instructorMode: false,
      loading: false,
    }),
}));
