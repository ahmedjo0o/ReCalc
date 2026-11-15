import { useRef, useState } from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import SharePreviewModal from './SharePreviewModal.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { renderCardsToDataUrl } from '../../lib/exportImage.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';

// The per-person result cards + share/export machinery, shared by the live
// calculator's ResultStep and the "Details" view on a saved history entry.
// `currency` overrides the viewer's own currency (a shared bill shows the
// host's); leave it undefined to use the signed-in user's.
export default function ResultCardsGrid({ results, showShareAll = true, currency }) {
  const { t, language } = useLanguage();
  const { money } = useCurrency();
  const m = (n) => money(n, currency);
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
    <>
      <div className="cards-grid" style={{ marginBottom: 10 }}>
        {results.map((r, i) => (
          <Card key={i} header={r.name} ref={registerCard}>
            <div>{t.order}: {m(r.sum)}</div>
            <div>{t.vat}: {m(r.vatShare)}</div>
            <div>{t.discount.replace(/\s*\(.*\)/, '')} {m(r.discountShare)}</div>
            {r.tipShare ? <div>{t.tipShare}: {m(r.tipShare)}</div> : null}
            <div style={{ marginTop: 6 }}>
              <strong>{t.totalToPay}: {m(r.totalPay)}</strong>
            </div>
            {r.items && r.items.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                <strong>{t.details}</strong>
                {r.items.map((it, idx) => (
                  <div key={idx}>{it.label}: {m(it.price)}</div>
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

      {showShareAll && (
        <Button variant="ghost" loading={rendering} onClick={shareAll}>
          {t.shareResultButton} ({t.resultsTitle})
        </Button>
      )}

      {preview && (
        <SharePreviewModal dataUrl={preview.dataUrl} filename={preview.filename} onClose={() => setPreview(null)} />
      )}
    </>
  );
}
