// Guest-mode fallback storage — same localStorage keys/shapes as the legacy
// ReCalc-frontend/firebase.js used, so existing guests' data keeps working
// after cutover.

const HISTORY_KEY = 'recalc_history';
const FAVORITES_KEY = 'recalc_favorites';
const CURRENCY_KEY = 'recalc_currency';
export const DEFAULT_CURRENCY = 'EGP';

export function localSaveCalculation(calculationObject) {
  const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  arr.unshift(calculationObject);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 50)));
}

export function localGetHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

export function localDeleteHistory(createdAtOrIndex) {
  const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  const newArr = arr.filter((item) => item.createdAt !== createdAtOrIndex);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newArr));
  return newArr;
}

export function localClearHistory() {
  localStorage.setItem(HISTORY_KEY, '[]');
}

export function localGetFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function localToggleFavorite(favoriteObj) {
  const arr = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  const idx = arr.findIndex((f) => f.name === favoriteObj.name);
  if (idx === -1) {
    arr.unshift(favoriteObj);
  } else {
    arr.splice(idx, 1);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(arr));
  return arr;
}

export function localUpdateFavorite(oldName, newName) {
  const arr = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  const idx = arr.findIndex((f) => f.name === oldName);
  if (idx === -1) return arr;
  arr[idx].name = newName;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(arr));
  return arr;
}

export function localDeleteFavorite(name) {
  const arr = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  const newArr = arr.filter((f) => f.name !== name);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(newArr));
  return newArr;
}

// Currency preference for guests (signed-in users get this from Firestore
// via getUserProfile/setUserCurrency in firestoreService.js instead).
export function localGetCurrency() {
  return localStorage.getItem(CURRENCY_KEY) || DEFAULT_CURRENCY;
}

export function localSetCurrency(currency) {
  localStorage.setItem(CURRENCY_KEY, currency);
}
