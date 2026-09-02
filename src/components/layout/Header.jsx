import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import AuthModal from '../auth/AuthModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function Header() {
  const { t, language, toggleLanguage } = useLanguage();
  const { user, loading, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="top-bar">
      <button className="btn btn-ghost btn-sm" onClick={toggleLanguage}>
        {language === 'ar' ? t.languageEnglish : t.languageArabic}
      </button>

      <Link to="/" className="top-bar__logo">
        <img src="/logo.svg" alt="ReCalc Logo" />
      </Link>

      <div className="auth-box">
        {loading ? (
          <span className="auth-box__spinner" aria-label="Checking sign-in status" />
        ) : user ? (
          <>
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              {t.authWelcome.replace('{name}', user.displayName || user.email || t.guestLabel)}
            </span>
            <Link to="/manage">
              <Button variant="secondary" size="sm">{t.authManage}</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>{t.authLogout}</Button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              {t.authWelcome.replace('{name}', t.guestLabel)}
            </span>
            <Button variant="primary" size="sm" onClick={() => setAuthOpen(true)}>
              {t.authSignIn}
            </Button>
          </>
        )}
      </div>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
