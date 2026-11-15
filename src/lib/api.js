import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase.js';

// Authoritatively recomputes every person's share server-side from raw items
// and (for signed-in callers) writes the Firestore history entry itself.
// payload: { totalOrder, subTotal, discount, totals:[{name, items:[{label,price}]}], localeLang, source }
export function callCalculateBill(payload) {
  return httpsCallable(functions, 'calculateBill')(payload);
}

// Gemini-based receipt OCR. payload: { imageBase64, mimeType }
export function callExtractReceipt(payload) {
  return httpsCallable(functions, 'extractReceipt', { timeout: 120000 })(payload);
}

// Permanently deletes the caller's account and all its data. The server
// requires { confirm: 'DELETE' } and a sign-in from the last few minutes.
export function callDeleteAccount() {
  return httpsCallable(functions, 'deleteAccount', { timeout: 120000 })({ confirm: 'DELETE' });
}
