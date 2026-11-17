import { app } from './firebase.js';

// Firebase App Check: proves to our Cloud Functions that a request comes from
// this website and not from a script calling them directly (which could use
// up the free daily receipt-scanning allowance for everyone).
//
// Loaded lazily, the first time the app is about to call the server, instead
// of at page load. App Check's reCAPTCHA script was once suspected of a ~30s
// page-load hang on Safari; this way the page itself never waits for it.
//
// It never blocks a request: if reCAPTCHA is slow or fails, the call goes
// ahead without a token. That is fine while the functions don't enforce App
// Check (enforceAppCheck: false in recalc-backend/functions/index.js); the
// Cloud Functions logs show each call as app VALID / MISSING / INVALID, which
// is how to confirm it works before turning enforcement on.

// reCAPTCHA v3 site key registered for re-calc.com in Firebase App Check.
// This is a public key, not a secret.
const RECAPTCHA_SITE_KEY = '6Lc8wJktAAAAAL64DgF_eykDaMzWxbK9JsHwOZAo';
const TOKEN_WAIT_MS = 8000;

function enabled() {
  if (!import.meta.env.PROD) return false; // dev server and local emulators
  if (import.meta.env.VITE_APPCHECK_FORCE === '1') return true; // local testing of a production build
  return typeof location !== 'undefined' && /(^|\.)re-calc\.com$/.test(location.hostname);
}

let ready = null;

export function ensureAppCheck() {
  if (!enabled()) return Promise.resolve();
  if (!ready) {
    ready = (async () => {
      const { initializeAppCheck, ReCaptchaV3Provider, getToken } = await import('firebase/app-check');
      const appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
      // Waiting for the first token also lets the Functions SDK attach it to
      // the call that is about to be made.
      let timer;
      await Promise.race([
        getToken(appCheck),
        new Promise((resolve) => {
          timer = setTimeout(resolve, TOKEN_WAIT_MS);
        }),
      ]).finally(() => clearTimeout(timer));
    })().catch((err) => {
      console.warn('App Check unavailable, continuing without it:', err && err.message);
    });
  }
  return ready;
}
