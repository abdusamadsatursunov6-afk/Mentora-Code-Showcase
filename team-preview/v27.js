// V27 — immediate content paint and adaptive animation budget.
(() => {
  const root = document.documentElement;
  root.dataset.bundleVersion = '27';

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const lite = Boolean(connection?.saveData) || ['slow-2g','2g'].includes(connection?.effectiveType || '') || Number(navigator.deviceMemory || 8) <= 2;
  if (lite) root.dataset.v27Lite = 'true';

  // Do not gate meaningful content behind a cinematic loader or an observer callback.
  document.querySelector('.page-loader')?.remove();
  document.querySelector('.hero-content')?.classList.add('is-visible');

  // On phones, constrained devices and reduced-motion sessions, the CSS hero remains intact
  // while the continuously-rendering canvas is stopped to save battery/GPU time.
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (innerWidth <= 760 || lite || reduce) {
    try {
      if (typeof canvasActive !== 'undefined') canvasActive = false;
      if (typeof fieldFrame !== 'undefined' && fieldFrame) cancelAnimationFrame(fieldFrame);
    } catch (_) {}
    document.getElementById('heroCanvas')?.setAttribute('aria-hidden','true');
  }

  // Avoid mobile-browser chrome resize storms doing unnecessary visual work.
  let lastW = innerWidth;
  addEventListener('resize', () => {
    if (Math.abs(innerWidth - lastW) < 2) return;
    lastW = innerWidth;
    if (innerWidth <= 760) {
      try {
        if (typeof canvasActive !== 'undefined') canvasActive = false;
        if (typeof fieldFrame !== 'undefined' && fieldFrame) cancelAnimationFrame(fieldFrame);
      } catch (_) {}
    }
  }, {passive:true});
})();
