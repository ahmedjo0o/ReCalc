import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import AuthModal from '../auth/AuthModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function Header() {
  const { t } = useLanguage();
  const { user, loading, authTiming, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const showDebugTiming = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';

  return (
    <div className="top-bar">
      {/* Grid columns are 1fr auto 1fr (see CSS) — the logo sits in the auto
          middle column, flanked by two equal 1fr columns, so it stays
          mathematically centered regardless of screen size or how wide the
          auth box gets. The language toggle moved to the footer so nothing
          needs to occupy the left column at all. */}
      <Link to="/" className="top-bar__logo">
        <img src="/logo.svg" alt="ReCalc Logo" />
      </Link>

      <div className="auth-box-row">
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
      </div>

      {showDebugTiming && authTiming && (
        <div
          style={{
            position: 'fixed',
            bottom: 8,
            left: 8,
            fontSize: 11,
            fontFamily: 'monospace',
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: 8,
            zIndex: 999,
          }}
        >
          load: {authTiming.bundleMs}ms · auth check: {authTiming.authMs}ms
        </div>
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
