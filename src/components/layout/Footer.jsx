import { useLanguage } from '../../context/LanguageContext.jsx';

export default function Footer() {
  const { t, language, toggleLanguage } = useLanguage();
  return (
    <footer className="site-footer">
      <button type="button" className="btn btn-ghost btn-sm" onClick={toggleLanguage}>
        {language === 'ar' ? t.languageEnglish : t.languageArabic}
      </button>
      <div className="site-footer__links">
        <a href="/about.html">{t.footerAbout}</a>
        <a href="/privacy.html">{t.footerPrivacy}</a>
        <a href="/contact.html">{t.footerContact}</a>
        <a href="/blog.html">{t.footerBlog}</a>
      </div>
      <span className="site-footer__rights">{t.footerText}</span>
    </footer>
  );
}
