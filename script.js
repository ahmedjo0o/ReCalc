
async function calculateVAT() {
    const totalOrder = parseFloat(document.getElementById('total-order').value);
    const subTotal = parseFloat(document.getElementById('sub-total').value);
    const cardsContainer = document.getElementById('cards-container');
    const cards = cardsContainer.getElementsByClassName('card');

    const people = Array.from(cards).map(card => {
        const name = card.querySelector('.card-header').innerText;
        const orders = Array.from(card.querySelectorAll('.order-value')).map(input => parseFloat(input.value) || 0);
        return { name, orders };
    });

    const response = await fetch('https://your-backend-url.com/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people, subTotal, total: totalOrder })
    });

    if (!response.ok) {
        alert("خطأ في الحساب. تأكد من إدخال البيانات بشكل صحيح.");
        return;
    }

    const results = await response.json();

    const resultCardsContainer = document.getElementById('result-cards-container');
    resultCardsContainer.innerHTML = '';

    results.forEach(person => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
            <div class="card-header">${person.name}</div>
            <div class="card-content">
                <span>${translations[currentLanguage].orderValueLabel}:</span> ${person.orderTotal.toFixed(2)}
            </div>
            <div class="card-content">
                <span>${translations[currentLanguage].vatLabel}:</span> ${person.vat.toFixed(2)}
            </div>
            <div class="card-content total-to-pay">
                <span>${translations[currentLanguage].totalToPayLabel}:</span> ${person.totalToPay.toFixed(2)}
            </div>
        `;
        resultCardsContainer.appendChild(card);
    });

    document.getElementById('step3').style.display = 'none';
    document.getElementById('result').style.display = 'block';
}
