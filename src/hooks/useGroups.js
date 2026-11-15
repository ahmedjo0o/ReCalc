import { useCallback, useEffect, useState } from 'react';
import { getGroups, addGroup, updateGroup, deleteGroup } from '../lib/firestoreService.js';

// Saved groups of names ("Work friends", "Family") for signed-in users, so a
// regular set of people can be filled into the names step with one tap.
export function useGroups(uid) {
  const [groups, setGroups] = useState(uid ? null : []);
  const [loadError, setLoadError] = useState(false);

  const reload = useCallback(async () => {
    if (!uid) {
      setGroups([]);
      return [];
    }
    const list = await getGroups(uid);
    setGroups(list);
    return list;
  }, [uid]);

  useEffect(() => {
    setGroups(uid ? null : []);
    setLoadError(false);
    reload().catch((err) => {
      console.error('Could not load groups:', err);
      setGroups([]);
      setLoadError(true);
    });
  }, [uid, reload]);

  async function save(group) {
    if (!uid) return;
    if (group.id) await updateGroup(uid, group.id, { name: group.name, members: group.members });
    else await addGroup(uid, { name: group.name, members: group.members });
    return reload();
  }

  async function remove(group) {
    if (!uid) return;
    await deleteGroup(uid, group.id);
    return reload();
  }

  return { groups, loading: uid ? groups === null : false, loadError, reload, save, remove };
}
