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
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase.js';

export const DEFAULT_CURRENCY = 'EGP';

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

// Deliberately not server-ordered: Firestore's orderBy() excludes any
// document missing the ordered field entirely, and existing favorites (from
// before drag-free reordering was added) have no `order` field yet. Fetching
// unordered and sorting client-side avoids silently dropping those from the
// list, and lazily migrates them (an `order` gets written the first time the
// user reorders anything).
export async function getFavorites(uid) {
  if (!uid) return [];
  const ref = collection(db, 'users', uid, 'favorites');
  const snap = await getDocs(ref);
  const favs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return sortFavorites(favs);
}

function sortFavorites(favs) {
  return [...favs].sort((a, b) => {
    if (a.order != null && b.order != null) return a.order - b.order;
    if (a.order != null) return -1;
    if (b.order != null) return 1;
    const at = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bt = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bt - at;
  });
}

// Persists a full reordering as sequential `order` values in one batch —
// simpler and more robust than computing a single moved item's new position.
export async function reorderFavorites(uid, orderedFavorites) {
  if (!uid) throw new Error('no uid');
  const batch = writeBatch(db);
  orderedFavorites.forEach((fav, index) => {
    batch.update(doc(db, 'users', uid, 'favorites', fav.id), { order: index });
  });
  await batch.commit();
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
