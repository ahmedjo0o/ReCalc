import { useCallback, useEffect, useState } from 'react';
import { getUserHistory, deleteHistoryItem } from '../lib/firestoreService.js';

// History is a signed-in-only feature — no localStorage fallback for guests.
// Every mutator below is a no-op without a uid; callers (the Manage page's
// history preview and the full History page, both gated on auth) should
// never invoke them for a guest anyway.
export function useHistory(uid, limitCount = 20) {
  const [items, setItems] = useState(uid ? null : []);

  const reload = useCallback(async () => {
    if (!uid) {
      setItems([]);
      return [];
    }
    const list = await getUserHistory(uid, limitCount);
    setItems(list);
    return list;
  }, [uid, limitCount]);

  useEffect(() => {
    setItems(uid ? null : []);
    reload();
  }, [uid, reload]);

  async function remove(item) {
    if (!uid) return;
    await deleteHistoryItem(uid, item.id);
    return reload();
  }

  async function clearAll() {
    if (!uid) return;
    await Promise.all((items || []).map((item) => deleteHistoryItem(uid, item.id)));
    return reload();
  }

  return { items, loading: uid ? items === null : false, reload, remove, clearAll };
}
