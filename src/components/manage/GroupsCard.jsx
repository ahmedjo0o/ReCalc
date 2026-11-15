import { useState } from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { TextInput } from '../ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useFavorites } from '../../hooks/useFavorites.js';
import { useGroups } from '../../hooks/useGroups.js';

const MAX_MEMBERS = 60;
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

// Create / edit form. Members can be ticked from favorites or typed in.
function GroupEditor({ initial, favoriteNames, onSave, onCancel, t }) {
  const [name, setName] = useState(initial?.name || '');
  const [members, setMembers] = useState(initial?.members || []);
  const [extra, setExtra] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const has = (n) => members.some((m) => sameName(m, n));

  function toggle(n) {
    setMembers((prev) => (prev.some((m) => sameName(m, n)) ? prev.filter((m) => !sameName(m, n)) : [...prev, n].slice(0, MAX_MEMBERS)));
  }

  function addExtra() {
    const clean = extra.trim().slice(0, 80);
    if (clean && !has(clean)) setMembers((prev) => [...prev, clean].slice(0, MAX_MEMBERS));
    setExtra('');
  }

  async function submit(e) {
    e.preventDefault();
    const cleanName = name.trim().slice(0, 40);
    if (!cleanName) {
      setError(t.groupNameRequired);
      return;
    }
    if (members.length < 2) {
      setError(t.groupMembersRequired);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave({ id: initial?.id, name: cleanName, members });
    } catch (err) {
      console.error('Could not save group:', err);
      setError(t.authGenericError);
      setBusy(false);
    }
  }

  // Favorites first, then any members that aren't favorites.
  const choices = [...favoriteNames, ...members.filter((m) => !favoriteNames.some((f) => sameName(f, m)))];

  return (
    <form className="group-editor" onSubmit={submit}>
      <TextInput placeholder={t.groupNamePlaceholder} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
      <div className="group-editor__label">{t.groupPickMembers}</div>
      {choices.length > 0 && (
        <div className="chips">
          {choices.map((n) => (
            <button key={n} type="button" className={`chip chip--pick${has(n) ? ' is-on' : ''}`} aria-pressed={has(n)} onClick={() => toggle(n)}>
              {has(n) ? '✓ ' : ''}{n}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <TextInput
          placeholder={t.groupAddNamePlaceholder}
          value={extra}
          maxLength={80}
          onChange={(e) => setExtra(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addExtra();
            }
          }}
        />
        <Button variant="secondary" size="sm" onClick={addExtra}>{t.addButton}</Button>
      </div>
      <span className="error-text">{error}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" variant="primary" size="sm" loading={busy}>{t.saveButton}</Button>
        <Button variant="secondary" size="sm" onClick={onCancel}>{t.cancelButton}</Button>
      </div>
    </form>
  );
}

export default function GroupsCard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { groups, loading, loadError, save, remove } = useGroups(user?.uid);
  const { favorites } = useFavorites(user?.uid);
  const [editing, setEditing] = useState(null); // null | 'new' | group id
  const favoriteNames = (favorites || []).map((f) => f.name).filter(Boolean);

  async function handleSave(group) {
    await save(group);
    setEditing(null);
  }

  function handleDelete(group) {
    if (confirm(t.groupDeleteConfirm.replace('{name}', group.name))) remove(group);
  }

  return (
    <Card header={t.groupsTitle}>
      <p className="muted" style={{ marginTop: 0 }}>{t.groupsHint}</p>

      {loading && <p>{t.loadingText}</p>}
      {!loading && loadError && <p className="error-text">{t.loadFailedError}</p>}
      {!loading && !loadError && groups.length === 0 && editing !== 'new' && <p className="muted">{t.noGroupsYet}</p>}

      {!loading && groups.length > 0 && (
        <ul className="rows">
          {groups.map((g) =>
            editing === g.id ? (
              <li key={g.id}>
                <GroupEditor initial={g} favoriteNames={favoriteNames} onSave={handleSave} onCancel={() => setEditing(null)} t={t} />
              </li>
            ) : (
              <li key={g.id} className="row">
                <div className="row__main">
                  <div className="row__title">{g.name} <span className="chip">{g.members.length}</span></div>
                  <div className="row__sub">{g.members.join(' · ')}</div>
                </div>
                <div className="row__actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(g.id)}>{t.editButton}</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(g)}>{t.deleteButton}</button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {editing === 'new' ? (
        <GroupEditor favoriteNames={favoriteNames} onSave={handleSave} onCancel={() => setEditing(null)} t={t} />
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setEditing('new')} style={{ marginTop: 10 }}>{t.newGroupButton}</Button>
      )}
    </Card>
  );
}
