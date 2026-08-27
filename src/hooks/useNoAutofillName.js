import { useRef, useState } from 'react';

// Chrome shows its own "Addresses"/name-autofill panel over plain text
// inputs whose *label text* it heuristically classifies as a person's name
// (it reads the associated <label>, not just the input's name/id/autocomplete
// attributes) — so autocomplete="off" alone doesn't stop it.
//
// The reliable workaround: keep the field readOnly until the instant it's
// actually focused. Chrome decides whether a field is autofill-eligible at
// focus time based on its readOnly state right then; flipping readOnly off
// a frame later (via requestAnimationFrame) means Chrome never gets the
// chance to treat it as editable/autofillable for that focus event. A
// randomized `name` attribute is added on top so Chrome's per-field autofill
// memory can't lock onto this field across renders either.
export function useNoAutofillName() {
  const [locked, setLocked] = useState(true);
  const inputRef = useRef(null);
  const fieldName = useRef(`f-${Math.random().toString(36).slice(2)}`);

  function onFocus() {
    if (locked) {
      setLocked(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function onBlur() {
    setLocked(true);
  }

  return {
    ref: inputRef,
    name: fieldName.current,
    autoComplete: 'off',
    readOnly: locked,
    onFocus,
    onBlur,
  };
}
