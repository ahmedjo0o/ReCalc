import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Same project as ReCalc-frontend/firebase.js — this is a public client config,
// not a secret; access is enforced by firestore.rules and Cloud Function checks.
const firebaseConfig = {
  apiKey: 'AIzaSyAKbxlBH2LiHo8Nfv5806V0gYgfLdgkO1E',
  // Back to Firebase's own managed auth domain. A custom auth.re-calc.com
  // domain was tried to work around a Google sign-in issue on iOS Safari,
  // but the round-trip through it still failed after OAuth client + DNS
  // were fixed — not worth chasing further; this domain is guaranteed to
  // work since Firebase manages it end-to-end.
  authDomain: 'recalc-app.firebaseapp.com',
  projectId: 'recalc-app',
  storageBucket: 'recalc-app.firebasestorage.app',
  messagingSenderId: '1019107009825',
  appId: '1:1019107009825:web:758dcb79ec26aebc460a60',
  measurementId: 'G-Z8RYVFS1RR',
};

// Kept for reference in case App Check enforcement is ever turned on
// server-side (see enforceAppCheck in recalc-backend/functions/index.js —
// currently false on both functions, so App Check provides zero benefit
// right now). Deliberately NOT activated: its reCAPTCHA v3 script is a
// real cross-origin, iframe-based verification system, and it's the prime
// suspect for a ~30s page-load hang reported on Safari — likely Safari's
// tracking prevention making its verification slow/retry-prone. Not worth
// that cost for a check that isn't even being enforced.
// const APP_CHECK_SITE_KEY = '6Lc8wJktAAAAAL64DgF_eykDaMzWxbK9JsHwOZAo';

export const app = initializeApp(firebaseConfig);

// Confirmed via on-device timing (see AuthContext.jsx's ?debug=1 overlay):
// on iOS Safari specifically — never Chrome-iOS, which runs the *same*
// WebKit engine but without Safari's own Intelligent Tracking Prevention —
// a fresh app launch's auth check took 9.5–14.4s, vs 100–300ms on a plain
// refresh. Since Safari's own app is the one enforcing ITP (Chrome-iOS,
// running as its own sandboxed app, doesn't inherit it), and ITP's extra
// verification work is known to weigh on IndexedDB specifically, this
// explicitly restricts persistence to localStorage/sessionStorage/memory —
// skipping Firebase's default preference for IndexedDB entirely — using
// initializeAuth (sets it up this way from the start) rather than getAuth +
// setPersistence (which would instead *migrate* an existing session
// between backends, itself a real async storage operation).
export const auth = initializeAuth(app, {
  persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence],
  // initializeAuth (unlike getAuth) doesn't include this by default — without
  // it, signInWithPopup/signInWithRedirect/getRedirectResult all throw
  // auth/argument-error.
  popupRedirectResolver: browserPopupRedirectResolver,
});

export const db = getFirestore(app);
export const functions = getFunctions(app);
