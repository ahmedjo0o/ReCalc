import Button from '../ui/Button.jsx';
import { Field, TextInput } from '../ui/Field.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFieldError } from '../../hooks/useFieldError.js';
import { useFavorites } from '../../hooks/useFavorites.js';

export default function NamesStep({ numPeople, names, onNumPeopleChange, onNamesChange, onBack, onNext }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [error, showError] = useFieldError();
  const { favorites, toggle } = useFavorites(user?.uid);

  function handleCountSubmit(e) {
    e.preventDefault();
    const count = Number(numPeople);
    if (!count || count < 1) {
      showError(t.numPeopleError);
      return;
    }
    const next = Array.from({ length: count }, (_, i) => names[i] || '');
    onNamesChange(next);
  }

  function updateName(i, value) {
    const next = [...names];
    next[i] = value;
    onNamesChange(next);
  }

  async function toggleFavoriteFor(name) {
    if (!name.trim()) return;
    try {
      await toggle(name);
    } catch (err) {
      showError(err.message || String(err));
    }
  }

  function handleNext() {
    const valid = names.length > 0 && names.every((n) => n.trim());
    if (!valid) {
      showError(t.nameError);
      return;
    }
    onNext();
  }

  return (
    <div className="step">
      <form onSubmit={handleCountSubmit}>
        <Field label={t.numPeople}>
          <TextInput
            type="number"
            min="1"
            value={numPeople}
            onChange={(e) => onNumPeopleChange(e.target.value)}
          />
        </Field>
        <Button type="submit" variant="primary" size="sm">{t.generateNamesButton}</Button>
      </form>

      {names.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {names.map((name, i) => {
            const lower = name.trim().toLowerCase();
            const isFav = !!lower && (favorites || []).some((f) => (f.name || '').trim().toLowerCase() === lower);
            const suggestions = (favorites || [])
              .map((f) => f.name)
              .filter(Boolean)
              .filter((n) => !names.some((sel, j) => j !== i && sel.trim().toLowerCase() === n.trim().toLowerCase()))
              .filter((n) => !name || n.toLowerCase().includes(name.trim().toLowerCase()));

            return (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ minWidth: 90, fontSize: '0.9rem' }}>{t.nameLabel} {i + 1}</label>
                  <TextInput
                    value={name}
                    autoComplete="off"
                    list={`names-datalist-${i}`}
                    onChange={(e) => updateName(i, e.target.value)}
                  />
                  <datalist id={`names-datalist-${i}`}>
                    {suggestions.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    title="Add/remove favorite"
                    className="btn btn-ghost btn-sm"
                    onClick={() => toggleFavoriteFor(name)}
                  >
                    {isFav ? '★' : '☆'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <span className="error-text">{error}</span>

      <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
        <Button variant="secondary" onClick={onBack}>{t.backToStart}</Button>
        {names.length > 0 && (
          <Button variant="primary" onClick={handleNext}>{t.nextButton}</Button>
        )}
      </div>
    </div>
  );
}
