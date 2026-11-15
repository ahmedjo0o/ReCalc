import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card.jsx';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { TextInput } from '../ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { getServerErrorCode, mapAuthErrorMessage } from '../../lib/errors.js';

// Permanent account deletion. Three deliberate hurdles before anything is
// removed: read the list of what goes, type the confirmation word, and prove
// it is really you (password, or Google sign-in again). The server refuses
// the request unless that sign-in happened in the last few minutes.
function DeleteAccountModal({ onClose }) {
  const { t } = useLanguage();
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [word, setWord] = useState('');
  const [password, setPassword] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const hasPassword = (user?.providerData || []).some((p) => p.providerId === 'password');
  const wordOk = word.trim().toLowerCase() === t.deleteConfirmWord.toLowerCase();
  const ready = understood && wordOk && (!hasPassword || password.length > 0);

  async function handleDelete(e) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError('');
    try {
      await deleteAccount(password);
      alert(t.accountDeleted);
      navigate('/');
    } catch (err) {
      console.error('Account deletion failed:', err);
      const code = getServerErrorCode(err);
      if (err && err.code && String(err.code).startsWith('auth/')) setError(mapAuthErrorMessage(err, t));
      else if (code === 'recentLoginRequired') setError(t.deleteAccountReauthError);
      else setError(t.deleteAccountFailed);
      setBusy(false);
    }
  }

  return (
    <Modal title={t.deleteAccountTitle} onClose={busy ? () => {} : onClose}>
      <form onSubmit={handleDelete} className="delete-account">
        <p className="delete-account__warning">⚠ {t.deleteAccountWarning}</p>
        <p style={{ margin: '0 0 6px' }}>{t.deleteAccountListIntro}</p>
        <ul>
          <li>{t.deleteAccountItemProfile.replace('{email}', user?.email || '')}</li>
          <li>{t.deleteAccountItemHistory}</li>
          <li>{t.deleteAccountItemPeople}</li>
          <li>{t.deleteAccountItemBills}</li>
        </ul>
        <p className="muted">{t.deleteAccountNoUndo}</p>

        <label className="delete-account__check">
          <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />
          <span>{t.deleteAccountUnderstand}</span>
        </label>

        <label className="field__label" htmlFor="delete-word">{t.deleteAccountTypeWord.replace('{word}', t.deleteConfirmWord)}</label>
        <TextInput id="delete-word" autoComplete="off" value={word} onChange={(e) => setWord(e.target.value)} />

        {hasPassword ? (
          <>
            <label className="field__label" htmlFor="delete-password" style={{ marginTop: 10 }}>{t.deleteAccountPassword}</label>
            <TextInput id="delete-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </>
        ) : (
          <p className="muted" style={{ marginTop: 10 }}>{t.deleteAccountGoogleNote}</p>
        )}

        <span className="error-text" style={{ display: 'block', marginTop: 8 }}>{error}</span>

        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <Button type="submit" variant="danger" loading={busy} disabled={!ready}>{t.deleteAccountConfirmButton}</Button>
          <Button variant="secondary" onClick={onClose} disabled={busy}>{t.cancelButton}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DeleteAccountCard() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <Card header={t.dangerZoneTitle} className="card--danger">
      <p className="muted" style={{ marginTop: 0 }}>{t.deleteAccountHint}</p>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>{t.deleteAccountButton}</Button>
      {open && <DeleteAccountModal onClose={() => setOpen(false)} />}
    </Card>
  );
}
