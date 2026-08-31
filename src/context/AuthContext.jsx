import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../lib/firebase.js';

const AuthContext = createContext(null);

// Error codes that mean "the popup flow itself didn't work" (blocked,
// closed before completing, superseded by another popup request) — as
// opposed to a real auth failure — worth falling back to a full-page
// redirect for, on any platform.
const POPUP_FALLBACK_CODES = ['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Picks up the result once the browser comes back from a signInWithRedirect
  // round-trip (onAuthStateChanged above will also fire once this resolves).
  // Resolves null on every ordinary page load that never involved a
  // redirect — that's expected, not logged as an error.
  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      console.error('Google redirect sign-in failed:', err.code, err.message);
    });
  }, []);

  async function signUp(email, password, displayName = '') {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    setUser({ ...cred.user });
    return cred.user;
  }

  async function signIn(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const cred = await signInWithPopup(auth, provider);
      return cred.user;
    } catch (err) {
      if (POPUP_FALLBACK_CODES.includes(err.code)) {
        // Full-page redirect instead — this navigates away, so there's no
        // user to return here; the caller's UI unmounts, and the signed-in
        // user shows up via onAuthStateChanged once the browser returns.
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw err;
    }
  }

  async function logout() {
    await firebaseSignOut(auth);
  }

  async function updateDisplayName(name) {
    if (!auth.currentUser) throw new Error('no user');
    await updateProfile(auth.currentUser, { displayName: name });
    setUser({ ...auth.currentUser });
  }

  // Mirrors the legacy manage.html branching: password-provider users
  // reauthenticate with their current password; Google-only users either
  // reauthenticate via popup to set one, or fall back to a reset email.
  async function changePassword(currentPassword, newPassword) {
    const u = auth.currentUser;
    if (!u) throw new Error('no user');

    const providers = (u.providerData || []).map((p) => p.providerId);
    const hasPasswordProvider = providers.includes('password');

    if (hasPasswordProvider) {
      if (!currentPassword) throw new Error('current password required');
      const cred = EmailAuthProvider.credential(u.email, currentPassword);
      await reauthenticateWithCredential(u, cred);
      await updatePassword(u, newPassword);
      return { mode: 'changed' };
    }

    if (providers.includes('google.com')) {
      try {
        await reauthenticateWithPopup(u, new GoogleAuthProvider());
        await updatePassword(u, newPassword);
        return { mode: 'set' };
      } catch (err) {
        await sendPasswordResetEmail(auth, u.email);
        return { mode: 'reset-email-sent', error: err };
      }
    }

    await sendPasswordResetEmail(auth, u.email);
    return { mode: 'reset-email-sent' };
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    updateDisplayName,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
