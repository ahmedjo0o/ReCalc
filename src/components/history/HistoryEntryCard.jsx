import { useState } from 'react';
import Card from '../ui/Card.jsx';
import HistoryDetailsModal from './HistoryDetailsModal.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCurrency } from '../../context/CurrencyContext.jsx';

function formatWhen(createdAt) {
  if (!createdAt) return '';
  if (typeof createdAt.toDate === 'function') return createdAt.toDate().toLocaleString();
  try {
    return new Date(createdAt).toLocaleString();
  } catch {
    return String(createdAt);
  }
}

export default function HistoryEntryCard({ item, onDelete }) {
  const { t } = useLanguage();
  const { money } = useCurrency();
  const [showDetails, setShowDetails] = useState(false);
  const total = money(item.totalOrder ?? item.total ?? 0);
  const subTotal = money(item.subTotal ?? item.subtotal ?? 0);

  function handleDelete() {
    if (confirm(t.alertConfirmDeleteOne)) {
      onDelete(item);
    }
  }

  return (
    <Card header={formatWhen(item.createdAt)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
        <span>{t.totalToPay}:</span>
        <span>{total}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{t.subTotal}</span>
        <span>{subTotal}</span>
      </div>
      {(item.discount || item.discount === 0) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
          <span>{t.discount.replace(/\s*\(.*\)/, '')}</span>
          <span>{money(item.discount)}</span>
        </div>
      )}

      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', margin: '8px 0' }} />

      {(item.totals || []).map((p, i) => (
        <div key={i} style={{ fontSize: 13, marginBottom: 2 }}>
          <strong>{p.name}:</strong> {money(p.sum)}
        </div>
      ))}

      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDetails(true)}>
          {t.details}
        </button>
        <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>
          {t.deleteButton}
        </button>
      </div>

      {showDetails && <HistoryDetailsModal item={item} onClose={() => setShowDetails(false)} />}
    </Card>
  );
}
