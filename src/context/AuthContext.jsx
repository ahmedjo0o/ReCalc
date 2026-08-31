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

// signInWithPopup is unreliable on Safari (ITP blocks the third-party storage
// access the popup handshake needs, and mobile Safari often blocks the popup
// outright) and can misfire on desktop too when third-party cookies are
// restricted. These are the error codes that mean "the popup flow itself
// didn't work", as opposed to the user deliberately cancelling — worth
// falling back to a full-page redirect for.
const POPUP_FALLBACK_CODES = ['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

// On mobile, signInWithPopup frequently doesn't fail fast — the browser
// tries to open something popup-like, the handshake can't complete, and
// Firebase only gives up after its own ~minute-long internal timeout before
// the catch block below falls back to redirect. That's the "button spins
// for a minute" symptom. Skip the doomed popup attempt on mobile entirely
// and go straight to the redirect, which works reliably everywhere.
function isMobileBrowser() {
  return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

// Marks "we just sent the browser off to Google and are expecting it back"
// so the redirect-result effect below can tell a genuine failure (we were
// expecting a result and didn't get one) apart from the *normal* case of
// getRedirectResult() resolving null on every ordinary page load that never
// involved a redirect at all.
const REDIRECT_PENDING_KEY = 'recalc_google_redirect_pending';

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
  // getRedirectResult() resolves null on *every* ordinary page load that
  // never involved a redirect — that's expected, not an error — so this
  // only reports something when REDIRECT_PENDING_KEY says we were actually
  // expecting a result back.
  useEffect(() => {
    const wasExpectingRedirect = sessionStorage.getItem(REDIRECT_PENDING_KEY) === '1';

    getRedirectResult(auth)
      .then((result) => {
        if (!wasExpectingRedirect) return;
        sessionStorage.removeItem(REDIRECT_PENDING_KEY);
        if (!result) {
          console.error(
            'Google redirect sign-in: expected a result but got none. The browser likely could not ' +
              'persist auth state across the redirect to Google and back — common in Private/Incognito ' +
              'mode, or when the page was opened inside an in-app browser (Instagram/Facebook/TikTok/' +
              'WhatsApp link preview) rather than Safari/Chrome directly.',
          );
          alert(
            "Sign-in didn't complete. If you opened this page from a link inside another app " +
              '(Instagram, Facebook, TikTok, WhatsApp, etc.), try opening it in Safari or Chrome directly ' +
              'instead — in-app browsers often block the sign-in redirect.',
          );
        }
      })
      .catch((err) => {
        if (!wasExpectingRedirect) {
          console.error('Google redirect sign-in failed:', err);
          return;
        }
        sessionStorage.removeItem(REDIRECT_PENDING_KEY);
        console.error('Google redirect sign-in failed:', err.code, err.message);
        alert('Google sign-in failed: ' + (err.code || err.message || err));
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

    if (isMobileBrowser()) {
      sessionStorage.setItem(REDIRECT_PENDING_KEY, '1');
      await signInWithRedirect(auth, provider);
      return null;
    }

    try {
      const cred = await signInWithPopup(auth, provider);
      return cred.user;
    } catch (err) {
      if (POPUP_FALLBACK_CODES.includes(err.code)) {
        // Full-page redirect instead — this navigates away, so there's no
        // user to return here; the caller's UI unmounts, and the signed-in
        // user shows up via onAuthStateChanged once the browser returns.
        sessionStorage.setItem(REDIRECT_PENDING_KEY, '1');
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
