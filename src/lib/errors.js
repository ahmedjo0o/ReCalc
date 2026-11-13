// The modular Firebase SDK (unlike the old compat SDK the legacy app used)
// appends " [<httpStatus>]" to callable-function error messages, e.g.
// "itemsMismatch [400]" instead of the bare "itemsMismatch" the server's
// HttpsError actually sent. Strip that suffix before matching error codes.
export function getServerErrorCode(err) {
  return ((err && err.message) || '').replace(/\s*\[\d+\]\s*$/, '');
}

// Maps a calculateBill HttpsError's message code (see recalc-backend/functions/index.js)
// to a translated, user-facing string. Ported from the legacy calculator.js.
export function mapServerErrorMessage(err, t) {
  switch (getServerErrorCode(err)) {
    case 'itemsMismatch':
      return t.mismatchError;
    case 'rateLimitExceeded':
      return t.rateLimitError || t.calculationFailedError;
    case 'totalOrderInvalid':
      return t.totalOrderError;
    case 'subTotalInvalid':
      return t.subTotalError;
    case 'discountInvalid':
      return t.discountError;
    case 'discountGreaterThanTotal':
      return t.discountGreaterError;
    case 'subTotalGreaterThanTotal':
      return t.subTotalGreaterError;
    case 'negativeError':
      return t.negativeError;
    default:
      return t.calculationFailedError || 'Something went wrong while calculating. Please try again.';
  }
}

// Maps a Firebase Auth error to a translated, user-facing string, so people
// never see raw text like "Firebase: Error (auth/invalid-credential).".
export function mapAuthErrorMessage(err, t) {
  switch (err && err.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return t.authInvalidCredentials;
    case 'auth/email-already-in-use':
      return t.authEmailInUse;
    case 'auth/weak-password':
      return t.authWeakPassword;
    case 'auth/invalid-email':
      return t.authInvalidEmail;
    case 'auth/too-many-requests':
      return t.authTooManyRequests;
    case 'auth/network-request-failed':
      return t.authNetworkError;
    default:
      return t.authGenericError;
  }
}
