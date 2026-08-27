import { useState } from 'react';
import Button from '../ui/Button.jsx';
import { Field, TextInput, Select } from '../ui/Field.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useFieldError } from '../../hooks/useFieldError.js';
import { validateBillTotals } from '../../lib/validation.js';

export default function AssignStep({ names, scannedReceipt, onBack, onCalculate, calculating, serverError }) {
  const { t } = useLanguage();
  const receipt = scannedReceipt || { totalOrder: '', subTotal: '', discount: '', items: [] };

  const [totalOrder, setTotalOrder] = useState(String(receipt.totalOrder ?? ''));
  const [subTotal, setSubTotal] = useState(String(receipt.subTotal ?? ''));
  const [discount, setDiscount] = useState(String(receipt.discount ?? ''));
  const [tip, setTip] = useState('');
  const [items, setItems] = useState(() =>
    (receipt.items && receipt.items.length ? receipt.items : [{ label: '', price: '' }]).map((it) => ({
      label: it.label || '',
      price: it.price ?? '',
      assignedTo: '',
    })),
  );
  const [fieldErrors, setFieldErrors] = useState({});
  const [unassignedError, showUnassignedError] = useFieldError();

  function updateItem(idx, key, value) {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, { label: '', price: '', assignedTo: '' }]);
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleCalculate() {
    const result = validateBillTotals({ totalOrder, subTotal, discount, tip }, t);
    if (result.error) {
      setFieldErrors({ [result.error.field]: result.error.message });
      return;
    }
    setFieldErrors({});

    const unassigned = items.some((it) => (parseFloat(it.price) || 0) !== 0 && !it.assignedTo);
    if (unassigned) {
      showUnassignedError(t.unassignedError);
      return;
    }

    const byName = {};
    names.forEach((n) => {
      byName[n] = { name: n, items: [] };
    });
    items.forEach((it) => {
      const price = parseFloat(it.price) || 0;
      if (!it.assignedTo || price === 0) return;
      if (!byName[it.assignedTo]) byName[it.assignedTo] = { name: it.assignedTo, items: [] };
      byName[it.assignedTo].items.push({ label: it.label.trim() || t.noLabel, price });
    });

    onCalculate({ ...result.value, totals: names.map((n) => byName[n]) });
  }

  return (
    <div className="step">
      <h2 className="page-title" style={{ fontSize: '1.2rem' }}>{t.assignStepTitle}</h2>
      <p className="page-subtitle">{t.assignStepSubtitle}</p>

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

      <div className="items-list" style={{ marginTop: 12 }}>
        {items.map((it, idx) => (
          <div key={idx} className="item-row">
            <span className="item-row__index">{idx + 1}</span>
            <TextInput placeholder={t.itemNamePlaceholder} value={it.label} onChange={(e) => updateItem(idx, 'label', e.target.value)} />
            <TextInput type="number" step="0.01" placeholder={t.itemPricePlaceholder} value={it.price} onChange={(e) => updateItem(idx, 'price', e.target.value)} />
            <Select value={it.assignedTo} onChange={(e) => updateItem(idx, 'assignedTo', e.target.value)}>
              <option value="">{t.choosePersonPlaceholder}</option>
              {names.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
            <button type="button" className="btn btn-secondary btn-sm item-row__remove" onClick={() => removeItem(idx)}>{t.removeButton}</button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={addItem}>{t.addItemButton}</button>

      <span className="error-text">{unassignedError || serverError}</span>

      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <Button variant="secondary" onClick={onBack}>{t.backButton}</Button>
        <Button variant="primary" loading={calculating} onClick={handleCalculate}>{t.calculateButton}</Button>
      </div>
    </div>
  );
}
