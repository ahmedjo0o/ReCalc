import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { TextInput } from '../ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function AuthModal({ onClose, initialMode = 'signin' }) {
  const { t } = useLanguage();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(t.nameError);
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
      onClose();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  const isSignUp = mode === 'signup';

  return (
    <Modal title={isSignUp ? t.authSignUp : t.authSignIn} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <TextInput
          type="email"
          autoComplete="username"
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextInput
          type="password"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          placeholder={t.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span className="error-text">{error}</span>
        <Button type="submit" variant="primary" block loading={busy}>
          {isSignUp ? t.authSignUp : t.authSignIn}
        </Button>
      </form>

      <div className="modal__divider">{t.orDivider}</div>

      <Button variant="google" block onClick={handleGoogle} disabled={busy}>
        <GoogleIcon /> {t.signInWithGoogleButton}
      </Button>

      <div className="modal__switch">
        {isSignUp ? (
          <span>
            {t.haveAccountText}{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setMode('signin'); setError(''); }}>
              {t.authSignIn}
            </a>
          </span>
        ) : (
          <span>
            {t.noAccountText}{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setMode('signup'); setError(''); }}>
              {t.authSignUp}
            </a>
          </span>
        )}
      </div>
    </Modal>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" style={{ verticalAlign: 'middle' }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
