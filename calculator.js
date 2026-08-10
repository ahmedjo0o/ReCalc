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

// --- calculateVAT updated to capture { items: [{label, price}], sum } per person ---
window.calculateVAT = function () {
  const totalOrderValue = document.getElementById('total-order').value.trim();
  const subTotalValue = document.getElementById('sub-total').value.trim();
  const discountValue = document.getElementById('discount').value.trim();

  if (!totalOrderValue || isNaN(Number(totalOrderValue))) {
    showError('total-order-error', translations[currentLanguage].totalOrderError);
    return;
  }
  if (!subTotalValue || isNaN(Number(subTotalValue))) {
    showError('sub-total-error', translations[currentLanguage].subTotalError);
    return;
  }
  if (discountValue && isNaN(Number(discountValue))) {
    showError('discount-error', translations[currentLanguage].discountError);
    return;
  }

  const totalOrder = Number(totalOrderValue);
  const subTotal = Number(subTotalValue);
  const discount = Number(discountValue) || 0;

  if (totalOrder < 0) {
    showError('total-order-error', translations[currentLanguage].negativeError);
    return;
  }
  if (subTotal < 0) {
    showError('sub-total-error', translations[currentLanguage].negativeError);
    return;
  }
  if (discount < 0) {
    showError('discount-error', translations[currentLanguage].negativeError);
    return;
  }

  if (discount > totalOrder) {
    showError('discount-error', translations[currentLanguage].discountGreaterError);
    return;
  }
  if (subTotal > totalOrder) {
    showError('sub-total-error', translations[currentLanguage].subTotalGreaterError);
    return;
  }

  const vat = totalOrder - subTotal;

  const cards = document.querySelectorAll('#cards-container .card');
  const results = document.getElementById('result-cards-container');
  results.innerHTML = '';

  // Build totals with items
  const totals = [...cards].map(card => {
    const name = card.querySelector('.card-header').innerText;
    const itemRows = [...card.querySelectorAll('.card-content')];

        const items = itemRows.map(row => {
          const valueInput = row.querySelector('.order-value');
          const itemInput = row.querySelector('.order-item');
          const price = valueInput ? (parseFloat(valueInput.value) || 0) : 0;
        // default label to translation if empty
          const label = itemInput && (itemInput.value || '').trim()
            ? itemInput.value.trim()
            : (translations[currentLanguage]?.noLabel || 'No-Label');
          return { label, price };
        }).filter(i => i.price !== 0); // only keep rows with a numeric price

        const sum = items.reduce((s, it) => s + (Number(it.price) || 0), 0);


    return { name, sum, items };
  });

  const checkSum = totals.reduce((a, b) => a + b.sum, 0);

  // Allow small floating diff but prevent gross mismatches; use tolerance of 2 (same as original)
  if (Math.abs(checkSum - subTotal) > 2) {
     showError('mismatch-error-message', translations[currentLanguage].mismatchError);
      return;
  }

  // Render result cards (show breakdown)
  totals.forEach(({ name, sum, items }) => {
    const percent = checkSum === 0 ? 0 : sum / checkSum;
    const vatShare = vat * percent;
    const discountShare = discount * percent;
    const totalPay = sum + vatShare - discountShare;

    // breakdown text: show each item line "label: price" or just "price" if no label
    const breakdownHtml = items.map(it => {
      const labelText = (it.label && it.label.trim()) ? escapeHtml(it.label) : (translations[currentLanguage]?.noLabel || 'No-Label');
      return `<div style="font-size:13px;">${labelText}: ${Number(it.price || 0).toFixed(2)}</div>`;
    }).join('');


    const card = document.createElement('div');
    card.classList.add('card', 'fade-slide-in');
    card.innerHTML = `
      <div class="card-header">${escapeHtml(name)}</div>
      <div class="card-content">${translations[currentLanguage].order}: ${sum.toFixed(2)}</div>
      <div class="card-content">${translations[currentLanguage].vat}: ${vatShare.toFixed(2)}</div>
      <div class="card-content">${translations[currentLanguage].discount.replace(/\s*\(.*\)/, '')} ${discountShare.toFixed(2)}</div>
      <div class="card-content total-to-pay"><strong>${translations[currentLanguage].totalToPay}: ${totalPay.toFixed(2)}</strong></div>
      <div class="card-details" style="margin-top:8px; font-size:13px;"><strong class="details-label">${translations[currentLanguage].details}</strong>
          ${breakdownHtml || `<div style="font-size:13px;color:#666;margin-top:4px;">${translations[currentLanguage].noLabel}</div>`}
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

  // Save calculation (totals now include items)
  try {
    const calcToSave = {
      createdAt: (firebase && firebase.firestore && firebase.firestore.FieldValue) 
                  ? firebase.firestore.FieldValue.serverTimestamp() 
                  : new Date().toISOString(),
      totalOrder,
      subTotal,
      discount,
      vat,
      totals, // array of { name, sum, items: [{label, price}] }
      resultsSummary: totals.map(t => ({ name: t.name, sum: t.sum })),
      localeLang: currentLanguage
    };

    if (window.currentUser && window.currentUser.uid) {
      saveCalculationToFirestore(window.currentUser.uid, calcToSave).catch(err => console.warn('save calc', err));
    } else {
      localSaveCalculation({...calcToSave, createdAt: new Date().toISOString()});
    }
  } catch (err) {
    console.warn('Could not save calculation:', err);
  }

  document.getElementById('step2and3').style.display = 'none';
  document.getElementById('result').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

