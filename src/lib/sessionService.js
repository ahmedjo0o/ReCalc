import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';

// A "shared bill": the host scans a receipt, then sends friends a link so each
// person taps the items they ordered on their own phone.
//
// sessions/{id} = {
//   ownerUid, ownerName, status: 'open' | 'done', createdAt, expiresAt,
//   totalOrder, subTotal, discount,
//   items:  [{ label, price }]            fixed once created
//   people: [name, ...]                   anyone with the link can add theirs
//   claims: { "<item index>": [name, ...] }   who ordered each item
//   results, tip                          written by the host on Calculate
// }
//
// firestore.rules lets only a signed-in user create a session, lets anyone
// holding the link read it and change `people` / `claims` while it is open,
// and lets only the owner change anything else.

// How long a shared link works. firestore.rules enforces the same moment
// (expiresAt), so an expired bill cannot be opened or changed even by someone
// who kept the link. The host's calculation is unaffected: calculateBill saves
// it to their history, which never expires.
const SESSION_HOURS = 24;
export const MAX_NAME_LENGTH = 40;

export async function createSession({ ownerUid, ownerName, currency, totalOrder, subTotal, discount, items, people }) {
  const ref = await addDoc(collection(db, 'sessions'), {
    ownerUid,
    ownerName: ownerName || '',
    currency: currency || '', // the host's currency, shown to everyone on the bill
    status: 'open',
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + SESSION_HOURS * 60 * 60 * 1000),
    totalOrder,
    subTotal,
    discount,
    items,
    people,
    claims: {},
  });
  return ref.id;
}

// Live updates. onData(null) means the bill does not exist.
export function subscribeSession(id, onData, onError) {
  return onSnapshot(
    doc(db, 'sessions', id),
    (snap) => onData(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError,
  );
}

export function joinSession(id, name) {
  return updateDoc(doc(db, 'sessions', id), { people: arrayUnion(name) });
}

// arrayUnion/arrayRemove on a single map entry, so two friends tapping
// different (or the same) items at the same moment never overwrite each other.
export function setClaim(id, itemIndex, name, claimed) {
  return updateDoc(doc(db, 'sessions', id), {
    [`claims.${itemIndex}`]: claimed ? arrayUnion(name) : arrayRemove(name),
  });
}

// Host only: give every still-unclaimed item to everyone.
export function claimForEveryone(id, itemIndexes, people) {
  const update = {};
  itemIndexes.forEach((i) => {
    update[`claims.${i}`] = people;
  });
  return updateDoc(doc(db, 'sessions', id), update);
}

// historyId: the host's own history record for this calculation, so ticks
// made on the shared bill can be copied there (it outlives the 24-hour link).
export function saveSessionResults(id, results, tip, historyId) {
  return updateDoc(doc(db, 'sessions', id), { status: 'done', results, tip, historyId: historyId || null, settlement: null });
}

export function reopenSession(id) {
  return updateDoc(doc(db, 'sessions', id), { status: 'open', results: [], historyId: null, settlement: null });
}

// The host's own bills that have not expired yet, newest first. (Expired ones
// stay in the database until the TTL policy removes them, so they are
// filtered out here.)
export async function listMySessions(uid) {
  const snap = await getDocs(query(collection(db, 'sessions'), where('ownerUid', '==', uid), limit(50)));
  const now = Date.now();
  const millis = (ts) => (ts && ts.toMillis ? ts.toMillis() : 0);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) => millis(s.expiresAt) > now)
    .sort((a, b) => millis(b.createdAt) - millis(a.createdAt));
}

export function deleteSession(id) {
  return deleteDoc(doc(db, 'sessions', id));
}

// Host only (the rules refuse anyone else): who paid, and who has paid back.
export function setSessionSettlement(id, settlement) {
  return updateDoc(doc(db, 'sessions', id), { settlement });
}
