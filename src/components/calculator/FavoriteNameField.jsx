import { useRef, useState } from 'react';
import { TextInput } from '../ui/Field.jsx';

// A small custom autocomplete, replacing the native <datalist> that was here
// before — datalist's dropdown behavior (re-opening right after a selection,
// inconsistent styling/positioning) is exactly why the legacy vanilla app
// built its own dropdown too instead of using datalist.
export default function FavoriteNameField({ label, name, suggestions, isFav, onChange, onToggleFavorite }) {
  const [open, setOpen] = useState(false);
  const blurTimer = useRef(null);
  // Chrome ignores autocomplete="off" for fields its heuristics classify as
  // a "name" field (it reads the associated label text, not just the name/id
  // attributes) and shows its own Addresses autofill panel on top of ours.
  // A randomized `name` attribute — different every mount — stops Chrome's
  // per-field autofill matching from locking onto this input.
  const randomFieldName = useRef(`person-name-${Math.random().toString(36).slice(2)}`);

  function handleFocus() {
    clearTimeout(blurTimer.current);
    setOpen(true);
  }

  function handleBlur() {
    // Give a pending mousedown-select (below) a chance to fire first.
    blurTimer.current = setTimeout(() => setOpen(false), 150);
  }

  function selectSuggestion(value) {
    onChange(value);
    setOpen(false);
  }

  const visible = open ? suggestions : [];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <label style={{ minWidth: 90, fontSize: '0.9rem' }}>{label}</label>
      <div className="autocomplete">
        <TextInput
          value={name}
          name={randomFieldName.current}
          autoComplete="off"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {visible.length > 0 && (
          <div className="autocomplete__menu">
            {visible.map((n) => (
              <div
                key={n}
                className="autocomplete__item"
                // mousedown (not click) fires before the input's blur, and
                // preventDefault stops the input from losing focus at all —
                // otherwise blur would close the menu before the click lands.
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(n);
                }}
              >
                {n}
              </div>
            ))}
          </div>
        )}
      </div>
      <button type="button" title="Add/remove favorite" className="btn btn-ghost btn-sm" onClick={onToggleFavorite}>
        {isFav ? '★' : '☆'}
      </button>
    </div>
  );
}
