import { useRef, useState } from 'react';

// Mirrors the legacy showError() behavior: a message appears immediately and
// clears itself after `timeout` ms so stale validation errors don't linger.
export function useFieldError(timeout = 3000) {
  const [message, setMessage] = useState('');
  const timerRef = useRef(null);

  function showError(msg) {
    setMessage(msg);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMessage(''), timeout);
  }

  function clearError() {
    clearTimeout(timerRef.current);
    setMessage('');
  }

  return [message, showError, clearError];
}
