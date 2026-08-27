import html2canvas from 'html2canvas';

// Builds an off-screen wrapper that mirrors reCalc's brand look (gradient
// background, logo header, clean opaque cards, footer), renders it via
// html2canvas at 2x+ scale for crisp quality. Cloning the live card node(s)
// rather than screenshotting the page directly means we never have to fight
// backdrop-filter/blur.
function buildExportWrapper(cardNodes, dateLabel) {
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
    <div style="font-size:13px; color:rgba(255,255,255,0.9); margin-top:4px;">${dateLabel}</div>
  `;
  wrapper.appendChild(header);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:flex; flex-direction:column; gap:16px;';

  cardNodes.forEach((originalCard) => {
    const clone = originalCard.cloneNode(true);
    const shareBtn = clone.querySelector('.share-button');
    if (shareBtn) shareBtn.remove();
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

// Renders the given card node(s) to a PNG data URL. This is deliberately the
// *only* thing this module does now — it used to also call navigator.share()
// / trigger a download right after rendering, but that happens too long
// after the user's tap (html2canvas rendering isn't instant) for mobile
// browsers to still treat it as "in response to a user gesture", so
// navigator.share() would silently reject (Safari) or the popup/download
// would get blocked. The caller shows this image in a preview and lets the
// user tap an explicit Save/Share button — *that* tap is a fresh gesture.
export function renderCardsToDataUrl(cardNodes, dateLabel) {
  return new Promise((resolve, reject) => {
    if (!cardNodes || !cardNodes.length) {
      resolve(null);
      return;
    }
    const wrapper = buildExportWrapper(cardNodes, dateLabel);
    document.body.appendChild(wrapper);

    // Small delay so the cloned DOM/fonts settle before rasterizing.
    setTimeout(() => {
      html2canvas(wrapper, {
        backgroundColor: null,
        useCORS: true,
        scale: Math.max(2, window.devicePixelRatio || 2),
      })
        .then((canvas) => {
          wrapper.remove();
          resolve(canvas.toDataURL('image/png'));
        })
        .catch((err) => {
          wrapper.remove();
          reject(err);
        });
    }, 100);
  });
}
