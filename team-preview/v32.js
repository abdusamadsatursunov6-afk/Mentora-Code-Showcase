// V32 — runtime resilience: partial asset failure must not blank the public story.
(() => {
  const root = document.documentElement;
  root.dataset.bundleVersion = '32';
  root.dataset.runtimeHealth = root.dataset.runtimeHealth || 'ready';

  const revealCritical = () => {
    document.querySelectorAll('.reveal,[data-critical-content="true"]').forEach(node => node.classList.add('is-visible'));
    document.querySelector('.page-loader')?.classList.add('is-hidden');
  };

  window.addEventListener('pageshow', revealCritical, { passive: true });
  document.addEventListener('visibilitychange', () => {
    root.dataset.pageVisibility = document.visibilityState;
  }, { passive: true });
  setTimeout(revealCritical, 2200);
})();
