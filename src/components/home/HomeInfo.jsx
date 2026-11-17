import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { homeContent } from '../../i18n/homeContent.js';

// What reCalc is, how it works, and an FAQ, shown under the calculator on the
// start screen. Useful to first-time visitors, and gives the page real text
// for search engines and ad reviewers instead of just a calculator.
export default function HomeInfo() {
  const { language } = useLanguage();
  const c = homeContent[language] || homeContent.en;

  return (
    <section className="home-info" aria-labelledby="home-info-title">
      <h2 id="home-info-title" className="home-info__title">{c.title}</h2>
      <p className="home-info__intro">{c.intro}</p>

      <h3 className="home-info__h3">{c.howTitle}</h3>
      <ol className="home-info__how">
        {c.how.map((s, i) => (
          <li key={s.title}>
            <span className="home-info__num" aria-hidden="true">{i + 1}</span>
            <div>
              <strong>{s.title}</strong>
              <p>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <h3 className="home-info__h3">{c.featuresTitle}</h3>
      <ul className="home-info__features">
        {c.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <h3 className="home-info__h3">{c.faqTitle}</h3>
      <div className="home-info__faq">
        {c.faq.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>

      <p style={{ textAlign: 'center', marginTop: 18 }}>
        <Link to="/how-to-use">{language === 'ar' ? 'دليل الاستخدام خطوة بخطوة ←' : 'Step-by-step guide →'}</Link>
      </p>
    </section>
  );
}
