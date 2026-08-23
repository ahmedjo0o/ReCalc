// calculator.js (updated)
// --- Order card generation with value + optional item label ---
window.generateOrderCards = function () {
  const names = [...document.querySelectorAll('.person-name')].map(input => input.value.trim());
  const container = document.getElementById('cards-container');
  container.innerHTML = '';

  names.forEach(name => {
    const card = document.createElement('div');
    card.classList.add('card', 'fade-slide-in');
    card.innerHTML = `
      <div class="card-header">${escapeHtml(name)}</div>
      <div class="card-content-container">
        <div class="card-content">
          <span>${translations[currentLanguage].order} 1:</span>
          <input type="number" class="order-value" oninput="updateSubtotal(this)" required placeholder="0.00">
          <input type="text" class="order-item" placeholder="Item (optional)" oninput="syncLabel(this)">
        </div>
      </div>
      <div class="card-controls">
        <button type="button" onclick="addOrderValue(this)">+</button>
        <button type="button" onclick="removeOrderValue(this)">-</button>
      </div>
      <div class="card-total">
        <span class="person-subtotal-label">${translations[currentLanguage].totalWithoutVAT}: 0.00</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// helper to escape displayed text
function escapeHtml(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// --- Reusable button loading/spinner state (used while the Cloud Function /
// --- Firestore save is in flight, since that can take a moment). ---
window.setButtonLoading = function (button, isLoading, loadingText) {
  if (!button) return;
  if (isLoading) {
    if (button.dataset.originalHtml === undefined) {
      button.dataset.originalHtml = button.innerHTML;
    }
    button.disabled = true;
    button.classList.add('btn-loading');
    const label = loadingText || (translations[currentLanguage]?.calculatingButton || 'Calculating…');
    button.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span><span class="btn-loading-text">${escapeHtml(label)}</span>`;
  } else {
    button.disabled = false;
    button.classList.remove('btn-loading');
    if (button.dataset.originalHtml !== undefined) {
      button.innerHTML = button.dataset.originalHtml;
    }
  }
};

// update subtotal (sums only numeric values)
window.updateSubtotal = function (input) {
  const card = input.closest('.card');
  const values = [...card.querySelectorAll('.order-value')].map(i => parseFloat(i.value) || 0);
  const total = values.reduce((a, b) => a + b, 0);
  const labelEl = card.querySelector('.person-subtotal-label');
  if (labelEl) labelEl.innerText = `${translations[currentLanguage].totalWithoutVAT}: ${total.toFixed(2)}`;
}

// optional helper if you want to sync something when item text changes
window.syncLabel = function(input) {
  // no-op for now; reserved for future UI needs
}

// add order row (value + item)
window.addOrderValue = function (button) {
  const container = button.closest('.card').querySelector('.card-content-container');
  const count = container.children.length + 1;
  const div = document.createElement('div');
  div.classList.add('card-content');
  div.innerHTML = `
    <span>${translations[currentLanguage].order} ${count}:</span>
    <input type="number" class="order-value" oninput="updateSubtotal(this)" required placeholder="0.00">
    <input type="text" class="order-item" placeholder="Item (optional)" oninput="syncLabel(this)">
  `;
  container.appendChild(div);
}

// remove last order row (keeps at least 1)
window.removeOrderValue = function (button) {
  const container = button.closest('.card').querySelector('.card-content-container');
  if (container.children.length > 1) {
    container.removeChild(container.lastChild);
    // update subtotal display in case last row had a value
    const firstValueInput = container.querySelector('.order-value');
    if (firstValueInput) updateSubtotal(firstValueInput);
  }
}

// --- Shared validator used by both the manual flow (step2and3) and the ---
// --- scan/assign flow (assign-step). Returns {totalOrder, subTotal, discount} ---
// --- or null (and shows the relevant inline error) if invalid.            ---
window.validateBillTotals = function (totalOrderValue, subTotalValue, discountValue, errIds) {
  errIds = errIds || { totalOrder: 'total-order-error', subTotal: 'sub-total-error', discount: 'discount-error' };
  const t = translations[currentLanguage];

  totalOrderValue = (totalOrderValue || '').trim();
  subTotalValue = (subTotalValue || '').trim();
  discountValue = (discountValue || '').trim();

  if (!totalOrderValue || isNaN(Number(totalOrderValue))) {
    showError(errIds.totalOrder, t.totalOrderError);
    return null;
  }
  if (!subTotalValue || isNaN(Number(subTotalValue))) {
    showError(errIds.subTotal, t.subTotalError);
    return null;
  }
  if (discountValue && isNaN(Number(discountValue))) {
    showError(errIds.discount, t.discountError);
    return null;
  }

  const totalOrder = Number(totalOrderValue);
  const subTotal = Number(subTotalValue);
  const discount = Number(discountValue) || 0;

  if (totalOrder < 0) { showError(errIds.totalOrder, t.negativeError); return null; }
  if (subTotal < 0) { showError(errIds.subTotal, t.negativeError); return null; }
  if (discount < 0) { showError(errIds.discount, t.negativeError); return null; }
  if (discount > totalOrder) { showError(errIds.discount, t.discountGreaterError); return null; }
  if (subTotal > totalOrder) { showError(errIds.subTotal, t.subTotalGreaterError); return null; }

  return { totalOrder, subTotal, discount };
};

// --- Shared core: given totals (already validated) + a per-person totals array
// --- ({ name, sum, items:[{label,price}] }), check the sums match, render the
// --- result cards, persist the calculation, and reveal the result section.
// --- opts: { mismatchErrorId, hideStepId }
window.finalizeCalculation = async function (totalOrder, subTotal, discount, totals, opts) {
  opts = opts || {};
  const mismatchErrorId = opts.mismatchErrorId || 'mismatch-error-message';
  const hideStepId = opts.hideStepId || 'step2and3';
  const t = translations[currentLanguage];

  const vat = totalOrder - subTotal;
  const results = document.getElementById('result-cards-container');
  results.innerHTML = '';

  const checkSum = totals.reduce((a, b) => a + b.sum, 0);

  // Allow small floating diff but prevent gross mismatches; tolerance of 2 (same as original)
  if (Math.abs(checkSum - subTotal) > 2) {
    showError(mismatchErrorId, t.mismatchError);
    return false;
  }

  totals.forEach(({ name, sum, items }) => {
    const percent = checkSum === 0 ? 0 : sum / checkSum;
    const vatShare = vat * percent;
    const discountShare = discount * percent;
    const totalPay = sum + vatShare - discountShare;

    const breakdownHtml = items.map(it => {
      const labelText = (it.label && it.label.trim()) ? escapeHtml(it.label) : (t?.noLabel || 'No-Label');
      return `<div style="font-size:13px;">${labelText}: ${Number(it.price || 0).toFixed(2)}</div>`;
    }).join('');

    const card = document.createElement('div');
    card.classList.add('card', 'fade-slide-in');
    card.innerHTML = `
      <div class="card-header">${escapeHtml(name)}</div>
      <div class="card-content">${t.order}: ${sum.toFixed(2)}</div>
      <div class="card-content">${t.vat}: ${vatShare.toFixed(2)}</div>
      <div class="card-content">${t.discount.replace(/\s*\(.*\)/, '')} ${discountShare.toFixed(2)}</div>
      <div class="card-content total-to-pay"><strong>${t.totalToPay}: ${totalPay.toFixed(2)}</strong></div>
      <div class="card-details" style="margin-top:8px; font-size:13px;"><strong class="details-label">${t.details}</strong>
          ${breakdownHtml || `<div style="font-size:13px;color:#666;margin-top:4px;">${t.noLabel}</div>`}
      </div>
      <button class="share-button" onclick="shareCard(this)">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.02-4.11c.54.5 1.25.81 2.07.81 
          1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.91 9.81C8.37 9.31 7.66 9 6.84 9c-1.66 0-3 1.34-3 3s1.34 3 
          3 3c.82 0 1.53-.31 2.07-.81l7.13 4.18c-.05.21-.07.43-.07.63 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/>
        </svg>
      </button>
    `;
    results.appendChild(card);
  });

  try {
    const calcToSave = {
      createdAt: (firebase && firebase.firestore && firebase.firestore.FieldValue)
                  ? firebase.firestore.FieldValue.serverTimestamp()
                  : new Date().toISOString(),
      totalOrder,
      subTotal,
      discount,
      vat,
      totals,
      resultsSummary: totals.map(tt => ({ name: tt.name, sum: tt.sum })),
      localeLang: currentLanguage,
      source: window.appFlow === 'scan' ? 'scan' : 'manual'
    };

    if (window.currentUser && window.currentUser.uid) {
      // Await this: it's the backend round-trip, so the Calculate button's
      // spinner stays visible for the actual duration of the save.
      await saveCalculationToFirestore(window.currentUser.uid, calcToSave).catch(err => console.warn('save calc', err));
    } else {
      localSaveCalculation({ ...calcToSave, createdAt: new Date().toISOString() });
    }
  } catch (err) {
    console.warn('Could not save calculation:', err);
  }

  const hideStepEl = document.getElementById(hideStepId);
  if (hideStepEl) hideStepEl.style.display = 'none';
  document.getElementById('result').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return true;
};

// --- calculateVAT: manual flow (step2and3). Builds totals from the order cards
// --- and delegates the actual computation/rendering to finalizeCalculation. ---
window.calculateVAT = async function () {
  const validated = window.validateBillTotals(
    document.getElementById('total-order').value,
    document.getElementById('sub-total').value,
    document.getElementById('discount').value
  );
  if (!validated) return;
  const { totalOrder, subTotal, discount } = validated;

  const cards = document.querySelectorAll('#cards-container .card');

  const totals = [...cards].map(card => {
    const name = card.querySelector('.card-header').innerText;
    const itemRows = [...card.querySelectorAll('.card-content')];

    const items = itemRows.map(row => {
      const valueInput = row.querySelector('.order-value');
      const itemInput = row.querySelector('.order-item');
      const price = valueInput ? (parseFloat(valueInput.value) || 0) : 0;
      const label = itemInput && (itemInput.value || '').trim()
        ? itemInput.value.trim()
        : (translations[currentLanguage]?.noLabel || 'No-Label');
      return { label, price };
    }).filter(i => i.price !== 0);

    const sum = items.reduce((s, it) => s + (Number(it.price) || 0), 0);
    return { name, sum, items };
  });

  const calcBtn = document.getElementById('calculate-button');
  window.setButtonLoading(calcBtn, true);
  try {
    await window.finalizeCalculation(totalOrder, subTotal, discount, totals, {
      mismatchErrorId: 'mismatch-error-message',
      hideStepId: 'step2and3'
    });
  } finally {
    window.setButtonLoading(calcBtn, false);
  }
}

// --- Stylized, high-resolution export ---------------------------------
// Builds an off-screen wrapper that mirrors reCalc's brand look (gradient
// background, logo header, clean opaque cards, footer), renders it via
// html2canvas at 2x+ scale for crisp quality, then shares/downloads it.
// Cloning the card(s) (rather than screenshotting the live DOM) means we
// never have to fight backdrop-filter/blur or toggle animation classes.
function buildExportWrapper(cardNodes) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 640px;
    padding: 32px 28px;
    background: linear-gradient(135deg, #80c1b5, #4e81b3);
    font-family: 'Cairo', sans-serif;
    box-sizing: border-box;
  `;

  const header = document.createElement('div');
  header.style.cssText = 'text-align:center; margin-bottom:22px;';
  header.innerHTML = `
    <div style="font-size:28px; font-weight:800; color:#ffffff; letter-spacing:0.5px; text-shadow:0 2px 6px rgba(0,0,0,0.18);">reCalc</div>
    <div style="font-size:13px; color:rgba(255,255,255,0.9); margin-top:4px;">${escapeHtml(new Date().toLocaleDateString(currentLanguage === 'ar' ? 'ar' : 'en'))}</div>
  `;
  wrapper.appendChild(header);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:flex; flex-direction:column; gap:16px;';

  cardNodes.forEach(originalCard => {
    const clone = originalCard.cloneNode(true);
    const shareBtn = clone.querySelector('.share-button');
    if (shareBtn) shareBtn.remove();
    clone.classList.remove('fade-slide-in', 'fade-slide-out');
    clone.style.cssText = `
      background: #ffffff;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 14px;
      box-shadow: 0 10px 24px rgba(0,20,50,0.18);
      padding: 16px 18px;
      margin: 0;
    `;
    grid.appendChild(clone);
  });
  wrapper.appendChild(grid);

  const footer = document.createElement('div');
  footer.style.cssText = 'text-align:center; margin-top:22px; font-size:12px; color:rgba(255,255,255,0.9); letter-spacing:0.3px;';
  footer.innerText = 're-calc.com';
  wrapper.appendChild(footer);

  return wrapper;
}

function exportCardsAsImage(cardNodes, filename, shareTitle, shareText) {
  if (!cardNodes || !cardNodes.length) return;
  const wrapper = buildExportWrapper(cardNodes);
  document.body.appendChild(wrapper);

  // Small delay so the cloned DOM/fonts settle before rasterizing.
  setTimeout(() => {
    html2canvas(wrapper, {
      backgroundColor: null,
      useCORS: true,
      scale: Math.max(2, window.devicePixelRatio || 2) // high-quality export
    }).then(canvas => {
      wrapper.remove();
      canvas.toBlob(blob => {
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: shareTitle, text: shareText }).catch(console.error);
        } else {
          const link = document.createElement('a');
          link.download = filename;
          link.href = URL.createObjectURL(file);
          link.click();
        }
      });
    }).catch(err => {
      wrapper.remove();
      console.error('html2canvas error:', err);
    });
  }, 100);
}

window.shareCard = function (btn) {
  const card = btn.closest('.card');
  exportCardsAsImage([card], 'recalc-bill.png', 'Your Bill', 'Individual Bill Breakdown');
}

window.shareFullResult = function () {
  const resultContainer = document.getElementById('result-cards-container');
  const cards = [...resultContainer.querySelectorAll('.card')];
  exportCardsAsImage(cards, 'recalc-full-results.png', 'Receipt Results', 'Here is the full receipt breakdown');
}
function escapeForJS(s) {
  return s.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

