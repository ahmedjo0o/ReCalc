import Button from '../ui/Button.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function MethodChoiceStep({ onChoose }) {
  const { t } = useLanguage();
  return (
    <div className="step">
      <h2 className="page-title" style={{ fontSize: '1.2rem' }}>{t.chooseMethodTitle}</h2>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={() => onChoose('scan')}>{t.scanMethodButton}</Button>
        <Button variant="secondary" onClick={() => onChoose('manual')}>{t.manualMethodButton}</Button>
      </div>
    </div>
  );
}
