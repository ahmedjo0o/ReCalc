import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMoney } from '../../context/CurrencyContext.jsx';
import { listMySessions, deleteSession } from '../../lib/sessionService.js';

// The host's shared bills that are still within their 24 hours, so closing
// the bill page no longer means hunting for the link.
export default function SharedBillsCard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [bills, setBills] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setBills(await listMySessions(user.uid));
      setError('');
    } catch (err) {
      console.error('Could not load shared bills:', err);
      setBills([]);
      setError(t.loadFailedError);
    }
  }, [user.uid, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(bill) {
    if (!confirm(t.sharedBillDeleteConfirm)) return;
    try {
      await deleteSession(bill.id);
      await load();
    } catch (err) {
      console.error('Could not delete shared bill:', err);
      setError(t.sharedBillError);
    }
  }

  const when = (ts) =>
    ts && ts.toMillis
      ? new Date(ts.toMillis()).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })
      : '';

  return (
    <Card header={t.mySharedBillsTitle}>
      {bills === null && <p>{t.loadingText}</p>}
      {error && <p className="error-text">{error}</p>}
      {bills && bills.length === 0 && !error && <p className="muted">{t.noSharedBills}</p>}
      {bills && bills.length > 0 && (
        <ul className="rows">
          {bills.map((bill) => (
            <li key={bill.id} className="row">
              <div className="row__main">
                <div className="row__title">
                  {formatMoney(bill.totalOrder, bill.currency)}
                  <span className={`chip ${bill.status === 'done' ? 'chip--ok' : 'chip--open'}`}>
                    {bill.status === 'done' ? t.sharedBillStatusDone : t.sharedBillStatusOpen}
                  </span>
                </div>
                <div className="row__sub">
                  {t.sharedBillSummary.replace('{items}', (bill.items || []).length).replace('{people}', (bill.people || []).length)}
                </div>
                <div className="row__sub">{t.sharedBillExpiresShort.replace('{when}', when(bill.expiresAt))}</div>
              </div>
              <div className="row__actions">
                <Link to={`/bill?id=${bill.id}`} className="btn btn-primary btn-sm">{t.openButton}</Link>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(bill)}>{t.deleteButton}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
