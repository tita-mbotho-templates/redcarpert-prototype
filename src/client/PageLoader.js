/**
 * Reveal HTML as soon as its first meaningful visual is ready.
 * Homepage waits for the prioritised hero; other pages wait for the first
 * in-viewport content image if present. No artificial minimum display time.
 * Timeouts, decode failures and the HTML bootstrap always fail open.
 */
export function initializePageLoader() {
  const loader = document.querySelector('#redcarpert-page-loader');
  if (!loader) return;
  const fallback = window.__redcarpertLoaderFallback;
  const finish = () => {
    if (fallback) clearTimeout(fallback);
    if (!loader.isConnected || loader.dataset.state === 'exiting') return;
    loader.dataset.state = 'exiting';
    window.setTimeout(() => loader.remove(), 400);
  };
  const firstPaint = () => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
  const firstContentImage = [...document.querySelectorAll('#main-container img, #content-container img')]
    .find(img => {
      if (img.closest('header, footer')) return false;
      const r = img.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
    });
  const criticalUrl = loader.dataset.heroUrl || firstContentImage?.currentSrc
    || firstContentImage?.src || '';
  const decode = () => {
    if (!criticalUrl) return Promise.resolve();
    const img = new Image();
    if (loader.dataset.heroUrl) img.fetchPriority = 'high';
    img.src = criticalUrl;
    return typeof img.decode === 'function'
      ? img.decode().catch(() => undefined)
      : new Promise(resolve => {
        img.onload = resolve; img.onerror = resolve;
        if (img.complete) resolve();
      });
  };
  let deadline;
  void Promise.race([
    decode(),
    new Promise(resolve => { deadline = setTimeout(resolve, 5200); }),
  ]).then(firstPaint).then(finish).catch(finish).finally(() => clearTimeout(deadline));
}
