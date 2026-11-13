import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import { howToContent } from '../i18n/howTo.js';

function StepList({ steps, language, c }) {
  return (
    <ol className="howto-steps">
      {steps.map((s, i) => (
        <li key={s.image + i} className="howto-step">
          <div className="howto-step__body">
            <div className="howto-step__head">
              <span className="howto-step__num" aria-label={`${c.stepLabel} ${i + 1}`}>{i + 1}</span>
              <h3 className="howto-step__title">{s.title}</h3>
            </div>
            <p>{s.text}</p>
            {s.tip && <p className="howto-tip">💡 {s.tip}</p>}
          </div>
          {/* Screenshots are full-length captures of a phone screen, so the
              frame scrolls instead of stretching the page. */}
          <div className="howto-shot" tabIndex={0}>
            <img src={`/screenshots/how-to/${language}/${s.image}`} alt={`${c.screenshotAlt}: ${s.title}`} loading="lazy" />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function HowToPage() {
  const { language } = useLanguage();
  const c = howToContent[language] || howToContent.en;
  const [way, setWay] = useState('scan');

  return (
    <main className="howto">
      <h1 className="page-title">{c.title}</h1>
      <p className="howto-intro">{c.intro}</p>

      <section className="howto-start">
        <div>
          <h2 className="howto-h2">{c.startTitle}</h2>
          <p>{c.startText}</p>
        </div>
        <div className="howto-shot howto-shot--short">
          <img src={`/screenshots/how-to/${language}/method.png`} alt={`${c.screenshotAlt}: ${c.startTitle}`} />
        </div>
      </section>

      <div className="howto-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={way === 'scan'} className={`howto-tab${way === 'scan' ? ' is-active' : ''}`} onClick={() => setWay('scan')}>
          {c.scanTab}
        </button>
        <button type="button" role="tab" aria-selected={way === 'manual'} className={`howto-tab${way === 'manual' ? ' is-active' : ''}`} onClick={() => setWay('manual')}>
          {c.manualTab}
        </button>
      </div>

      {way === 'scan' ? (
        <section>
          <h2 className="howto-h2">{c.scanTitle}</h2>
          <p>{c.scanIntro}</p>
          <StepList steps={c.scanSteps} language={language} c={c} />
        </section>
      ) : (
        <section>
          <h2 className="howto-h2">{c.manualTitle}</h2>
          <p>{c.manualIntro}</p>
          <StepList steps={c.manualSteps} language={language} c={c} />
        </section>
      )}

      <section className="card howto-notes">
        <h2 className="howto-h2">{c.goodToKnowTitle}</h2>
        <ul>
          {c.goodToKnow.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link to="/" className="btn btn-primary">{c.startButton}</Link>
      </div>
    </main>
  );
}
