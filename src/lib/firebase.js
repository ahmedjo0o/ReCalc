import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Same project as ReCalc-frontend/firebase.js — this is a public client config,
// not a secret; access is enforced by firestore.rules and Cloud Function checks.
const firebaseConfig = {
  apiKey: 'AIzaSyAKbxlBH2LiHo8Nfv5806V0gYgfLdgkO1E',
  // Custom auth domain (same registrable domain as the app itself) instead
  // of the default recalc-app.firebaseapp.com — the whole Google sign-in
  // round-trip now stays same-site, which is what Safari's Intelligent
  // Tracking Prevention requires to let it persist auth state across the
  // redirect to Google and back (that's what silently broke sign-in on iOS
  // Safari: firebaseapp.com is a different site from re-calc.com).
  authDomain: 'auth.re-calc.com',
  projectId: 'recalc-app',
  storageBucket: 'recalc-app.firebasestorage.app',
  messagingSenderId: '1019107009825',
  appId: '1:1019107009825:web:758dcb79ec26aebc460a60',
  measurementId: 'G-Z8RYVFS1RR',
};

const APP_CHECK_SITE_KEY = '6Lc8wJktAAAAAL64DgF_eykDaMzWxbK9JsHwOZAo';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// See the matching comment in the legacy ReCalc-frontend/firebase.js: enforcement
// is currently OFF on the Cloud Functions side (enforceAppCheck: false), so this
// activation is inert until that's flipped on once App Check metrics look clean.
if (APP_CHECK_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(APP_CHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    console.warn('App Check activation failed:', err);
  }
}
