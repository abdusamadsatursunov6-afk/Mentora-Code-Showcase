// V36 — progressive rendering, image loading, and low-power safeguards.
(() => {
  const root = document.documentElement;
  root.dataset.bundleVersion = '36';

  // Defer below-the-fold imagery without changing visible content or markup semantics.
  document.querySelectorAll('main img').forEach((img, index) => {
    img.decoding = 'async';
    if (index > 0 || !img.closest('.hero')) {
      img.loading = 'lazy';
      img.fetchPriority = 'low';
    }
  });

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const constrained = Boolean(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || '')));
  if (constrained) root.dataset.networkMode = 'constrained';

  // Hidden tabs are browser-throttled; on data-saving/2G connections also collapse the decorative canvas render budget.
  const canvas = document.getElementById('heroCanvas');
  const setCanvasState = () => {
    if (!canvas) return;
    const paused = document.hidden || constrained;
    canvas.dataset.paused = paused ? 'true' : 'false';
    canvas.style.visibility = constrained ? 'hidden' : '';
    if (constrained) {
      if (canvas.width !== 1) canvas.width = 1;
      if (canvas.height !== 1) canvas.height = 1;
    }
    window.dispatchEvent(new CustomEvent('mentora:renderbudget', { detail: { paused, constrained } }));
  };
  document.addEventListener('visibilitychange', setCanvasState, { passive: true });
  window.addEventListener('pageshow', setCanvasState, { passive: true });
  if (constrained) window.addEventListener('resize', setCanvasState, { passive: true });
  setCanvasState();

  // Let the browser schedule non-critical below-fold reveal preparation during idle time.
  const warmSections = () => {
    document.querySelectorAll('main > section[id]').forEach(section => {
      section.dataset.renderReady = 'true';
    });
  };
  if ('requestIdleCallback' in window) requestIdleCallback(warmSections, { timeout: 1200 });
  else setTimeout(warmSections, 300);
})();
