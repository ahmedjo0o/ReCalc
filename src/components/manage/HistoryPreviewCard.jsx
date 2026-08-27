import { Link } from 'react-router-dom';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import HistoryEntryCard from '../history/HistoryEntryCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useHistory } from '../../hooks/useHistory.js';

export default function HistoryPreviewCard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { items, loading, remove } = useHistory(user?.uid, 3);

  return (
    <Card header={t.recentHistoryTitle}>
      {loading && <p>{t.loadingText}</p>}
      {!loading && items.length === 0 && <p>{t.noHistoryYet}</p>}
      {!loading && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item) => (
            <HistoryEntryCard key={item.id || item.createdAt} item={item} onDelete={remove} />
          ))}
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <Link to="/history">
          <Button variant="primary" size="sm">{t.FullHistoryButton}</Button>
        </Link>
      </div>
    </Card>
  );
}
