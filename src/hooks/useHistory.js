import { useCallback, useEffect, useState } from 'react';
import { getUserHistory, deleteHistoryItem } from '../lib/firestoreService.js';
import { localGetHistory, localDeleteHistory, localClearHistory } from '../lib/localStorageService.js';

// Wraps the Firestore/localStorage history CRUD behind one hook, used by the
// Manage page's recent-history preview (limitCount=3) and the full,
// paginated History page (limitCount=1000).
export function useHistory(uid, limitCount = 20) {
  const [items, setItems] = useState(null);

  const reload = useCallback(async () => {
    const list = uid
      ? await getUserHistory(uid, limitCount)
      : (localGetHistory() || []).slice(0, limitCount);
    setItems(list);
    return list;
  }, [uid, limitCount]);

  useEffect(() => {
    setItems(null);
    reload();
  }, [reload]);

  async function remove(item) {
    if (uid) await deleteHistoryItem(uid, item.id);
    else localDeleteHistory(item.createdAt);
    return reload();
  }

  async function clearAll() {
    if (uid) {
      await Promise.all((items || []).map((item) => deleteHistoryItem(uid, item.id)));
    } else {
      localClearHistory();
    }
    return reload();
  }

  return { items, loading: items === null, reload, remove, clearAll };
}
