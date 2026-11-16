import Card from '../ui/Card.jsx';
import { Field, Select } from '../ui/Field.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCurrency } from '../../context/CurrencyContext.jsx';

// "Who paid, and who has paid them back."
//
// One person settled the bill with the restaurant; everyone else owes that
// person their own total. `value` is { paidBy, paid }:
//   paidBy - position in `results` of the person who paid the bill (or null)
//   paid   - positions of the people who have already paid them back
// Positions rather than names, so two people called "Ali" stay separate.
//
// This component only shows and edits the value. Where it is stored (memory
// for a guest, the history record, or the shared bill) is up to the caller,
// which gets every change through onChange. With readOnly it just displays.
export default function SettleUp({ results, value, onChange, readOnly = false, currency, note }) {
  const { t } = useLanguage();
  const { money } = useCurrency();
  const m = (n) => money(n, currency);

  const people = results || [];
  const paidBy = value && Number.isInteger(value.paidBy) && people[value.paidBy] ? value.paidBy : null;
  const paid = value && Array.isArray(value.paid) ? value.paid : [];

  if (people.length < 2) return null;
  if (readOnly && paidBy === null) return null;

  const payer = paidBy === null ? null : people[paidBy];
  const others = people.map((p, i) => ({ ...p, index: i })).filter((p) => p.index !== paidBy);
  const billTotal = people.reduce((s, p) => s + Number(p.totalPay || 0), 0);
  const toCollect = others.reduce((s, p) => s + Number(p.totalPay || 0), 0);
  const collected = others.filter((p) => paid.includes(p.index)).reduce((s, p) => s + Number(p.totalPay || 0), 0);
  const allDone = others.length > 0 && others.every((p) => paid.includes(p.index));

  function choosePayer(raw) {
    const next = raw === '' ? null : Number(raw);
    // Changing who paid starts the ticks again: they meant "paid back to the
    // previous person".
    onChange({ paidBy: next, paid: [] });
  }

  function toggle(index) {
    const next = paid.includes(index) ? paid.filter((i) => i !== index) : [...paid, index];
    onChange({ paidBy, paid: next });
  }

  return (
    <Card header={t.settleTitle} className="settle">
      {!readOnly && (
        <Field label={t.whoPaidLabel}>
          <Select value={paidBy === null ? '' : String(paidBy)} onChange={(e) => choosePayer(e.target.value)}>
            <option value="">{t.choosePersonPlaceholder}</option>
            {people.map((p, i) => (
              <option key={i} value={String(i)}>{p.name}</option>
            ))}
          </Select>
        </Field>
      )}

      {payer && (
        <>
          <p className="settle__lead">
            {t.settlePaidBy.replace('{name}', payer.name).replace('{amount}', m(billTotal))}
          </p>

          <ul className="rows">
            {others.map((p) => {
              const done = paid.includes(p.index);
              return (
                <li key={p.index} className={`row settle__row${done ? ' is-paid' : ''}`}>
                  <label className="settle__check">
                    <input type="checkbox" checked={done} disabled={readOnly} onChange={() => toggle(p.index)} />
                    <span>
                      <strong>{p.name}</strong>{' '}
                      {(done ? t.settlePaidBack : t.settleOwes).replace('{name}', payer.name)}
                    </span>
                  </label>
                  <span className="settle__amount">{m(p.totalPay)}</span>
                </li>
              );
            })}
          </ul>

          <div className={`sum-status ${allDone ? 'sum-status--ok' : 'sum-status--neutral'}`} style={{ marginTop: 12 }}>
            <span className="sum-status__icon">{allDone ? '✓' : 'Σ'}</span>
            <div>
              <div className="sum-status__title">
                {allDone ? t.settleAllDone : t.settleProgress.replace('{collected}', m(collected)).replace('{total}', m(toCollect))}
              </div>
              <div className="sum-status__detail">
                {t.settleOwnShare.replace('{name}', payer.name).replace('{amount}', m(payer.totalPay))}
              </div>
            </div>
          </div>
        </>
      )}

      {note && <p className="muted" style={{ fontSize: '0.82rem', margin: '10px 0 0' }}>{note}</p>}
    </Card>
  );
}

// "2 of 3 paid" style summary for lists. Returns null when nobody is set as
// the payer.
export function settlementSummary(settlement, peopleCount) {
  if (!settlement || !Number.isInteger(settlement.paidBy)) return null;
  const owing = Math.max(0, peopleCount - 1);
  const paid = (settlement.paid || []).filter((i) => i !== settlement.paidBy).length;
  return { paid: Math.min(paid, owing), owing, done: owing > 0 && paid >= owing };
}
