import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';

// The landing screen: two large choices that are clearly the main thing to
// do on the page, with a one-line explanation under each.
export default function MethodChoiceStep({ onChoose }) {
  const { t, language } = useLanguage();
  return (
    <div className="step method">
      <h1 className="method__title">{t.chooseMethodTitle}</h1>
      <p className="method__subtitle">{t.chooseMethodSubtitle}</p>

      <div className="method__choices">
        <button type="button" className="method-choice method-choice--primary" onClick={() => onChoose('scan')}>
          <span className="method-choice__icon" aria-hidden="true">📷</span>
          <span className="method-choice__label">{t.scanMethodTitle}</span>
          <span className="method-choice__hint">{t.scanMethodHint}</span>
        </button>
        <button type="button" className="method-choice" onClick={() => onChoose('manual')}>
          <span className="method-choice__icon" aria-hidden="true">✍️</span>
          <span className="method-choice__label">{t.manualMethodTitle}</span>
          <span className="method-choice__hint">{t.manualMethodHint}</span>
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <Link to="/how-to-use" className="btn btn-ghost btn-sm howto-link">
          <span className="howto-link__icon" aria-hidden="true">{language === 'ar' ? '؟' : '?'}</span>
          <span>{t.howToButton}</span>
        </Link>
      </div>
    </div>
  );
}
