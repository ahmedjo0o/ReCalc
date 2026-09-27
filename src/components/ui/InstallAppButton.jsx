import { useState, useEffect } from 'react';
import Button from './Button.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function InstallAppButton() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      setIsInstallable(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSPrompt(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    }
  };

  if (!isInstallable) {
    return null;
  }

  return (
    <>
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
        <Button variant="secondary" onClick={handleInstallClick}>
          {t.installAppButton || 'Add to Home Screen'}
        </Button>
      </div>

      {showIOSPrompt && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', 
          padding: '20px', borderTop: '1px solid #ccc', zIndex: 1000,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', textAlign: 'center'
        }}>
          <p style={{ marginBottom: '10px' }}>
            To install ReCalc on iOS: tap the <strong>Share</strong> icon and select <strong>Add to Home Screen</strong>.
          </p>
          <Button variant="secondary" onClick={() => setShowIOSPrompt(false)}>
            Dismiss
          </Button>
        </div>
      )}
    </>
  );
}
