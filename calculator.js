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

// --- Shared core: given already-validated totals + a per-person items array
// --- ({ name, items:[{label,price}] }), send them to the calculateBill Cloud
// --- Function for the authoritative split calculation (and, for signed-in
// --- users, the history write), then render the returned result cards.
// --- opts: { mismatchErrorId, hideStepId, calcButtonId }
window.finalizeCalculation = async function (totalOrder, subTotal, discount, totals, opts) {
  opts = opts || {};
  const mismatchErrorId = opts.mismatchErrorId || 'mismatch-error-message';
  const hideStepId = opts.hideStepId || 'step2and3';
  const calcButton = opts.calcButtonId ? document.getElementById(opts.calcButtonId) : null;
  const t = translations[currentLanguage];

  if (calcButton) calcButton.disabled = true;

  let response;
  try {
    response = await window.callCalculateBill({
      totalOrder,
      subTotal,
      discount,
      totals,
      localeLang: currentLanguage,
      source: window.appFlow === 'scan' ? 'scan' : 'manual'
    });
  } catch (err) {
    console.error('calculateBill failed:', err);
    if (calcButton) calcButton.disabled = false;
    if (err && err.code === 'functions/failed-precondition') {
      showError(mismatchErrorId, t.mismatchError);
    } else {
      showError(mismatchErrorId, t.calcServerError || 'Could not reach the server. Please check your connection and try again.');
    }
    return false;
  }
  if (calcButton) calcButton.disabled = false;

  const { results, vat } = response.data;

  const resultsContainer = document.getElementById('result-cards-container');
  resultsContainer.innerHTML = '';

  results.forEach(({ name, sum, items, vatShare, discountShare, totalPay }) => {
    const breakdownHtml = (items || []).map(it => {
      const labelText = (it.label && it.label.trim()) ? escapeHtml(it.label) : (t?.noLabel || 'No-Label');
      return `<div style="font-size:13px;">${labelText}: ${Number(it.price || 0).toFixed(2)}</div>`;
    }).join('');

    const card = document.createElement('div');
    card.classList.add('card', 'fade-slide-in');
    card.innerHTML = `
      <div class="card-header">${escapeHtml(name)}</div>
      <div class="card-content">${t.order}: ${Number(sum).toFixed(2)}</div>
      <div class="card-content">${t.vat}: ${Number(vatShare).toFixed(2)}</div>
      <div class="card-content">${t.discount.replace(/\s*\(.*\)/, '')} ${Number(discountShare).toFixed(2)}</div>
      <div class="card-content total-to-pay"><strong>${t.totalToPay}: ${Number(totalPay).toFixed(2)}</strong></div>
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
    resultsContainer.appendChild(card);
  });

  // The Cloud Function already saved history to Firestore for signed-in users.
  // For anonymous users (no server-side write happens), fall back to local
  // storage exactly as before, using the server's computed numbers.
  try {
    if (!(window.currentUser && window.currentUser.uid)) {
      localSaveCalculation({
        createdAt: new Date().toISOString(),
        totalOrder,
        subTotal,
        discount,
        vat,
        totals: results,
        resultsSummary: results.map(r => ({ name: r.name, sum: r.sum })),
        localeLang: currentLanguage,
        source: window.appFlow === 'scan' ? 'scan' : 'manual'
      });
    }
  } catch (err) {
    console.warn('Could not save calculation locally:', err);
  }

  const hideStepEl = document.getElementById(hideStepId);
  if (hideStepEl) hideStepEl.style.display = 'none';
  document.getElementById('result').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return true;
};

// --- calculateVAT: manual flow (step2and3). Builds the per-person items list
// --- from the order cards and hands it to finalizeCalculation, which sends
// --- it to the Cloud Function for the authoritative computation. ---
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

    return { name, items };
  });

  await window.finalizeCalculation(totalOrder, subTotal, discount, totals, {
    mismatchErrorId: 'mismatch-error-message',
    hideStepId: 'step2and3',
    calcButtonId: 'calculate-button'
  });
}

window.shareCard = function (btn) {
  const card = btn.closest('.card');
  const wasAnimated = card.classList.contains('fade-slide-in');

  // 1. Temporarily remove animation class
  if (wasAnimated) {
    card.classList.remove('fade-slide-in');
  }

  // 2. Add a small delay for DOM to update
  setTimeout(() => {
    html2canvas(card, { 
      backgroundColor: '#ffffff', // 3. Keep background color fix
      useCORS: true 
    }).then(canvas => {
      // 4. Add class back after capture
      if (wasAnimated) {
        card.classList.add('fade-slide-in');
      }

      canvas.toBlob(blob => {
        const file = new File([blob], "card.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: 'Your Bill',
            text: 'Individual Bill Breakdown'
          }).catch(console.error);
        } else {
          const link = document.createElement('a');
          link.download = "card.png";
          link.href = URL.createObjectURL(file);
          link.click();
        }
      });
    }).catch(err => {
      // 4. Also add class back on error
      if (wasAnimated) {
        card.classList.add('fade-slide-in');
      }
      console.error("html2canvas error:", err);
    });
  }, 100); // 100ms delay
}

window.shareFullResult = function () {
  const resultContainer = document.getElementById('result-cards-container');
  // Find all cards that have the animation class
  const cards = resultContainer.querySelectorAll('.card.fade-slide-in');

  // 1. Temporarily remove animation class from all children
  cards.forEach(card => card.classList.remove('fade-slide-in'));

  // 2. Add a small delay for DOM to update
  setTimeout(() => {
    html2canvas(resultContainer, { 
      backgroundColor: '#ffffff', // 3. Keep background color fix
      useCORS: true 
    }).then(canvas => {
      // 4. Add classes back after capture
      cards.forEach(card => card.classList.add('fade-slide-in'));

      canvas.toBlob(blob => {
        const file = new File([blob], "full-results.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: 'Receipt Results',
            text: 'Here is the full receipt breakdown'
          }).catch(console.error);
        } else {
          const link = document.createElement('a');
          link.download = "full-results.png";
          link.href = URL.createObjectURL(file);
          link.click();
        }
      });
    }).catch(err => {
      // 4. Also add classes back on error
      cards.forEach(card => card.classList.add('fade-slide-in'));
      console.error("html2canvas error:", err);
    });
  }, 100); // 100ms delay
}
function escapeForJS(s) {
  return s.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

