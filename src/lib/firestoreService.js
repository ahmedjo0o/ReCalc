import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';

// --- History (read/delete only — history.rules blocks client create/update; ---
// --- entries are written server-side by the calculateBill Cloud Function). ---

export async function getUserHistory(uid, limitCount = 20) {
  const ref = query(
    collection(db, 'users', uid, 'history'),
    orderBy('createdAt', 'desc'),
    limit(limitCount),
  );
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteHistoryItem(uid, historyDocId) {
  if (!historyDocId) throw new Error('no id');
  await deleteDoc(doc(db, 'users', uid, 'history', historyDocId));
  return { action: 'deleted', id: historyDocId };
}

// --- Favorites (full CRUD, schema-constrained by firestore.rules) ---

export async function getFavorites(uid) {
  if (!uid) return [];
  const ref = query(collection(db, 'users', uid, 'favorites'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addFavorite(uid, favoriteObj) {
  const favRef = collection(db, 'users', uid, 'favorites');
  const existing = await getDocs(query(favRef, where('name', '==', favoriteObj.name), limit(1)));
  if (!existing.empty) {
    return { action: 'exists', id: existing.docs[0].id };
  }
  const res = await addDoc(favRef, { name: favoriteObj.name, createdAt: serverTimestamp() });
  return { action: 'added', id: res.id };
}

export async function updateFavorite(uid, favId, updates) {
  if (!favId) throw new Error('no favId');
  await updateDoc(doc(db, 'users', uid, 'favorites', favId), { ...updates });
  return { action: 'updated', id: favId };
}

export async function deleteFavorite(uid, favId) {
  if (!favId) throw new Error('no favId');
  await deleteDoc(doc(db, 'users', uid, 'favorites', favId));
  return { action: 'deleted', id: favId };
}

// Add-if-missing / remove-if-present toggle (used by the names-step star button).
export async function toggleFavorite(uid, favoriteObj) {
  const favRef = collection(db, 'users', uid, 'favorites');
  const existing = await getDocs(query(favRef, where('name', '==', favoriteObj.name), limit(1)));
  if (existing.empty) {
    const res = await addDoc(favRef, { ...favoriteObj, createdAt: serverTimestamp() });
    return { action: 'added', id: res.id };
  }
  const docId = existing.docs[0].id;
  await deleteDoc(doc(db, 'users', uid, 'favorites', docId));
  return { action: 'removed', id: docId };
}

// --- User profile doc (users/{uid} root document — currently just `currency`). ---
// --- Requires the firestore.rules addition described in recalc-backend/firestore.rules. ---

export async function getUserProfile(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function setUserCurrency(uid, currency) {
  if (!uid) throw new Error('no uid');
  await setDoc(doc(db, 'users', uid), { currency }, { merge: true });
  return { action: 'updated', currency };
}
