import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import { Field, TextInput } from '../components/ui/Field.jsx';
import ResultCardsGrid from '../components/calculator/ResultCardsGrid.jsx';
import SettleUp from '../components/calculator/SettleUp.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { formatMoney } from '../context/CurrencyContext.jsx';
import { callCalculateBill } from '../lib/api.js';
import { mapServerErrorMessage } from '../lib/errors.js';
import { attachTipToHistory, setHistorySettlement } from '../lib/firestoreService.js';
import {
  subscribeSession,
  joinSession,
  setClaim,
  claimForEveryone,
  saveSessionResults,
  reopenSession,
  setSessionSettlement,
  MAX_NAME_LENGTH,
} from '../lib/sessionService.js';

const nameKey = (id) => `recalc-bill-name-${id}`;

function readSavedName(id) {
  try {
    return localStorage.getItem(nameKey(id)) || '';
  } catch {
    return '';
  }
}

// Link, copy, WhatsApp and QR code — shown to the host only.
function ShareBox({ url, t, expiresLabel }) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState('');

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (older browsers / insecure context): the link is
      // still selectable in the box above.
    }
  }

  async function toggleQr() {
    if (qr) {
      setQr('');
      return;
    }
    const { default: QRCode } = await import('qrcode');
    setQr(await QRCode.toDataURL(url, { width: 220, margin: 1 }));
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${t.sharedBillInviteText} ${url}`)}`;

  return (
    <div className="card bill-share">
      <p style={{ margin: '0 0 10px' }}>{t.sharedBillOwnerHint}</p>
      <TextInput readOnly value={url} onFocus={(e) => e.target.select()} aria-label={t.copyLinkButton} />
      <div className="bill-share__actions">
        <Button variant="primary" size="sm" onClick={copy}>{copied ? t.linkCopied : t.copyLinkButton}</Button>
        <a className="btn btn-secondary btn-sm" href={whatsapp} target="_blank" rel="noreferrer">{t.whatsappShareButton}</a>
        <Button variant="secondary" size="sm" onClick={toggleQr}>{qr ? t.hideQrButton : t.showQrButton}</Button>
      </div>
      {qr && <img className="bill-share__qr" src={qr} alt="QR" width="220" height="220" />}
      {expiresLabel && <p className="bill-expiry">{t.sharedBillExpiresAt.replace('{when}', expiresLabel)}</p>}
    </div>
  );
}

function JoinForm({ people, onPick, t }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const clean = name.trim().slice(0, MAX_NAME_LENGTH);
    if (!clean) return;
    setBusy(true);
    try {
      await onPick(clean, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 460, margin: '0 auto' }}>
      <div className="card__header">{t.whoAreYouTitle}</div>
      {people.length > 0 && (
        <div className="bill-people-pick">
          {people.map((p) => (
            <button key={p} type="button" className="btn btn-secondary btn-sm" onClick={() => onPick(p, false)}>{p}</button>
          ))}
        </div>
      )}
      <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <TextInput placeholder={t.addYourNamePlaceholder} value={name} maxLength={MAX_NAME_LENGTH} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" variant="primary" size="sm" loading={busy}>{t.joinButton}</Button>
      </form>
    </div>
  );
}

export default function BillPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const id = params.get('id') || '';

  const [session, setSession] = useState(undefined); // undefined = loading, null = not found
  const [loadFailed, setLoadFailed] = useState(false);
  const [expired, setExpired] = useState(false);
  const [myName, setMyName] = useState(() => readSavedName(id));
  const [tip, setTip] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return undefined;
    return subscribeSession(
      id,
      (data) => {
        setLoadFailed(false);
        setSession(data);
      },
      (err) => {
        console.error('Could not open shared bill:', err);
        // The rules refuse reads once a bill has expired.
        if (err && err.code === 'permission-denied') setExpired(true);
        else setLoadFailed(true);
      },
    );
  }, [id]);

  const items = useMemo(() => (session && session.items) || [], [session]);
  const people = useMemo(() => (session && session.people) || [], [session]);
  const claims = useMemo(() => (session && session.claims) || {}, [session]);
  const claimersOf = (idx) => (claims[idx] || []).filter((n) => people.includes(n));

  const isOwner = !!(user && session && user.uid === session.ownerUid);
  const isDone = !!session && session.status === 'done';
  const unclaimed = items.map((_, i) => i).filter((i) => claimersOf(i).length === 0);

  const expiresAtMs = session && session.expiresAt && session.expiresAt.toMillis ? session.expiresAt.toMillis() : null;
  const expiresLabel = expiresAtMs
    ? new Date(expiresAtMs).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  // If the page is left open, switch to the expired screen at the moment the
  // link runs out instead of waiting for the next failed tap.
  useEffect(() => {
    if (!expiresAtMs) return undefined;
    const msLeft = Math.max(0, expiresAtMs - Date.now());
    const timer = setTimeout(() => setExpired(true), Math.min(msLeft, 2147483647));
    return () => clearTimeout(timer);
  }, [expiresAtMs]);

  function subtotalOf(name) {
    return items.reduce((sum, it, i) => {
      const who = claimersOf(i);
      return who.includes(name) ? sum + it.price / who.length : sum;
    }, 0);
  }

  async function pickName(name, isNew) {
    setError('');
    try {
      if (isNew && !people.includes(name)) await joinSession(id, name);
      try {
        localStorage.setItem(nameKey(id), name);
      } catch {
        // Private mode: the name just won't be remembered after a refresh.
      }
      setMyName(name);
    } catch (err) {
      console.error('Could not join shared bill:', err);
      setError(t.sharedBillError);
    }
  }

  function changeName() {
    try {
      localStorage.removeItem(nameKey(id));
    } catch {
      // ignore
    }
    setMyName('');
  }

  async function toggle(idx) {
    if (isDone || !myName) return;
    setError('');
    try {
      await setClaim(id, idx, myName, !claimersOf(idx).includes(myName));
    } catch (err) {
      console.error('Could not update item:', err);
      setError(t.sharedBillError);
    }
  }

  async function splitRemaining() {
    setError('');
    try {
      await claimForEveryone(id, unclaimed, people);
    } catch (err) {
      console.error('Could not split remaining items:', err);
      setError(t.sharedBillError);
    }
  }

  async function calculate() {
    const tipNum = tip === '' ? 0 : Number(tip);
    if (!Number.isFinite(tipNum) || tipNum < 0) {
      setError(t.tipError);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const totals = people.map((name) => ({ name, items: [] }));
      items.forEach((it, i) => {
        const who = claimersOf(i);
        who.forEach((name) => {
          totals[people.indexOf(name)].items.push({
            label: who.length > 1 ? `${it.label} (÷${who.length})` : it.label,
            price: it.price / who.length,
          });
        });
      });
      const paying = totals.filter((p) => p.items.length > 0);

      const response = await callCalculateBill({
        totalOrder: session.totalOrder,
        subTotal: session.subTotal,
        discount: session.discount,
        totals: paying,
        localeLang: language,
        source: 'scan',
      });
      const { results, historyId } = response.data;
      const perPersonTip = paying.length ? tipNum / paying.length : 0;
      const merged = results.map((r) => ({
        ...r,
        tipShare: perPersonTip,
        totalPay: Number((r.totalPay + perPersonTip).toFixed(2)),
      }));
      if (historyId && tipNum) {
        attachTipToHistory(user.uid, historyId, tipNum).catch((err) => console.warn('Could not attach tip:', err));
      }
      await saveSessionResults(id, merged, tipNum, historyId);
    } catch (err) {
      console.error('Shared bill calculation failed:', err);
      setError(mapServerErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  // Host only. Everyone on the link sees the ticks live; the copy on the
  // host's history record is what remains after the link expires.
  async function changeSettlement(next) {
    setError('');
    try {
      await setSessionSettlement(id, next);
      if (session.historyId && user) {
        setHistorySettlement(user.uid, session.historyId, next).catch((err) => console.warn('Could not copy settlement to history:', err));
      }
    } catch (err) {
      console.error('Could not save settlement:', err);
      setError(t.sharedBillError);
    }
  }

  async function reopen() {
    setError('');
    try {
      await reopenSession(id);
    } catch (err) {
      console.error('Could not reopen shared bill:', err);
      setError(t.sharedBillError);
    }
  }

  // ---------- Render ----------

  if (expired) {
    return (
      <main style={{ textAlign: 'center' }}>
        <h1 className="page-title">{t.sharedBillTitle}</h1>
        <p>{t.sharedBillExpired}</p>
        <Link to="/" className="btn btn-primary">{t.backToStart}</Link>
      </main>
    );
  }

  if (!id || session === null) {
    return (
      <main style={{ textAlign: 'center' }}>
        <h1 className="page-title">{t.sharedBillTitle}</h1>
        <p>{t.sharedBillNotFound}</p>
        <Link to="/" className="btn btn-primary">{t.backToStart}</Link>
      </main>
    );
  }

  if (session === undefined) {
    return (
      <main style={{ textAlign: 'center' }}>
        <h1 className="page-title">{t.sharedBillTitle}</h1>
        <p className={loadFailed ? 'error-text' : undefined}>{loadFailed ? t.sharedBillError : t.loadingText}</p>
      </main>
    );
  }

  const shareUrl = `${window.location.origin}/bill/?id=${id}`;
  // Everyone on a shared bill sees the host's currency.
  const fm = (n) => formatMoney(n, session.currency);

  return (
    <main className="bill">
      <h1 className="page-title">{t.sharedBillTitle}</h1>
      {session.ownerName && <p className="page-subtitle">{t.sharedBillBy.replace('{name}', session.ownerName)}</p>}

      {isOwner && !isDone && <ShareBox url={shareUrl} t={t} expiresLabel={expiresLabel} />}
      {!isOwner && expiresLabel && <p className="bill-expiry">{t.sharedBillExpiresAt.replace('{when}', expiresLabel)}</p>}

      {!myName ? (
        <JoinForm people={people} onPick={pickName} t={t} />
      ) : isDone ? (
        <>
          <p style={{ textAlign: 'center' }}>{t.sharedBillDoneHint}</p>
          <ResultCardsGrid results={session.results || []} currency={session.currency || ''} />
          <SettleUp
            results={session.results || []}
            value={session.settlement || null}
            onChange={changeSettlement}
            readOnly={!isOwner}
            currency={session.currency || ''}
            note={isOwner ? t.settleSharedNote : ''}
          />
          {isOwner && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button variant="secondary" onClick={reopen}>{t.reopenButton}</Button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="bill-hint">
            {t.tapItemsHint}{' '}
            <button type="button" className="bill-linkbtn" onClick={changeName}>{t.changeNameButton.replace('{name}', myName)}</button>
          </p>

          <ul className="bill-items">
            {items.map((it, i) => {
              const who = claimersOf(i);
              const mine = who.includes(myName);
              return (
                <li key={i}>
                  <button type="button" className={`bill-item${mine ? ' is-mine' : ''}`} aria-pressed={mine} onClick={() => toggle(i)}>
                    <span className="bill-item__check" aria-hidden="true">{mine ? '✓' : ''}</span>
                    <span className="bill-item__main">
                      <span className="bill-item__label">{it.label}</span>
                      <span className="bill-item__who">
                        {who.length === 0 ? (
                          <span className="bill-item__nobody">{t.nobodyYet}</span>
                        ) : (
                          who.map((n, k) => (
                            <span key={n}>
                              {k > 0 && (language === 'ar' ? '، ' : ', ')}
                              <strong className="bill-item__claimer">{n === myName ? `${n} ${t.youLabel}` : n}</strong>
                            </span>
                          ))
                        )}
                      </span>
                    </span>
                    <span className="bill-item__price">{fm(it.price)}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className={`sum-status ${unclaimed.length ? 'sum-status--warn' : 'sum-status--ok'}`}>
            <span className="sum-status__icon">{unclaimed.length ? '⚠' : '✓'}</span>
            <div>
              <div className="sum-status__title">
                {unclaimed.length ? t.unclaimedCount.replace('{n}', unclaimed.length) : t.allClaimed}
              </div>
              <div className="sum-status__detail">{t.yourSubtotal.replace('{sum}', fm(subtotalOf(myName)))}</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card__header">{t.sharedBillPeopleTitle}</div>
            {people.map((p) => (
              <div key={p} className="bill-person">
                <span>{p === myName ? `${p} ${t.youLabel}` : p}</span>
                <span>{fm(subtotalOf(p))}</span>
              </div>
            ))}
          </div>

          {isOwner ? (
            <div style={{ marginTop: 16 }}>
              {unclaimed.length > 0 && people.length > 0 && (
                <Button variant="secondary" size="sm" onClick={splitRemaining}>{t.splitRemainingButton}</Button>
              )}
              <Field label={t.tip}>
                <TextInput type="number" step="0.01" min="0" value={tip} onChange={(e) => setTip(e.target.value)} />
              </Field>
              <Button variant="primary" loading={busy} disabled={unclaimed.length > 0} onClick={calculate}>{t.calculateButton}</Button>
            </div>
          ) : (
            <p className="bill-hint" style={{ marginTop: 16 }}>{t.waitingForHost}</p>
          )}
        </>
      )}

      <span className="error-text" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>{error}</span>
    </main>
  );
}
