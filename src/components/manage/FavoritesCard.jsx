import { useState } from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { TextInput } from '../ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useFavorites } from '../../hooks/useFavorites.js';
import { useNoAutofillName } from '../../hooks/useNoAutofillName.js';

function FavoriteEditInput({ value, onChange }) {
  const autofillGuard = useNoAutofillName();
  return <TextInput {...autofillGuard} value={value} onChange={onChange} />;
}

export default function FavoritesCard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { favorites, loading, add, update, remove, move } = useFavorites(user?.uid);
  const [newName, setNewName] = useState('');
  const [edits, setEdits] = useState({});
  const newFavoriteGuard = useNoAutofillName();

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    await add(name);
    setNewName('');
  }

  async function handleSave(fav) {
    const newValue = (edits[fav.id] ?? fav.name).trim();
    if (!newValue) return;
    await update(fav, newValue);
  }

  return (
    <Card header={t.manageFavoritesTitle}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <TextInput
          {...newFavoriteGuard}
          placeholder={t.addFavoritePlaceholder}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button variant="secondary" size="sm" onClick={handleAdd}>{t.addFavoriteButton}</Button>
      </div>

      {loading && <p>{t.loadingText}</p>}
      {!loading && favorites.length === 0 && <p>{t.noFavoritesYet}</p>}
      {!loading && favorites.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {favorites.map((fav, i) => (
            <div key={fav.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 10px' }}
                  title="Move up"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 10px' }}
                  title="Move down"
                  disabled={i === favorites.length - 1}
                  onClick={() => move(i, 1)}
                >
                  ↓
                </button>
              </div>
              <FavoriteEditInput
                value={edits[fav.id] ?? fav.name}
                onChange={(e) => setEdits((prev) => ({ ...prev, [fav.id]: e.target.value }))}
              />
              <Button variant="secondary" size="sm" onClick={() => handleSave(fav)}>{t.saveButton}</Button>
              <Button variant="danger" size="sm" onClick={() => remove(fav)}>{t.deleteButton}</Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
