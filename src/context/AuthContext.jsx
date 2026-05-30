import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Guest User',
          email: firebaseUser.email || null,
          photoURL: firebaseUser.photoURL || null,
          isAnonymous: firebaseUser.isAnonymous,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      // Don't treat popup closed as an error
      if (err.code === 'auth/popup-closed-by-user') return null;
      if (err.code === 'auth/cancelled-popup-request') return null;

      let message = 'Something went wrong during sign in. Please try again.';
      if (err.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your connection and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please wait a moment and try again.';
      }
      setError(message);
      throw err;
    }
  }, []);

  const loginAsGuest = useCallback(async () => {
    setError(null);
    try {
      const result = await signInAnonymously(auth);
      return result.user;
    } catch (err) {
      let message = 'Could not create guest session. Please try again.';
      if (err.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your connection and try again.';
      }
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err) {
      setError('Could not sign out. Please try again.');
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    loading,
    error,
    loginWithGoogle,
    loginAsGuest,
    logout,
    clearError,
    isAuthenticated: !!user,
    isGuest: user?.isAnonymous || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
