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
