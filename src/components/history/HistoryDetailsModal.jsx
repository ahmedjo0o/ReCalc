import Modal from '../ui/Modal.jsx';
import ResultCardsGrid from '../calculator/ResultCardsGrid.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

function formatWhen(createdAt) {
  if (!createdAt) return '';
  if (typeof createdAt.toDate === 'function') return createdAt.toDate().toLocaleString();
  try {
    return new Date(createdAt).toLocaleString();
  } catch {
    return String(createdAt);
  }
}

// The stored totals never include tip (see attachTipToHistory) — merge it
// in the same way the live result screen does, from the raw `tip` amount.
function withTipMerged(item) {
  const totals = item.totals || [];
  if (!item.tip || !totals.length) return totals;
  const perPersonTip = item.tip / totals.length;
  return totals.map((p) => ({
    ...p,
    tipShare: perPersonTip,
    totalPay: Number((p.totalPay + perPersonTip).toFixed(2)),
  }));
}

export default function HistoryDetailsModal({ item, onClose }) {
  const { t } = useLanguage();
  return (
    <Modal title={formatWhen(item.createdAt) || t.details} onClose={onClose} className="modal--wide">
      <div style={{ marginTop: 10 }}>
        <ResultCardsGrid results={withTipMerged(item)} />
      </div>
    </Modal>
  );
}
