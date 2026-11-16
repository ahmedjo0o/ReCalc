import { useState } from 'react';
import Card from '../ui/Card.jsx';
import { Field, Select, TextInput } from '../ui/Field.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { CUSTOM, billTotal, checkPayers, getTransfers } from '../../lib/settlement.js';

// "Who paid, and who pays whom back."
//
// Either one person paid the whole bill, or (Custom) several people each paid
// part of it and type in how much. Either way the result is a list of
// repayments that can be ticked off as they happen. See lib/settlement.js for
// the stored shape and the arithmetic.
//
// This component only shows and edits the value. Where it is stored (memory
// for a guest, the history record, or the shared bill) is up to the caller,
// which gets every change through onChange. With readOnly it just displays.

const sameAmounts = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => Number(v) === Number(b[i]));

function draftFrom(value, count) {
  const payers = value && value.paidBy === CUSTOM && Array.isArray(value.payers) ? value.payers : [];
  return Array.from({ length: count }, (_, i) => {
    const amount = Number(payers[i]) || 0;
    return { on: amount > 0, amount: amount > 0 ? String(amount) : '' };
  });
}

export default function SettleUp({ results, value, onChange, readOnly = false, currency, note }) {
  const { t } = useLanguage();
  const { money } = useCurrency();
  const m = (n) => money(n, currency);

  const people = results || [];
  const isCustom = !!value && value.paidBy === CUSTOM;
  const single = !isCustom && value && Number.isInteger(value.paidBy) && people[value.paidBy] ? value.paidBy : null;

  // What is being typed for "several people paid". Sent to the caller when a
  // box is ticked or an amount field is left, not on every keystroke.
  const [draft, setDraft] = useState(() => draftFrom(value, people.length));

  if (people.length < 2) return null;
  if (readOnly && !isCustom && single === null) return null;

  const total = billTotal(people);
  const draftPayers = draft.map((d) => (d.on ? Math.max(0, Number(d.amount) || 0) : 0));
  // A viewer sees what was saved; the editor sees what they are typing.
  const payers = readOnly ? (value?.payers || []) : draftPayers;
  const entered = isCustom ? checkPayers(people, payers) : null;

  // Ticks belong to one particular set of amounts: if the amounts on screen
  // differ from the saved ones, no repayment counts as done yet.
  const settledForScreen = isCustom && sameAmounts(value.payers, payers) ? value.settled || [] : [];
  const transfers = isCustom
    ? getTransfers(people, { paidBy: CUSTOM, payers, settled: settledForScreen })
    : getTransfers(people, value);

  const toCollect = transfers ? transfers.reduce((s, x) => s + x.amount, 0) : 0;
  const collected = transfers ? transfers.filter((x) => x.done).reduce((s, x) => s + x.amount, 0) : 0;
  const allDone = !!transfers && transfers.length > 0 && transfers.every((x) => x.done);

  function chooseMode(raw) {
    if (raw === 'custom') {
      const fresh = draftFrom(null, people.length);
      setDraft(fresh);
      onChange({ paidBy: CUSTOM, paid: [], payers: fresh.map(() => 0), settled: [] });
    } else {
      // Changing who paid starts the ticks again.
      onChange({ paidBy: raw === '' ? null : Number(raw), paid: [], payers: [], settled: [] });
    }
  }

  function commit(nextDraft) {
    const next = nextDraft.map((d) => (d.on ? Math.max(0, Number(d.amount) || 0) : 0));
    if (sameAmounts(value?.payers, next)) return;
    // New amounts mean new repayments, so earlier ticks no longer apply.
    onChange({ paidBy: CUSTOM, paid: [], payers: next, settled: [] });
  }

  function togglePayer(i) {
    const next = draft.map((d, k) => (k === i ? { on: !d.on, amount: d.on ? '' : d.amount } : d));
    setDraft(next);
    commit(next);
  }

  function typeAmount(i, text) {
    setDraft(draft.map((d, k) => (k === i ? { ...d, amount: text } : d)));
  }

  function toggleTransfer(transfer) {
    if (isCustom) {
      const next = transfer.done ? settledForScreen.filter((k) => k !== transfer.key) : [...settledForScreen, transfer.key];
      onChange({ paidBy: CUSTOM, paid: [], payers: draftPayers, settled: next });
    } else {
      const paid = Array.isArray(value.paid) ? value.paid : [];
      const next = transfer.done ? paid.filter((i) => i !== transfer.from) : [...paid, transfer.from];
      onChange({ paidBy: single, paid: next, payers: [], settled: [] });
    }
  }

  const selectValue = isCustom ? 'custom' : single === null ? '' : String(single);

  return (
    <Card header={t.settleTitle} className="settle">
      {!readOnly && (
        <Field label={t.whoPaidLabel}>
          <Select value={selectValue} onChange={(e) => chooseMode(e.target.value)}>
            <option value="">{t.choosePersonPlaceholder}</option>
            {people.map((p, i) => (
              <option key={i} value={String(i)}>{p.name}</option>
            ))}
            <option value="custom">{t.settleCustomOption}</option>
          </Select>
        </Field>
      )}

      {/* ---- One person paid ---- */}
      {single !== null && (
        <p className="settle__lead">{t.settlePaidBy.replace('{name}', people[single].name).replace('{amount}', m(total))}</p>
      )}

      {/* ---- Several people paid: who, and how much each ---- */}
      {isCustom && !readOnly && (
        <>
          <p className="muted" style={{ margin: '0 0 8px' }}>{t.settleCustomHint.replace('{total}', m(total))}</p>
          <ul className="rows">
            {people.map((p, i) => (
              <li key={i} className={`row settle__payer${draft[i]?.on ? ' is-on' : ''}`}>
                <label className="settle__check">
                  <input type="checkbox" checked={!!draft[i]?.on} onChange={() => togglePayer(i)} />
                  <span><strong>{p.name}</strong></span>
                </label>
                {draft[i]?.on && (
                  <TextInput
                    className="settle__paid-input"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder={t.settleAmountPlaceholder}
                    aria-label={`${t.settleAmountPlaceholder}: ${p.name}`}
                    value={draft[i].amount}
                    onChange={(e) => typeAmount(i, e.target.value)}
                    onBlur={() => commit(draft)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.target.blur();
                    }}
                  />
                )}
              </li>
            ))}
          </ul>

          <div className={`sum-status ${entered.ok ? 'sum-status--ok' : entered.entered > 0 ? 'sum-status--warn' : 'sum-status--neutral'}`} style={{ margin: '12px 0' }}>
            <span className="sum-status__icon">{entered.ok ? '✓' : entered.entered > 0 ? '⚠' : 'Σ'}</span>
            <div>
              <div className="sum-status__title">
                {entered.ok
                  ? t.settleEnteredOk
                  : entered.diff < 0
                    ? t.settleEnteredUnder.replace('{amount}', m(-entered.diff))
                    : t.settleEnteredOver.replace('{amount}', m(entered.diff))}
              </div>
              <div className="sum-status__detail">{t.settleEnteredDetail.replace('{entered}', m(entered.entered)).replace('{total}', m(total))}</div>
            </div>
          </div>
        </>
      )}

      {isCustom && readOnly && (
        <p className="settle__lead">
          {people
            .map((p, i) => ({ name: p.name, amount: Number(payers[i]) || 0 }))
            .filter((p) => p.amount > 0)
            .map((p) => t.settlePersonPaid.replace('{name}', p.name).replace('{amount}', m(p.amount)))
            .join(' · ')}
        </p>
      )}

      {/* ---- Repayments ---- */}
      {transfers && transfers.length === 0 && <p className="muted">{t.settleNothingOwed}</p>}

      {transfers && transfers.length > 0 && (
        <>
          {isCustom && <div className="settle__subhead">{t.settleWhoPaysWhom}</div>}
          <ul className="rows">
            {transfers.map((x) => (
              <li key={x.key} className={`row settle__row${x.done ? ' is-paid' : ''}`}>
                <label className="settle__check">
                  <input type="checkbox" checked={x.done} disabled={readOnly} onChange={() => toggleTransfer(x)} />
                  <span>
                    <strong>{people[x.from].name}</strong>{' '}
                    {(x.done ? t.settlePaidBack : t.settleOwes).replace('{name}', people[x.to].name)}
                  </span>
                </label>
                <span className="settle__amount">{m(x.amount)}</span>
              </li>
            ))}
          </ul>

          <div className={`sum-status ${allDone ? 'sum-status--ok' : 'sum-status--neutral'}`} style={{ marginTop: 12 }}>
            <span className="sum-status__icon">{allDone ? '✓' : 'Σ'}</span>
            <div>
              <div className="sum-status__title">
                {allDone ? t.settleAllDone : t.settleProgress.replace('{collected}', m(collected)).replace('{total}', m(toCollect))}
              </div>
              {single !== null && (
                <div className="sum-status__detail">
                  {t.settleOwnShare.replace('{name}', people[single].name).replace('{amount}', m(people[single].totalPay))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {note && <p className="muted" style={{ fontSize: '0.82rem', margin: '10px 0 0' }}>{note}</p>}
    </Card>
  );
}
