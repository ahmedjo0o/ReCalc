// "Sign in with Google" using Google Identity Services, Google's current
// official button. Google signs the person in directly (in its own pop-up or
// a native browser prompt) and hands back an ID token, which is then passed
// to Firebase with signInWithCredential.
//
// Unlike Firebase's own signInWithPopup / signInWithRedirect, this doesn't go
// through the helper pages on recalc-app.firebaseapp.com. Those depend on
// sharing storage across sites, which Safari's tracking protection blocks or
// slows down; that is what made Google sign-in unreliable on iPhones.
//
// The Google script is loaded only when a sign-in box is opened.

// OAuth "Web client" of the recalc-app project. Public, not a secret. Its
// Authorized JavaScript origins must include every address the button is
// used on (https://re-calc.com, and http://localhost:5180 for testing).
const CLIENT_ID = '1019107009825-krdo0riujjj77lohtjuog8eag8cdbfqt.apps.googleusercontent.com';
const SCRIPT_URL = 'https://accounts.google.com/gsi/client';

let scriptPromise = null;

export function loadGoogleIdentity(timeoutMs = 8000) {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      const timer = setTimeout(() => reject(new Error('Google sign-in took too long to load')), timeoutMs);
      script.onload = () => {
        clearTimeout(timer);
        if (window.google?.accounts?.id) resolve(window.google);
        else reject(new Error('Google sign-in is unavailable'));
      };
      script.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Google sign-in was blocked'));
      };
      document.head.appendChild(script);
    }).catch((err) => {
      scriptPromise = null; // allow a retry next time the box opens
      throw err;
    });
  }
  return scriptPromise;
}

// Google allows initialize() once per page; the button that is currently on
// screen decides what happens with the result.
let initialized = false;
let currentHandler = null;

// Draws Google's button inside `container`. onCredential(idToken) is called
// after the person picks their Google account.
export async function renderGoogleButton(container, { onCredential, locale = 'en', text = 'signin_with' }) {
  const google = await loadGoogleIdentity();
  currentHandler = onCredential;
  if (!initialized) {
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response) => {
        if (currentHandler && response && response.credential) currentHandler(response.credential);
      },
      ux_mode: 'popup',
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    initialized = true;
  }
  if (!container || !container.isConnected) return;
  container.innerHTML = '';
  const width = Math.min(400, Math.max(200, Math.floor(container.clientWidth || 300)));
  google.accounts.id.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    text,
    logo_alignment: 'left',
    locale,
    width,
  });
}
