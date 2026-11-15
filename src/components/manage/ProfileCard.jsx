import { useEffect, useState } from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { Field, TextInput, Select } from '../ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { CURRENCIES } from '../../i18n/translations.js';
import { mapAuthErrorMessage } from '../../lib/errors.js';

// Only ever rendered when signed in — ManagePage gates the whole page on
// auth — so this assumes `user` is always present.
export default function ProfileCard() {
  const { t } = useLanguage();
  const { user, updateDisplayName, changePassword } = useAuth();
  const { currency, setCurrency } = useCurrency();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const providers = (user?.providerData || []).map((p) => p.providerId);
  const hasPasswordProvider = providers.includes('password');

  useEffect(() => {
    setDisplayName(user?.displayName || '');
  }, [user]);

  async function handleSaveName() {
    setMessage('');
    try {
      await updateDisplayName(displayName.trim());
      setMessage(t.nameSaved);
    } catch (err) {
      console.warn('Could not save name:', err);
      setMessage(t.authGenericError);
    }
  }

  async function handleCurrencyChange(next) {
    setMessage('');
    try {
      await setCurrency(next);
      setMessage(t.currencyUpdated);
    } catch (err) {
      console.warn('Could not save currency:', err);
      setMessage(t.authGenericError);
    }
  }

  async function handleChangePassword() {
    setMessage('');
    if (!newPassword) {
      setMessage(t.newPasswordPlaceholder);
      return;
    }
    setBusy(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setMessage(res.mode === 'reset-email-sent' ? t.passwordResetSent : t.passwordChanged);
    } catch (err) {
      console.warn('Could not change password:', err);
      setMessage(mapAuthErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card header={t.manageProfileTitle}>
      <Field label={t.profileDisplayName}>
        <div style={{ display: 'flex', gap: 8 }}>
          <TextInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <Button variant="secondary" size="sm" onClick={handleSaveName}>{t.saveButton}</Button>
        </div>
      </Field>

      <Field label={t.currency}>
        <Select value={currency} onChange={(e) => handleCurrencyChange(e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <span className="muted" style={{ fontSize: '0.8rem' }}>{t.currencyHint}</span>
      </Field>

      <Field label={hasPasswordProvider ? t.changePasswordLabel : t.createPasswordLabel}>
        {hasPasswordProvider && (
          <TextInput
            type="password"
            placeholder={t.currentPasswordPlaceholder}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <TextInput
            type="password"
            placeholder={hasPasswordProvider ? t.newPasswordPlaceholder : t.setPasswordPlaceholder}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button variant="secondary" size="sm" loading={busy} onClick={handleChangePassword}>
            {hasPasswordProvider ? t.changeButton : t.createButton}
          </Button>
        </div>
      </Field>

      {message && <div style={{ fontSize: 13, color: '#333', marginTop: 4 }}>{message}</div>}
    </Card>
  );
}
