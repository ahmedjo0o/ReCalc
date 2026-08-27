import { useState } from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import AuthModal from './AuthModal.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function SignInRequired({ message }) {
  const { t } = useLanguage();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <Card header={t.signInRequiredTitle} style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
      <p style={{ marginTop: 0 }}>{message}</p>
      <Button variant="primary" onClick={() => setAuthOpen(true)}>{t.authSignIn}</Button>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </Card>
  );
}
