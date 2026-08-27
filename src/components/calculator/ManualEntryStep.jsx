import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import { Field, TextInput } from '../ui/Field.jsx';
import ItemsSumStatus from './ItemsSumStatus.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { validateBillTotals } from '../../lib/validation.js';

function emptyCards(names) {
  return names.map(() => ({ rows: [{ value: '', item: '' }] }));
}

export default function ManualEntryStep({ names, onBack, onCalculate, calculating, serverError }) {
  const { t } = useLanguage();
  const [totalOrder, setTotalOrder] = useState('');
  const [subTotal, setSubTotal] = useState('');
  const [discount, setDiscount] = useState('');
  const [tip, setTip] = useState('');
  const [cards, setCards] = useState(() => emptyCards(names));
  const [fieldErrors, setFieldErrors] = useState({});

  function personSubtotal(card) {
    return card.rows.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0);
  }

  // Live, client-side equivalent of the server's itemsMismatch check — lets
  // people see (and fix) a mismatch immediately instead of only finding out
  // after a round-trip to calculateBill.
  const itemsSum = cards.reduce((s, card) => s + personSubtotal(card), 0);
  const subTotalNum = parseFloat(subTotal);
  const hasSubTotal = subTotal !== '' && !isNaN(subTotalNum);
  const isMismatch = hasSubTotal && Math.abs(itemsSum - subTotalNum) > 2;

  function updateRow(personIdx, rowIdx, key, value) {
    setCards((prev) => {
      const next = [...prev];
      const rows = [...next[personIdx].rows];
      rows[rowIdx] = { ...rows[rowIdx], [key]: value };
      next[personIdx] = { rows };
      return next;
    });
  }

  function addRow(personIdx) {
    setCards((prev) => {
      const next = [...prev];
      next[personIdx] = { rows: [...next[personIdx].rows, { value: '', item: '' }] };
      return next;
    });
  }

  function removeRow(personIdx) {
    setCards((prev) => {
      const next = [...prev];
      if (next[personIdx].rows.length > 1) {
        next[personIdx] = { rows: next[personIdx].rows.slice(0, -1) };
      }
      return next;
    });
  }

  function handleCalculate() {
    const result = validateBillTotals({ totalOrder, subTotal, discount, tip }, t);
    if (result.error) {
      setFieldErrors({ [result.error.field]: result.error.message });
      return;
    }
    setFieldErrors({});

    // Belt-and-suspenders: the button is already disabled while mismatched,
    // but guard here too in case totalOrder/discount/tip changed since.
    if (isMismatch) return;

    const totals = names.map((name, i) => {
      const items = cards[i].rows
        .map((r) => ({
          label: r.item.trim() || t.noLabel,
          price: parseFloat(r.value) || 0,
        }))
        .filter((it) => it.price !== 0);
      return { name, items };
    });

    onCalculate({ ...result.value, totals });
  }

  return (
    <div className="step">
      <Field label={t.totalOrder} highlight error={fieldErrors.totalOrder}>
        <TextInput type="number" step="0.01" value={totalOrder} onChange={(e) => setTotalOrder(e.target.value)} />
      </Field>
      <Field label={t.subTotal} highlight error={fieldErrors.subTotal}>
        <TextInput type="number" step="0.01" value={subTotal} onChange={(e) => setSubTotal(e.target.value)} />
      </Field>
      <Field label={t.discount} error={fieldErrors.discount}>
        <TextInput type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
      </Field>
      <Field label={t.tip} error={fieldErrors.tip}>
        <TextInput type="number" step="0.01" value={tip} onChange={(e) => setTip(e.target.value)} />
      </Field>

      <div className="cards-grid" style={{ marginTop: 8 }}>
        {names.map((name, i) => (
          <Card key={i} header={name}>
            {cards[i].rows.map((row, rowIdx) => (
              <div key={rowIdx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.85rem', minWidth: 56 }}>{t.order} {rowIdx + 1}:</span>
                <TextInput
                  type="number"
                  placeholder="0.00"
                  value={row.value}
                  onChange={(e) => updateRow(i, rowIdx, 'value', e.target.value)}
                />
                <TextInput
                  type="text"
                  placeholder="Item (optional)"
                  value={row.item}
                  onChange={(e) => updateRow(i, rowIdx, 'item', e.target.value)}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => addRow(i)}>+</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeRow(i)}>-</button>
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
              {t.totalWithoutVAT}: {personSubtotal(cards[i]).toFixed(2)}
            </div>
          </Card>
        ))}
      </div>

      <ItemsSumStatus itemsSum={itemsSum} subTotal={subTotal} />
      <span className="error-text">{serverError}</span>

      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <Button variant="secondary" onClick={onBack}>{t.backButton}</Button>
        <Button variant="primary" loading={calculating} disabled={isMismatch} onClick={handleCalculate}>
          {t.calculateButton}
        </Button>
      </div>
    </div>
  );
}
