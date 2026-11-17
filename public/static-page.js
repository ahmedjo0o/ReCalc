// Shared script for the standalone content pages (About, Blog, Privacy,
// Terms, Contact). It only runs the loading animation and fades it out.
// These pages used to load the old app's main.js, which expected the
// calculator's buttons and sign-in code and threw errors here.
window.addEventListener('DOMContentLoaded', () => {
  if (window.lottie) {
    window.lottie.loadAnimation({
      container: document.querySelector('.loader-lottie'),
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'loading.json',
    });
  }
});

window.addEventListener('load', () => {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  const elapsed = Date.now() - (window.startTime || Date.now());
  setTimeout(() => {
    loader.classList.add('fade-out');
    setTimeout(() => loader.remove(), 400);
  }, Math.max(1000 - elapsed, 0));
});
