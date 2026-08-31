import { useRef, useState } from 'react';

// Chrome shows its own "Addresses"/name-autofill panel over plain text
// inputs whose *label text* it heuristically classifies as a person's name
// (it reads the associated <label>, not just the input's name/id/autocomplete
// attributes) — so autocomplete="off" alone doesn't stop it, and in practice
// neither does readOnly-until-focus alone. None of these tricks is 100%
// reliable by itself (Chrome's behavior here isn't spec'd, just heuristic,
// and varies by version), so this stacks every independently-documented
// mitigation:
//   - type="search" — Chromium's form-autofill classifier structurally
//     excludes search-type inputs from name/address detection.
//   - autocomplete="new-password" — NOT an arbitrary string like "nope":
//     unrecognized autocomplete values are ignored entirely (falling back to
//     full heuristics, i.e. worse than doing nothing). "new-password" is a
//     real, spec-defined token Chrome treats strictly as "never autofill,
//     never save" and consistently honors.
//   - readOnly until the instant of focus — Chrome decides autofill
//     eligibility from the field's readOnly state at focus time; flipping it
//     off a frame later (restoring focus after) means Chrome never gets the
//     chance to treat it as editable for that focus event. Desktop-only:
//     mobile browsers only show the virtual keyboard when focus lands on an
//     already-editable field as a direct, synchronous result of the tap —
//     the re-focus here happens a frame later via requestAnimationFrame, so
//     on mobile it would leave the field focused but keyboardless. Mobile
//     autofill suggestions are a keyboard-bar chip, not a disruptive overlay
//     like desktop Chrome's, so skipping the trick there costs nothing.
//   - a randomized `name` attribute — stops Chrome's per-field autofill
//     memory from locking onto this field across renders.
function isMobileDevice() {
  return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function useNoAutofillName() {
  const [locked, setLocked] = useState(!isMobileDevice());
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
    type: 'search',
    autoComplete: 'new-password',
    readOnly: locked,
    onFocus,
    onBlur,
  };
}
