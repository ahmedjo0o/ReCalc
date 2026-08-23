// functions/index.js
// Cloud Function backing reCalc's bill-splitting logic.
//
// Why this exists: previously the split math (VAT share, discount share,
// total-to-pay per person) ran entirely in the browser, and the client also
// wrote its own calculation straight into Firestore. That meant a tampered
// client could write fake history, or fake results. This function moves the
// authoritative computation — and the only allowed history write — to the
// server, using the caller's verified Firebase Auth identity (context.auth),
// never a client-supplied user id.

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const MAX_PEOPLE = 60;
const MAX_ITEMS_PER_PERSON = 100;
const MISMATCH_TOLERANCE = 2; // same tolerance the app has always used

function toSafeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

exports.calculateBill = functions.https.onCall(async (data, context) => {
  const totalOrder = toSafeNumber(data && data.totalOrder);
  const subTotal = toSafeNumber(data && data.subTotal);
  const discount = data && data.discount !== undefined ? toSafeNumber(data.discount) : 0;
  const totalsInput = Array.isArray(data && data.totals) ? data.totals : null;
  const localeLang = (data && data.localeLang === 'ar') ? 'ar' : 'en';
  const source = (data && data.source === 'scan') ? 'scan' : 'manual';

  // --- Validate the same rules the client already enforces for good UX,
  // --- but authoritatively, since the client's checks can be bypassed. ---
  if (!Number.isFinite(totalOrder) || totalOrder < 0) {
    throw new functions.https.HttpsError('invalid-argument', 'totalOrderInvalid');
  }
  if (!Number.isFinite(subTotal) || subTotal < 0) {
    throw new functions.https.HttpsError('invalid-argument', 'subTotalInvalid');
  }
  if (!Number.isFinite(discount) || discount < 0) {
    throw new functions.https.HttpsError('invalid-argument', 'discountInvalid');
  }
  if (discount > totalOrder) {
    throw new functions.https.HttpsError('invalid-argument', 'discountGreaterThanTotal');
  }
  if (subTotal > totalOrder) {
    throw new functions.https.HttpsError('invalid-argument', 'subTotalGreaterThanTotal');
  }
  if (!totalsInput || totalsInput.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'totalsRequired');
  }
  if (totalsInput.length > MAX_PEOPLE) {
    throw new functions.https.HttpsError('invalid-argument', 'tooManyPeople');
  }

  // --- Recompute every person's sum from their raw items server-side. ---
  // --- A client-supplied "sum" is never trusted, since that is exactly ---
  // --- what a tampered client could fake to shift cost onto someone else. ---
  const recomputed = totalsInput.map((p) => {
    const name = String((p && p.name) || '').trim().slice(0, 80) || 'Unnamed';
    const rawItems = Array.isArray(p && p.items) ? p.items.slice(0, MAX_ITEMS_PER_PERSON) : [];
    const items = rawItems
      .map((it) => ({
        label: String((it && it.label) || 'No-Label').trim().slice(0, 120) || 'No-Label',
        price: toSafeNumber(it && it.price)
      }))
      .filter((it) => Number.isFinite(it.price) && it.price > 0);
    const sum = items.reduce((s, it) => s + it.price, 0);
    return { name, items, sum };
  });

  const checkSum = recomputed.reduce((a, b) => a + b.sum, 0);
  if (Math.abs(checkSum - subTotal) > MISMATCH_TOLERANCE) {
    throw new functions.https.HttpsError('failed-precondition', 'itemsMismatch');
  }

  const vat = totalOrder - subTotal;
  const results = recomputed.map((p) => {
    const percent = checkSum === 0 ? 0 : p.sum / checkSum;
    const vatShare = vat * percent;
    const discountShare = discount * percent;
    const totalPay = p.sum + vatShare - discountShare;
    return {
      name: p.name,
      sum: Number(p.sum.toFixed(2)),
      items: p.items,
      vatShare: Number(vatShare.toFixed(2)),
      discountShare: Number(discountShare.toFixed(2)),
      totalPay: Number(totalPay.toFixed(2))
    };
  });

  const calcRecord = {
    totalOrder,
    subTotal,
    discount,
    vat: Number(vat.toFixed(2)),
    totals: results,
    resultsSummary: results.map((r) => ({ name: r.name, sum: r.sum })),
    localeLang,
    source,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // Only write history for a verified, signed-in caller — never trust a
  // uid passed in the request body, only context.auth (set by Firebase
  // after validating the caller's ID token).
  let historyId = null;
  if (context.auth && context.auth.uid) {
    const ref = await admin
      .firestore()
      .collection('users')
      .doc(context.auth.uid)
      .collection('history')
      .add(calcRecord);
    historyId = ref.id;
  }

  return {
    results,
    vat: calcRecord.vat,
    totalOrder,
    subTotal,
    discount,
    historyId
  };
});
