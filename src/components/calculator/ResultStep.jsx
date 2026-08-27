import { useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import SharePreviewModal from './SharePreviewModal.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { renderCardsToDataUrl } from '../../lib/exportImage.js';

export default function ResultStep({ results, onBack, onStartAgain }) {
  const { t, language } = useLanguage();
  const cardRefs = useRef([]);
  cardRefs.current = [];
  const [preview, setPreview] = useState(null); // { dataUrl, filename }
  const [rendering, setRendering] = useState(false);

  function registerCard(el) {
    if (el) cardRefs.current.push(el);
  }

  async function renderPreview(nodes, filename) {
    if (!nodes.length) return;
    setRendering(true);
    try {
      const dataUrl = await renderCardsToDataUrl(nodes, new Date().toLocaleDateString(language === 'ar' ? 'ar' : 'en'));
      setPreview({ dataUrl, filename });
    } catch (err) {
      console.error('Could not render share image:', err);
    } finally {
      setRendering(false);
    }
  }

  function shareOne(idx) {
    const node = cardRefs.current[idx];
    if (node) renderPreview([node], 'recalc-bill.png');
  }

  function shareAll() {
    renderPreview(cardRefs.current, 'recalc-full-results.png');
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
        <Button variant="ghost" loading={rendering} onClick={shareAll}>
          {t.shareResultButton} ({t.resultsTitle})
        </Button>
      </div>

      {preview && (
        <SharePreviewModal dataUrl={preview.dataUrl} filename={preview.filename} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}
