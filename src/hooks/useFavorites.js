import { useCallback, useEffect, useState } from 'react';
import { getFavorites, addFavorite, updateFavorite, deleteFavorite, reorderFavorites } from '../lib/firestoreService.js';

// Favorites are a signed-in-only feature — no localStorage fallback for
// guests. Every mutator below is a no-op without a uid; callers (the Manage
// page's Favorites card, gated on auth) should never invoke them for a
// guest anyway, but the hook stays safe to call unconditionally so the
// names-step autocomplete can use it too without branching on auth itself.
export function useFavorites(uid) {
  const [favorites, setFavorites] = useState(uid ? null : []);

  const reload = useCallback(async () => {
    if (!uid) {
      setFavorites([]);
      return [];
    }
    const favs = await getFavorites(uid);
    setFavorites(favs || []);
    return favs || [];
  }, [uid]);

  useEffect(() => {
    setFavorites(uid ? null : []);
    reload();
  }, [uid, reload]);

  async function add(name) {
    if (!uid) return;
    await addFavorite(uid, { name });
    return reload();
  }

  async function update(fav, newName) {
    if (!uid) return;
    await updateFavorite(uid, fav.id, { name: newName });
    return reload();
  }

  async function remove(fav) {
    if (!uid) return;
    await deleteFavorite(uid, fav.id);
    return reload();
  }

  // Add-if-missing / remove-if-present, used by the names-step star button.
  async function toggle(name) {
    if (!uid) return;
    const lower = name.trim().toLowerCase();
    const existing = (favorites || []).find((f) => (f.name || '').trim().toLowerCase() === lower);
    if (existing) await remove(existing);
    else await add(name.trim());
  }

  // Swaps the item at `index` with its neighbor in `direction` (-1 up, +1
  // down). Updates the list optimistically so the button feels instant, then
  // persists; reverts on failure.
  async function move(index, direction) {
    if (!uid) return;
    const list = favorites || [];
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= list.length) return;

    const next = [...list];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    setFavorites(next);

    try {
      await reorderFavorites(uid, next);
    } catch (err) {
      await reload();
      throw err;
    }
  }

  return { favorites, loading: uid ? favorites === null : false, reload, add, update, remove, toggle, move };
}
