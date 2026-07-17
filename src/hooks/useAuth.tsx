'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { isFirebaseAvailable, auth } from '../lib/firebase';
import { useHabitStore } from '../store/useHabitStore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setUserId = useHabitStore((state) => state.setUserId);

  useEffect(() => {
    if (!isFirebaseAvailable) {
      // Offline / Local-Only Mode authentication mock
      const localUserStr = localStorage.getItem('momentum_local_user');
      if (localUserStr) {
        const u = JSON.parse(localUserStr) as UserProfile;
        setUser(u);
        setUserId(u.uid);
      } else {
        // Set up a default guest account automatically so they don't even have to log in in local mode!
        const guestUser: UserProfile = {
          uid: 'guest_user',
          email: 'guest@momentum.app',
          displayName: 'Guest Achiever',
          photoURL: null,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('momentum_local_user', JSON.stringify(guestUser));
        setUser(guestUser);
        setUserId(guestUser.uid);
      }
      setIsLoading(false);
      return;
    }

    // Firebase state listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const u: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          createdAt: fbUser.metadata.creationTime || new Date().toISOString()
        };
        setUser(u);
        await setUserId(fbUser.uid);
      } else {
        setUser(null);
        await setUserId(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setUserId]);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    if (!isFirebaseAvailable) {
      // Local Auth Mock
      const u: UserProfile = {
        uid: 'guest_user',
        email: email,
        displayName: email.split('@')[0],
        photoURL: null,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('momentum_local_user', JSON.stringify(u));
      setUser(u);
      await setUserId(u.uid);
      setIsLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoading(false);
      throw err;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setError(null);
    setIsLoading(true);
    if (!isFirebaseAvailable) {
      // Local Auth Mock
      const u: UserProfile = {
        uid: 'guest_user',
        email: email,
        displayName: name,
        photoURL: null,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('momentum_local_user', JSON.stringify(u));
      setUser(u);
      await setUserId(u.uid);
      setIsLoading(false);
      return;
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (res.user) {
        await updateProfile(res.user, { displayName: name });
        // Trigger profile reload
        const u: UserProfile = {
          uid: res.user.uid,
          email: res.user.email,
          displayName: name,
          photoURL: null,
          createdAt: new Date().toISOString()
        };
        setUser(u);
        await setUserId(res.user.uid);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setIsLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    setIsLoading(true);
    if (!isFirebaseAvailable) {
      localStorage.removeItem('momentum_local_user');
      setUser(null);
      await setUserId(null);
      setIsLoading(false);
      return;
    }

    try {
      await signOut(auth);
      setUser(null);
      await setUserId(null);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      setIsLoading(false);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    if (!isFirebaseAvailable) {
      alert("Password reset is disabled in local offline-first mode.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        error,
        login,
        signup,
        logout,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
