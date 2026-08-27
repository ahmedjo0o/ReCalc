import { useState } from 'react';
import Button from '../components/ui/Button.jsx';
import HistoryEntryCard from '../components/history/HistoryEntryCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useHistory } from '../hooks/useHistory.js';

const ITEMS_PER_PAGE = 15;

export default function HistoryPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { items, loading, remove, clearAll } = useHistory(user?.uid, 1000);
  const [page, setPage] = useState(1);

  async function handleDeleteAll() {
    if (!confirm(t.alertConfirmDeleteAll)) return;
    await clearAll();
    alert(user?.uid ? t.alertHistoryDeleted : t.alertLocalHistoryDeleted);
    setPage(1);
  }

  const totalPages = items ? Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE)) : 1;
  const pageItems = items ? items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE) : [];

  return (
    <main>
      <h1 className="page-title">{t.manageHistoryTitle}</h1>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        {!loading && items.length > 0 && (
          <Button variant="danger" size="sm" onClick={handleDeleteAll}>{t.deleteAllHistoryButton}</Button>
        )}
      </div>

      {loading && <p style={{ textAlign: 'center' }}>{t.loadingText}</p>}
      {!loading && items.length === 0 && <p style={{ textAlign: 'center' }}>{t.noHistoryYet}</p>}

      <div className="cards-grid">
        {pageItems.map((item) => (
          <HistoryEntryCard key={item.id || item.createdAt} item={item} onDelete={(it) => remove(it).then(() => setPage(1))} />
        ))}
      </div>

      {!loading && totalPages > 1 && (
        <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            {t.backButton}
          </Button>
          <span style={{ fontSize: 14 }}>{t.pageLabel.replace('{current}', page).replace('{total}', totalPages)}</span>
          <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            {t.nextButton}
          </Button>
        </div>
      )}
    </main>
  );
}
