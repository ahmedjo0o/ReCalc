import { useCallback, useEffect, useState } from 'react';
import { getFavorites, addFavorite, updateFavorite, deleteFavorite } from '../lib/firestoreService.js';
import { localGetFavorites, localToggleFavorite, localUpdateFavorite, localDeleteFavorite } from '../lib/localStorageService.js';

// Wraps the Firestore/localStorage favorites CRUD behind one hook, used by
// the names-step autocomplete and the Manage page's favorites card.
export function useFavorites(uid) {
  const [favorites, setFavorites] = useState(null);

  const reload = useCallback(async () => {
    const favs = uid
      ? await getFavorites(uid)
      : localGetFavorites().map((f) => ({ id: f.name, name: f.name }));
    setFavorites(favs || []);
    return favs || [];
  }, [uid]);

  useEffect(() => {
    setFavorites(null);
    reload();
  }, [reload]);

  async function add(name) {
    if (uid) await addFavorite(uid, { name });
    else localToggleFavorite({ name });
    return reload();
  }

  async function update(fav, newName) {
    if (uid) await updateFavorite(uid, fav.id, { name: newName });
    else localUpdateFavorite(fav.name, newName);
    return reload();
  }

  async function remove(fav) {
    if (uid) await deleteFavorite(uid, fav.id);
    else localDeleteFavorite(fav.name);
    return reload();
  }

  // Add-if-missing / remove-if-present, used by the names-step star button.
  async function toggle(name) {
    const lower = name.trim().toLowerCase();
    const existing = (favorites || []).find((f) => (f.name || '').trim().toLowerCase() === lower);
    if (existing) await remove(existing);
    else await add(name.trim());
  }

  return { favorites, loading: favorites === null, reload, add, update, remove, toggle };
}
