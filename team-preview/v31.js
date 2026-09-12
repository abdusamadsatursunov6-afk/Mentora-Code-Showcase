// V31 — unified RU/UZ/EN runtime, direct language routing and metadata synchronization.
(() => {
  document.documentElement.dataset.bundleVersion = '31';
  const lang = (document.documentElement.lang || 'ru').toLowerCase().slice(0, 2);
  const supported = new Set(['ru', 'uz', 'en']);
  const current = supported.has(lang) ? lang : 'ru';

  const languageLinks = [...document.querySelectorAll('.lang-link, .lang-switcher a, .mobile-lang-switcher a')];
  const activeHash = () => location.hash || '#story';
  const hrefFor = code => `v31.html${code === 'ru' ? '' : `?lang=${code}`}${activeHash()}`;

  languageLinks.forEach(link => {
    const code = (link.getAttribute('hreflang') || link.textContent || '').trim().toLowerCase().slice(0, 2);
    if (!supported.has(code)) return;
    link.href = hrefFor(code);
    link.target = '_top';
    link.rel = 'alternate';
    link.hreflang = code;
    if (code === current) link.setAttribute('aria-current', 'page');
    else if (link.getAttribute('aria-current') === 'page') link.removeAttribute('aria-current');
  });

  const metadata = {
    ru: {
      title: 'Mentora — Team & Story',
      description: 'Команда, продукт и история Mentora — образовательной платформы с AI-инструментами.',
      locale: 'ru_RU'
    },
    uz: {
      title: 'Mentora — Jamoa va tarix',
      description: 'Mentora jamoasi, mahsuloti va tarixi — AI vositalariga ega ta’lim platformasi.',
      locale: 'uz_UZ'
    },
    en: {
      title: 'Mentora — Team & Story',
      description: 'The team, product and story behind Mentora — an education platform with AI tools.',
      locale: 'en_US'
    }
  }[current];

  document.title = metadata.title;
  const setMeta = (selector, attr, value) => {
    const node = document.querySelector(selector);
    if (node) node.setAttribute(attr, value);
  };
  setMeta('meta[name="description"]', 'content', metadata.description);
  setMeta('meta[property="og:title"]', 'content', metadata.title);
  setMeta('meta[property="og:description"]', 'content', metadata.description);
  setMeta('meta[property="og:locale"]', 'content', metadata.locale);

  try {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'mentora:meta',
        lang: current,
        title: metadata.title,
        description: metadata.description,
        hash: activeHash()
      }, location.origin);
    }
  } catch (_) {}

  window.addEventListener('hashchange', () => {
    languageLinks.forEach(link => {
      const code = (link.hreflang || '').toLowerCase().slice(0, 2);
      if (supported.has(code)) link.href = hrefFor(code);
    });
    try {
      if (window.parent !== window) window.parent.postMessage({ type: 'mentora:hash', hash: activeHash() }, location.origin);
    } catch (_) {}
  }, { passive: true });
})();
