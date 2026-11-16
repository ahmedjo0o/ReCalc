import { useState } from 'react';
import Button from '../ui/Button.jsx';
import ResultCardsGrid from './ResultCardsGrid.jsx';
import SettleUp from './SettleUp.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { setHistorySettlement } from '../../lib/firestoreService.js';

export default function ResultStep({ results, historyId, onBack, onStartAgain }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [settlement, setSettlement] = useState(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const canSave = !!(user && historyId);

  // Signed-in users get it saved on their history record as they tick; for a
  // guest it lives only on this screen.
  function handleSettlement(next) {
    setSettlement(next);
    if (!canSave) return;
    setHistorySettlement(user.uid, historyId, next)
      .then(() => setSaveFailed(false))
      .catch((err) => {
        console.warn('Could not save settlement:', err);
        setSaveFailed(true);
      });
  }

  return (
    <div className="step">
      <h2 className="page-title">{t.resultsTitle}</h2>

      <ResultCardsGrid results={results} />

      <SettleUp
        results={results}
        value={settlement}
        onChange={handleSettlement}
        note={saveFailed ? t.settleSaveFailed : canSave ? t.settleSavedNote : t.settleGuestNote}
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <Button variant="secondary" onClick={onBack}>{t.backButton}</Button>
        <Button variant="primary" onClick={onStartAgain}>{t.startAgainButton}</Button>
      </div>
    </div>
  );
}
