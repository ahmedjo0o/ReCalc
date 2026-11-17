import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase.js';
import { ensureAppCheck } from './appCheck.js';

// Authoritatively recomputes every person's share server-side from raw items
// and (for signed-in callers) writes the Firestore history entry itself.
// payload: { totalOrder, subTotal, discount, totals:[{name, items:[{label,price}]}], localeLang, source }
export async function callCalculateBill(payload) {
  await ensureAppCheck();
  return httpsCallable(functions, 'calculateBill')(payload);
}

// Gemini-based receipt OCR. payload: { imageBase64, mimeType }
export async function callExtractReceipt(payload) {
  await ensureAppCheck();
  return httpsCallable(functions, 'extractReceipt', { timeout: 120000 })(payload);
}

// Permanently deletes the caller's account and all its data. The server
// requires { confirm: 'DELETE' } and a sign-in from the last few minutes.
export async function callDeleteAccount() {
  await ensureAppCheck();
  return httpsCallable(functions, 'deleteAccount', { timeout: 120000 })({ confirm: 'DELETE' });
}
