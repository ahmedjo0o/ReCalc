import Modal from '../ui/Modal.jsx';
import ResultCardsGrid from '../calculator/ResultCardsGrid.jsx';
import SettleUp from '../calculator/SettleUp.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { withTipMerged } from '../../lib/settlement.js';

function formatWhen(createdAt) {
  if (!createdAt) return '';
  if (typeof createdAt.toDate === 'function') return createdAt.toDate().toLocaleString();
  try {
    return new Date(createdAt).toLocaleString();
  } catch {
    return String(createdAt);
  }
}

export default function HistoryDetailsModal({ item, settlement, onSettlementChange, settleNote, onClose }) {
  const { t } = useLanguage();
  return (
    <Modal title={formatWhen(item.createdAt) || t.details} onClose={onClose} className="modal--wide">
      <div style={{ marginTop: 10 }}>
        <ResultCardsGrid results={withTipMerged(item)} />
        <SettleUp results={withTipMerged(item)} value={settlement} onChange={onSettlementChange} note={settleNote} />
      </div>
    </Modal>
  );
}
