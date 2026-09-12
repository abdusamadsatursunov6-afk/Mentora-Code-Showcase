// V34 — current-version language routing, chapter preservation, and public-share URL hygiene.
(() => {
  const root = document.documentElement;
  root.dataset.bundleVersion = '34';

  const supported = new Set(['ru', 'uz', 'en']);
  const current = supported.has((root.lang || '').slice(0, 2).toLowerCase())
    ? (root.lang || '').slice(0, 2).toLowerCase()
    : 'ru';

  const activeHash = () => location.hash || '#story';
  const hrefFor = code => `v34.html${code === 'ru' ? '' : `?lang=${code}`}${activeHash()}`;
  const languageLinks = [...document.querySelectorAll('.lang-switcher a, .mobile-lang-switcher a')];

  const codeFor = link => {
    const explicit = (link.getAttribute('hreflang') || '').toLowerCase().slice(0, 2);
    if (supported.has(explicit)) return explicit;
    const text = (link.textContent || '').trim().toLowerCase().slice(0, 2);
    return supported.has(text) ? text : 'ru';
  };

  const refreshLinks = () => {
    languageLinks.forEach(link => {
      const code = codeFor(link);
      link.href = hrefFor(code);
      link.target = '_top';
      link.rel = 'alternate';
      link.hreflang = code;
      if (code === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  // Capture before legacy V25/V31 bubble handlers so language changes never fall back to old wrappers.
  document.addEventListener('click', event => {
    const link = event.target.closest('.lang-switcher a, .mobile-lang-switcher a');
    if (!link) return;
    const code = codeFor(link);
    event.preventDefault();
    event.stopImmediatePropagation();
    const target = hrefFor(code);
    if (window.top && window.top !== window) window.top.location.assign(target);
    else location.assign(target);
  }, true);

  addEventListener('hashchange', refreshLinks, { passive: true });
  addEventListener('pageshow', refreshLinks, { passive: true });
  refreshLinks();

  // Keep share/canonical semantics on the current production version when the page runs standalone.
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = new URL(`v34.html${current === 'ru' ? '' : `?lang=${current}`}${activeHash()}`, location.href).href;
})();
