import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  browserPopupRedirectResolver,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, app } from '../lib/firebase.js';
import { callDeleteAccount } from '../lib/api.js';

const AuthContext = createContext(null);

// The signed-in user Firebase saved on this device last time (name and email
// only), read straight from storage without any network request. Firebase
// confirms the session online before it reports a user, which can take
// seconds on a cold iPhone Safari launch; this lets the header greet the
// person immediately instead of showing a spinner. It is only used for
// display: anything that reads or writes data still waits for the real user.
function readSavedUser() {
  try {
    const raw = localStorage.getItem(`firebase:authUser:${app.options.apiKey}:[DEFAULT]`);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || !saved.uid) return null;
    return { uid: saved.uid, displayName: saved.displayName || '', email: saved.email || '' };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedUser] = useState(readSavedUser);
  const [authTiming, setAuthTiming] = useState(null);

  useEffect(() => {
    let mounted = true;
    // See index.html — how long the browser took to get our JS running at
    // all, vs how long Firebase itself then took to confirm the session.
    // Temporary diagnostic, surfaced only via ?debug=1 in Header.jsx.
    const effectStart = performance.now();
    const navStart = window.__RECALC_NAV_START__ ?? effectStart;

    // onAuthStateChanged's *first* callback isn't reliably the final word on
    // a slow/cold-start restore (e.g. iOS Safari after a full Safari
    // relaunch) — Firebase can call it once early (with no user yet, while
    // it's still checking persisted storage) and again later once the real
    // session is restored. Treating that first call as authoritative was
    // exactly why the header used to flash "Sign in" for several seconds
    // before correcting itself, looking like a real logout when it wasn't
    // one. authStateReady() is the SDK's actual "the initial check is done"
    // signal — wait for that before turning the spinner off.
    auth.authStateReady().then(() => {
      if (mounted) {
        const readyAt = performance.now();
        const timing = {
          bundleMs: Math.round(effectStart - navStart),
          authMs: Math.round(readyAt - effectStart),
        };
        setAuthTiming(timing);
        console.log('[reCalc timing] bundle/parse:', timing.bundleMs, 'ms — firebase auth check:', timing.authMs, 'ms');
        setUser(auth.currentUser);
        setLoading(false);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (mounted) setUser(u);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
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

  // Main Google sign-in: the ID token comes from Google's own button
  // (lib/googleSignIn.js) and is exchanged for a Firebase session here.
  async function signInWithGoogleCredential(idToken) {
    const cred = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    return cred.user;
  }

  // Fallback only, for when Google's button can't load (blocked script):
  // Firebase's own pop-up.
  async function signInWithGoogle() {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider(), browserPopupRedirectResolver);
    return cred.user;
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
        await reauthenticateWithPopup(u, new GoogleAuthProvider(), browserPopupRedirectResolver);
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

  // Proves it is really the account owner (password, or Google sign-in
  // again), then asks the server to delete everything. The fresh token is
  // what lets the server see that the sign-in just happened.
  async function deleteAccount(password) {
    const u = auth.currentUser;
    if (!u) throw new Error('no user');
    const hasPassword = (u.providerData || []).some((p) => p.providerId === 'password');
    if (hasPassword) {
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, password));
    } else {
      await reauthenticateWithPopup(u, new GoogleAuthProvider(), browserPopupRedirectResolver);
    }
    await u.getIdToken(true);
    await callDeleteAccount();
    await firebaseSignOut(auth);
  }

  const value = {
    user,
    loading,
    // While loading: who was signed in on this device last time (display only).
    savedUser: loading ? savedUser : null,
    authTiming,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithGoogleCredential,
    logout,
    updateDisplayName,
    changePassword,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
