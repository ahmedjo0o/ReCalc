// receipt-scanner.js
// Self-contained module for the "Scan Receipt" flow:
//   step0 (choose method) -> scan-step (capture + OCR + edit) -> step1 (names)
//   -> assign-step (assign items to people) -> result
//
// This file does NOT touch the manual flow (step1 -> step2and3 -> result).
// It only reads/writes: window.appFlow, window.scannedReceipt, and calls
// window.finalizeCalculation() / window.validateBillTotals() from calculator.js.

window.appFlow = null;          // 'manual' | 'scan'
window.scannedReceipt = null;   // { totalOrder, subTotal, discount, items:[{label, price}] }
let scanImageDataUrl = null;
let scanItemRowCount = 0;
let assignItemRowCount = 0;

// ---------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------
window.chooseMethod = function (method) {
  window.appFlow = method;
  if (method === 'scan') {
    resetScanStepUI();
    showSection('step0', 'scan-step');
  } else {
    showSection('step0', 'step1');
  }
};

window.goBackToScanFromStep1 = function () {
  showSection('step1', 'scan-step');
};

// ---------------------------------------------------------------------
// Camera / image capture
// ---------------------------------------------------------------------
window.triggerCameraCapture = function () {
  const input = document.getElementById('scan-file-camera');
  if (!input) return;
  input.click();
};

window.triggerUploadCapture = function () {
  const input = document.getElementById('scan-file-upload');
  if (!input) return;
  input.click();
};

function handleScanFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    scanImageDataUrl = e.target.result;
    const img = document.getElementById('scan-preview-img');
    const wrapper = document.getElementById('scan-preview-wrapper');
    if (img) img.src = scanImageDataUrl;
    if (wrapper) wrapper.style.display = 'block';

    const captureButtons = document.getElementById('scan-capture-buttons');
    if (captureButtons) captureButtons.style.display = 'none';

    document.getElementById('scan-fields-wrapper').style.display = 'none';
  };
  reader.onerror = function () {
    showError('scan-error-message', translations[currentLanguage].ocrFailedError);
  };
  reader.readAsDataURL(file);
}

window.retakePhoto = function () {
  scanImageDataUrl = null;
  const wrapper = document.getElementById('scan-preview-wrapper');
  if (wrapper) wrapper.style.display = 'none';
  const captureButtons = document.getElementById('scan-capture-buttons');
  if (captureButtons) captureButtons.style.display = 'flex';
  document.getElementById('scan-fields-wrapper').style.display = 'none';
  document.getElementById('scan-file-camera').value = '';
  document.getElementById('scan-file-upload').value = '';
};

// ---------------------------------------------------------------------
// OCR extraction (Tesseract.js — runs fully client-side, nothing uploaded)
// ---------------------------------------------------------------------
window.extractReceiptData = async function () {
  if (!scanImageDataUrl) return;

  const loadingEl = document.getElementById('scan-loading');
  const errorEl = document.getElementById('scan-error-message');
  if (errorEl) errorEl.style.display = 'none';
  if (loadingEl) loadingEl.style.display = 'block';

  try {
    if (typeof Tesseract === 'undefined') {
      throw new Error('OCR engine not loaded');
    }
    const { data: { text } } = await Tesseract.recognize(scanImageDataUrl, 'eng');
    const parsed = parseReceiptText(text || '');
    populateScanFields(parsed);
  } catch (err) {
    console.warn('OCR extraction failed:', err);
    showError('scan-error-message', translations[currentLanguage].ocrFailedError);
    // Fall back to empty editable fields so the user can fill them in by hand.
    populateScanFields({ totalOrder: '', subTotal: '', discount: '', items: [] });
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }
};

// Skip OCR entirely and just show empty editable fields.
window.scanManualFallback = function () {
  populateScanFields({ totalOrder: '', subTotal: '', discount: '', items: [] });
};

// ---------------------------------------------------------------------
// Heuristic parsing of OCR text into { totalOrder, subTotal, discount, items }
// ---------------------------------------------------------------------
function parseReceiptText(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  // Matches a trailing money amount at the end of a line, e.g. "Sub Total 1,330.00"
  // or "FINAL TOTAL 1698.14" (no thousands separator).
  const priceLineRegex = /^(.*?)[\s:._-]*[\$€£]?\s*([\d,]+\.\d{2}|\d+)\s*$/;

  // Matches a "Qty  Description  UnitPrice  [LineTotal]" row, e.g.
  // "5.00 Small Mineral Water 20.00 100" -> qty=5, desc="Small Mineral Water", unitPrice=20.00
  const qtyItemRegex = /^(\d{1,3})(?:[.,]\d{1,2})?\s+(.+?)\s+([\d,]+[.,]\d{2})(?:\s+[\d,]+(?:[.,]\d{1,2})?)?\s*$/;

  const totalKeywords = ['grand total', 'total due', 'amount due', 'final total', 'total'];
  const subTotalKeywords = ['subtotal', 'sub total', 'sub-total'];
  const discountKeywords = ['discount', 'disc.', 'disc', 'coupon', 'promo'];
  const excludeKeywords = [
    'vat', 'tax', 'service', 'change', 'cash', 'card', 'visa', 'mastercard',
    'date', 'time', 'table', 'server', 'qty', 'quantity', 'receipt', 'invoice',
    'order #', 'order no', 'tel', 'phone', 'thank', 'balance', 'tip', 'm. ch', 'm.ch'
  ];

  let totalOrder = '';
  let subTotal = '';
  let discount = '';
  const items = [];

  const normalizeAmount = (raw) => {
    // Strip thousands separators, normalize decimal comma to dot.
    let v = raw.replace(/\s/g, '');
    if (/,\d{2}$/.test(v) && !/\.\d{2}$/.test(v)) {
      v = v.replace(/\./g, '').replace(',', '.');
    } else {
      v = v.replace(/,/g, '');
    }
    const num = parseFloat(v);
    return isNaN(num) ? null : num;
  };

  lines.forEach(line => {
    const lower = line.toLowerCase();

    // 1) Totals / subtotal / discount / excluded lines — classify using the
    //    simple trailing-amount match first, regardless of a Qty column.
    const simpleMatch = line.match(priceLineRegex);
    if (simpleMatch) {
      const amount = normalizeAmount(simpleMatch[2]);
      if (amount !== null) {
        const isSubTotal = subTotalKeywords.some(k => lower.includes(k));
        const isTotal = !isSubTotal && totalKeywords.some(k => lower.includes(k));
        const isDiscount = !isSubTotal && !isTotal && discountKeywords.some(k => lower.includes(k));
        const isExcluded = !isSubTotal && !isTotal && !isDiscount && excludeKeywords.some(k => lower.includes(k));

        if (isSubTotal) { subTotal = String(amount); return; }
        if (isTotal) { totalOrder = String(amount); return; }
        if (isDiscount) { discount = String(amount); return; }
        if (isExcluded) { return; } // e.g. VAT/tax/service — the app derives VAT itself
      }
    }

    // 2) Quantity-aware item line: "Qty  Description  UnitPrice  [LineTotal]"
    //    Expand into one row per unit so each person can be assigned a single item.
    const qtyMatch = line.match(qtyItemRegex);
    if (qtyMatch) {
      const qty = parseInt(qtyMatch[1], 10);
      const label = qtyMatch[2].trim();
      const unitPrice = normalizeAmount(qtyMatch[3]);
      if (qty > 0 && unitPrice !== null && unitPrice > 0 && label) {
        const count = Math.min(qty, 50); // sanity cap against OCR misreads
        for (let i = 0; i < count; i++) {
          items.push({ label, price: unitPrice });
        }
        return;
      }
    }

    // 3) Fallback: plain "Description  Price" line with no usable Qty column.
    if (simpleMatch) {
      const labelPart = simpleMatch[1].trim();
      const amount = normalizeAmount(simpleMatch[2]);
      if (labelPart && amount !== null && amount > 0) {
        items.push({ label: labelPart, price: amount });
      }
    }
  });

  return { totalOrder, subTotal, discount, items };
}

function populateScanFields(parsed) {
  document.getElementById('scan-total-order').value = parsed.totalOrder || '';
  document.getElementById('scan-sub-total').value = parsed.subTotal || '';
  document.getElementById('scan-discount').value = parsed.discount || '';

  const container = document.getElementById('scan-items-container');
  container.innerHTML = '';
  scanItemRowCount = 0;

  if (parsed.items && parsed.items.length) {
    parsed.items.forEach(it => addScanItemRow(it.label, it.price));
  } else {
    const notice = document.createElement('div');
    notice.id = 'scan-no-items-notice';
    notice.style.cssText = 'font-size:13px;color:#666;margin:6px 0;';
    notice.innerText = translations[currentLanguage].noItemsFoundMessage;
    container.appendChild(notice);
  }

  document.getElementById('scan-fields-wrapper').style.display = 'block';
  updateScanItemsSum();
}

window.addScanItemRow = function (label = '', price = '') {
  const notice = document.getElementById('scan-no-items-notice');
  if (notice) notice.remove();

  scanItemRowCount++;
  const container = document.getElementById('scan-items-container');
  const row = document.createElement('div');
  row.className = 'scan-item-row fade-slide-in';
  row.innerHTML = `
    <input type="text" class="item-name-input" value="${escapeHtml(String(label))}" placeholder="${translations[currentLanguage].itemNamePlaceholder}">
    <input type="number" class="item-price-input" value="${price === '' ? '' : Number(price).toFixed(2)}" step="0.01" placeholder="${translations[currentLanguage].itemPricePlaceholder}" oninput="updateScanItemsSum()">
    <button type="button" class="scan-item-remove" onclick="removeScanItemRow(this)">${translations[currentLanguage].removeButton}</button>
  `;
  container.appendChild(row);
  updateScanItemsSum();
};

window.removeScanItemRow = function (button) {
  const row = button.closest('.scan-item-row');
  if (row) row.remove();
  updateScanItemsSum();
};

// Live indicator: sum of item rows vs the Sub-Total field, updated as the user edits.
window.updateScanItemsSum = function () {
  const label = document.getElementById('scan-items-sum-label');
  if (!label) return;
  const t = translations[currentLanguage];

  const rows = [...document.querySelectorAll('#scan-items-container .scan-item-row')];
  const itemsSum = rows.reduce((s, row) => {
    const priceInput = row.querySelector('.item-price-input');
    return s + (priceInput ? (parseFloat(priceInput.value) || 0) : 0);
  }, 0);

  const subTotalRaw = document.getElementById('scan-sub-total').value;
  const subTotal = parseFloat(subTotalRaw);
  const hasSubTotal = subTotalRaw !== '' && !isNaN(subTotal);

  label.innerText = `${t.itemsSumLabel}: ${itemsSum.toFixed(2)}${hasSubTotal ? ' / ' + t.subTotal + ' ' + subTotal.toFixed(2) : ''}`;

  const mismatchErrorEl = document.getElementById('scan-mismatch-error');
  const isMismatch = hasSubTotal && Math.abs(itemsSum - subTotal) > 2;
  label.style.color = isMismatch ? '#b52424' : (hasSubTotal ? '#1a7a1a' : '#333');

  // Clear any previously shown hard error once the numbers line up again.
  if (!isMismatch && mismatchErrorEl) {
    mismatchErrorEl.style.display = 'none';
  }
};

// ---------------------------------------------------------------------
// Continue: lock in the scanned receipt, move on to the "names" step
// ---------------------------------------------------------------------
window.scanContinue = function () {
  const validated = window.validateBillTotals(
    document.getElementById('scan-total-order').value,
    document.getElementById('scan-sub-total').value,
    document.getElementById('scan-discount').value,
    { totalOrder: 'scan-total-order-error', subTotal: 'scan-sub-total-error', discount: 'scan-discount-error' }
  );
  if (!validated) return;

  const rows = [...document.querySelectorAll('#scan-items-container .scan-item-row')];
  const items = rows.map(row => {
    const label = row.querySelector('.item-name-input').value.trim() || (translations[currentLanguage].noLabel || 'No-Label');
    const price = parseFloat(row.querySelector('.item-price-input').value) || 0;
    return { label, price };
  }).filter(it => it.price !== 0);

  // Hard block: make sure the items add up to the Sub-Total before moving on,
  // so mismatches get caught here rather than surfacing later during calculation.
  const itemsSum = items.reduce((s, it) => s + it.price, 0);
  if (Math.abs(itemsSum - validated.subTotal) > 2) {
    showError('scan-mismatch-error', translations[currentLanguage].itemsMismatchError);
    updateScanItemsSum();
    return;
  }

  window.scannedReceipt = {
    totalOrder: validated.totalOrder,
    subTotal: validated.subTotal,
    discount: validated.discount,
    items
  };

  showSection('scan-step', 'step1');
};

function resetScanStepUI() {
  scanImageDataUrl = null;
  const wrapper = document.getElementById('scan-preview-wrapper');
  if (wrapper) wrapper.style.display = 'none';
  const captureButtons = document.getElementById('scan-capture-buttons');
  if (captureButtons) captureButtons.style.display = 'flex';
  const fieldsWrapper = document.getElementById('scan-fields-wrapper');
  if (fieldsWrapper) fieldsWrapper.style.display = 'none';
  const errorEl = document.getElementById('scan-error-message');
  if (errorEl) errorEl.style.display = 'none';
  const camInput = document.getElementById('scan-file-camera');
  const upInput = document.getElementById('scan-file-upload');
  if (camInput) camInput.value = '';
  if (upInput) upInput.value = '';
}

// ---------------------------------------------------------------------
// Assign step: distribute scanned items among the named people
// ---------------------------------------------------------------------
window.buildAssignStep = function () {
  const names = [...document.querySelectorAll('.person-name')].map(input => input.value.trim());
  const receipt = window.scannedReceipt || { totalOrder: '', subTotal: '', discount: 0, items: [] };

  document.getElementById('assign-total-order').value = receipt.totalOrder;
  document.getElementById('assign-sub-total').value = receipt.subTotal;
  document.getElementById('assign-discount').value = receipt.discount;

  const container = document.getElementById('assign-items-container');
  container.innerHTML = '';
  assignItemRowCount = 0;

  window._assignPersonNames = names;

  if (receipt.items && receipt.items.length) {
    receipt.items.forEach(it => addAssignItemRow(it.label, it.price));
  } else {
    addAssignItemRow('', '');
  }
};

function personOptionsHtml(selected) {
  const t = translations[currentLanguage];
  const names = window._assignPersonNames || [];
  let html = `<option value="">${t.choosePersonPlaceholder}</option>`;
  names.forEach(n => {
    const sel = (n === selected) ? 'selected' : '';
    html += `<option value="${escapeHtml(n)}" ${sel}>${escapeHtml(n)}</option>`;
  });
  return html;
}

window.addAssignItemRow = function (label = '', price = '', assignedTo = '') {
  assignItemRowCount++;
  const container = document.getElementById('assign-items-container');
  const row = document.createElement('div');
  row.className = 'assign-item-row fade-slide-in';
  row.innerHTML = `
    <input type="text" class="item-name-input" value="${escapeHtml(String(label))}" placeholder="${translations[currentLanguage].itemNamePlaceholder}">
    <input type="number" class="item-price-input" value="${price === '' ? '' : Number(price).toFixed(2)}" step="0.01" placeholder="${translations[currentLanguage].itemPricePlaceholder}">
    <select class="assign-person-select">${personOptionsHtml(assignedTo)}</select>
    <button type="button" class="assign-item-remove" onclick="this.closest('.assign-item-row').remove()">${translations[currentLanguage].removeButton}</button>
  `;
  container.appendChild(row);
};

window.calculateFromAssignment = async function () {
  const validated = window.validateBillTotals(
    document.getElementById('assign-total-order').value,
    document.getElementById('assign-sub-total').value,
    document.getElementById('assign-discount').value,
    { totalOrder: 'assign-total-order-error', subTotal: 'assign-sub-total-error', discount: 'assign-discount-error' }
  );
  if (!validated) return;
  const { totalOrder, subTotal, discount } = validated;

  const names = window._assignPersonNames || [];
  const rows = [...document.querySelectorAll('#assign-items-container .assign-item-row')];

  // Validate every priced row has an assignee.
  const unassigned = rows.some(row => {
    const price = parseFloat(row.querySelector('.item-price-input').value) || 0;
    const person = row.querySelector('.assign-person-select').value;
    return price !== 0 && !person;
  });
  if (unassigned) {
    showError('assign-unassigned-error', translations[currentLanguage].unassignedError);
    return;
  }

  // Group items by person, defaulting every named person to an entry (even 0 items).
  const byName = {};
  names.forEach(n => { byName[n] = { name: n, sum: 0, items: [] }; });

  rows.forEach(row => {
    const label = row.querySelector('.item-name-input').value.trim() || (translations[currentLanguage].noLabel || 'No-Label');
    const price = parseFloat(row.querySelector('.item-price-input').value) || 0;
    const person = row.querySelector('.assign-person-select').value;
    if (!person || price === 0) return;
    if (!byName[person]) byName[person] = { name: person, sum: 0, items: [] };
    byName[person].items.push({ label, price });
    byName[person].sum += price;
  });

  const totals = names.map(n => byName[n]);

  const calcBtn = document.getElementById('assign-calculate-button');
  window.setButtonLoading(calcBtn, true);
  try {
    await window.finalizeCalculation(totalOrder, subTotal, discount, totals, {
      mismatchErrorId: 'assign-mismatch-error-message',
      hideStepId: 'assign-step'
    });
  } finally {
    window.setButtonLoading(calcBtn, false);
  }
};

// ---------------------------------------------------------------------
// Wire up file inputs once the DOM is ready
// ---------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  const camInput = document.getElementById('scan-file-camera');
  const upInput = document.getElementById('scan-file-upload');
  if (camInput) camInput.addEventListener('change', handleScanFileSelected);
  if (upInput) upInput.addEventListener('change', handleScanFileSelected);
});
