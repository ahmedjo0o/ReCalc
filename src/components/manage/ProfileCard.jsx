import { useEffect, useState } from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { Field, TextInput, Select } from '../ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { CURRENCIES } from '../../i18n/translations.js';
import { getUserProfile, setUserCurrency, DEFAULT_CURRENCY } from '../../lib/firestoreService.js';

// Only ever rendered when signed in — ManagePage gates the whole page on
// auth — so this assumes `user` is always present.
export default function ProfileCard() {
  const { t } = useLanguage();
  const { user, updateDisplayName, changePassword } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const providers = (user?.providerData || []).map((p) => p.providerId);
  const hasPasswordProvider = providers.includes('password');

  useEffect(() => {
    setDisplayName(user?.displayName || '');
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const profile = await getUserProfile(user.uid);
      if (!cancelled) setCurrency(profile?.currency || DEFAULT_CURRENCY);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSaveName() {
    setMessage('');
    try {
      await updateDisplayName(displayName.trim());
      setMessage(t.savedToFavorites);
    } catch (err) {
      setMessage(err.message || String(err));
    }
  }

  async function handleCurrencyChange(next) {
    setCurrency(next);
    await setUserCurrency(user.uid, next);
    setMessage(t.currencyUpdated);
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
      setMessage(res.mode === 'reset-email-sent' ? t.currencyUpdated : t.savedToFavorites);
    } catch (err) {
      setMessage(err.message || String(err));
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
