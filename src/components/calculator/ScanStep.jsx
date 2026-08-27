import { useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import { Field, TextInput } from '../ui/Field.jsx';
import ItemsSumStatus from './ItemsSumStatus.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useFieldError } from '../../hooks/useFieldError.js';
import { callExtractReceipt } from '../../lib/api.js';
import { downscaleImageDataUrl } from '../../lib/imageUtils.js';
import { validateBillTotals } from '../../lib/validation.js';
import { getServerErrorCode } from '../../lib/errors.js';

export default function ScanStep({ onBack, onContinue }) {
  const { t } = useLanguage();
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [scanError, showScanError] = useFieldError();

  const [showFields, setShowFields] = useState(false);
  const [totalOrder, setTotalOrder] = useState('');
  const [subTotal, setSubTotal] = useState('');
  const [discount, setDiscount] = useState('');
  const [items, setItems] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [mismatchError, showMismatchError] = useFieldError();

  async function handleFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        setImageDataUrl(await downscaleImageDataUrl(ev.target.result));
      } catch {
        setImageDataUrl(ev.target.result);
      }
      setShowFields(false);
    };
    reader.onerror = () => showScanError(t.ocrFailedError);
    reader.readAsDataURL(file);
  }

  function retake() {
    setImageDataUrl(null);
    setShowFields(false);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  }

  function populateFields({ totalOrder: to, subTotal: st, discount: d, items: it }) {
    setTotalOrder(to ? String(to) : '');
    setSubTotal(st ? String(st) : '');
    setDiscount(d ? String(d) : '');
    setItems((it || []).map((i) => ({ label: i.label || '', price: i.price ?? '' })));
    setShowFields(true);
  }

  async function extract() {
    if (!imageDataUrl) return;
    setExtracting(true);
    try {
      const commaIdx = imageDataUrl.indexOf(',');
      const meta = imageDataUrl.slice(5, commaIdx);
      const mimeType = meta.split(';')[0] || 'image/jpeg';
      const base64Data = imageDataUrl.slice(commaIdx + 1);
      const response = await callExtractReceipt({ imageBase64: base64Data, mimeType });
      const parsed = response.data || {};
      populateFields(parsed);
    } catch (err) {
      const msg = getServerErrorCode(err) === 'rateLimitExceeded' ? t.rateLimitError : t.ocrFailedError;
      showScanError(msg);
      populateFields({ totalOrder: '', subTotal: '', discount: '', items: [] });
    } finally {
      setExtracting(false);
    }
  }

  function skipToManualFields() {
    populateFields({ totalOrder: '', subTotal: '', discount: '', items: [] });
  }

  function addItem() {
    setItems((prev) => [...prev, { label: '', price: '' }]);
  }

  function updateItem(idx, key, value) {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const itemsSum = items.reduce((s, it) => s + (parseFloat(it.price) || 0), 0);

  function continueToNames() {
    const result = validateBillTotals({ totalOrder, subTotal, discount, tip: '0' }, t);
    if (result.error) {
      setFieldErrors({ [result.error.field]: result.error.message });
      return;
    }
    setFieldErrors({});

    const cleanItems = items
      .map((it) => ({ label: it.label.trim() || t.noLabel, price: parseFloat(it.price) || 0 }))
      .filter((it) => it.price !== 0);

    const sum = cleanItems.reduce((s, it) => s + it.price, 0);
    if (Math.abs(sum - result.value.subTotal) > 2) {
      showMismatchError(t.itemsMismatchError);
      return;
    }

    onContinue({ totalOrder: result.value.totalOrder, subTotal: result.value.subTotal, discount: result.value.discount, items: cleanItems });
  }

  return (
    <div className="step">
      <h2 className="page-title" style={{ fontSize: '1.2rem' }}>{t.scanStepTitle}</h2>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileSelected} />
      <input ref={uploadInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelected} />

      {!imageDataUrl && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button variant="primary" onClick={() => cameraInputRef.current?.click()}>{t.takePhotoButton}</Button>
          <Button variant="secondary" onClick={() => uploadInputRef.current?.click()}>{t.uploadPhotoButton}</Button>
        </div>
      )}

      <span className="error-text">{scanError}</span>

      {imageDataUrl && (
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <img src={imageDataUrl} alt="Receipt preview" style={{ maxWidth: '100%', maxHeight: 420, borderRadius: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 10 }}>
            <Button variant="primary" loading={extracting} onClick={extract}>{t.extractButton}</Button>
            <Button variant="secondary" onClick={retake}>{t.retakePhotoButton}</Button>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={skipToManualFields}>{t.scanManualFallbackButton}</button>
      </div>

      {showFields && (
        <div style={{ marginTop: 16 }}>
          <Field label={t.totalOrder} highlight error={fieldErrors.totalOrder}>
            <TextInput type="number" step="0.01" value={totalOrder} onChange={(e) => setTotalOrder(e.target.value)} />
          </Field>
          <Field label={t.subTotal} highlight error={fieldErrors.subTotal}>
            <TextInput type="number" step="0.01" value={subTotal} onChange={(e) => setSubTotal(e.target.value)} />
          </Field>
          <Field label={t.discount} error={fieldErrors.discount}>
            <TextInput type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </Field>

          <h3 style={{ marginTop: 16, fontSize: '1rem' }}>{t.scanItemsTitle}</h3>
          {items.length === 0 && <p style={{ fontSize: 13, color: '#666' }}>{t.noItemsFoundMessage}</p>}
          <div className="items-list">
            {items.map((it, idx) => (
              <div key={idx} className="item-row">
                <span className="item-row__index">{idx + 1}</span>
                <TextInput placeholder={t.itemNamePlaceholder} value={it.label} onChange={(e) => updateItem(idx, 'label', e.target.value)} />
                <TextInput type="number" step="0.01" placeholder={t.itemPricePlaceholder} value={it.price} onChange={(e) => updateItem(idx, 'price', e.target.value)} />
                <button type="button" className="btn btn-secondary btn-sm item-row__remove" onClick={() => removeItem(idx)}>{t.removeButton}</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={addItem}>{t.addItemButton}</button>

          <ItemsSumStatus itemsSum={itemsSum} subTotal={subTotal} />
          <span className="error-text">{mismatchError}</span>

          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={onBack}>{t.backToStart}</Button>
            <Button variant="primary" onClick={continueToNames}>{t.continueButton}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
