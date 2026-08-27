import { useRef } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { exportCardsAsImage } from '../../lib/exportImage.js';

export default function ResultStep({ results, onBack, onStartAgain }) {
  const { t, language } = useLanguage();
  const cardRefs = useRef([]);
  cardRefs.current = [];

  function registerCard(el) {
    if (el) cardRefs.current.push(el);
  }

  function shareOne(idx) {
    const node = cardRefs.current[idx];
    if (!node) return;
    exportCardsAsImage(
      [node],
      'recalc-bill.png',
      'Your Bill',
      'Individual Bill Breakdown',
      new Date().toLocaleDateString(language === 'ar' ? 'ar' : 'en'),
    );
  }

  function shareAll() {
    if (!cardRefs.current.length) return;
    exportCardsAsImage(
      cardRefs.current,
      'recalc-full-results.png',
      'Receipt Results',
      'Here is the full receipt breakdown',
      new Date().toLocaleDateString(language === 'ar' ? 'ar' : 'en'),
    );
  }

  return (
    <div className="step">
      <h2 className="page-title">{t.resultsTitle}</h2>

      <div className="cards-grid" style={{ marginBottom: 10 }}>
        {results.map((r, i) => (
          <Card key={i} header={r.name} ref={registerCard}>
            <div>{t.order}: {Number(r.sum || 0).toFixed(2)}</div>
            <div>{t.vat}: {Number(r.vatShare || 0).toFixed(2)}</div>
            <div>{t.discount.replace(/\s*\(.*\)/, '')} {Number(r.discountShare || 0).toFixed(2)}</div>
            {r.tipShare ? <div>{t.tipShare}: {Number(r.tipShare || 0).toFixed(2)}</div> : null}
            <div style={{ marginTop: 6 }}>
              <strong>{t.totalToPay}: {Number(r.totalPay || 0).toFixed(2)}</strong>
            </div>
            {r.items && r.items.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                <strong>{t.details}</strong>
                {r.items.map((it, idx) => (
                  <div key={idx}>{it.label}: {Number(it.price || 0).toFixed(2)}</div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <button type="button" className="btn btn-ghost btn-sm share-button" onClick={() => shareOne(i)}>
                {t.shareResultButton}
              </button>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" onClick={onBack}>{t.backButton}</Button>
        <Button variant="primary" onClick={onStartAgain}>{t.startAgainButton}</Button>
        <Button variant="ghost" onClick={shareAll}>{t.shareResultButton} ({t.resultsTitle})</Button>
      </div>
    </div>
  );
}
