// V28 — compositor budget and background lifecycle guard.
(() => {
  const root = document.documentElement;
  root.dataset.bundleVersion = '28';

  const syncVisibility = () => root.classList.toggle('v28-page-paused', document.hidden);
  document.addEventListener('visibilitychange', syncVisibility, { passive: true });
  syncVisibility();

  // Pause purely decorative CSS motion inside sections that are well outside the viewport.
  // Content remains rendered/readable; only continuous animation work is suspended.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        entry.target.classList.toggle('v28-offscreen', !entry.isIntersecting);
      }
    }, { rootMargin: '35% 0px 35% 0px', threshold: 0 });
    document.querySelectorAll('main > section').forEach(section => observer.observe(section));
  }

  // Defer non-critical image decoding without changing source order or semantics.
  const tuneImages = () => {
    document.querySelectorAll('img').forEach((img, index) => {
      if (index > 0 && !img.hasAttribute('loading')) img.loading = 'lazy';
      if (!img.hasAttribute('decoding')) img.decoding = 'async';
    });
  };
  if ('requestIdleCallback' in window) requestIdleCallback(tuneImages, { timeout: 1200 });
  else setTimeout(tuneImages, 250);
})();
