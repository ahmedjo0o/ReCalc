import Button from '../ui/Button.jsx';
import ResultCardsGrid from './ResultCardsGrid.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function ResultStep({ results, onBack, onStartAgain }) {
  const { t } = useLanguage();

  return (
    <div className="step">
      <h2 className="page-title">{t.resultsTitle}</h2>

      <ResultCardsGrid results={results} />

      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <Button variant="secondary" onClick={onBack}>{t.backButton}</Button>
        <Button variant="primary" onClick={onStartAgain}>{t.startAgainButton}</Button>
      </div>
    </div>
  );
}
