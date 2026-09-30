import { useEffect } from 'react';
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAuthStore } from './authStore';

export function useAuth() {
  const { user, isAdmin, loading, setUser, setLoading, logout: resetStore } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const idTokenResult = await currentUser.getIdTokenResult(true);
          const hasAdminClaim = !!idTokenResult.claims.admin;
          setUser(currentUser, hasAdminClaim);
        } catch {
          setUser(currentUser, false);
        }
      } else {
        resetStore();
      }
    });

    return () => unsubscribe();
  }, [setUser, resetStore]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });

      // Create user doc
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email,
        displayName: name,
        createdAt: serverTimestamp(),
        disabled: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    resetStore();
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return {
    user,
    isAdmin,
    loading,
    login,
    register,
    logout,
    resetPassword,
  };
}
