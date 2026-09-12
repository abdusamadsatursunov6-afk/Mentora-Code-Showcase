// V35 — factual hygiene, accessibility polish, and resilient public copy.
(() => {
  const root = document.documentElement;
  root.dataset.bundleVersion = '35';

  const lang = ['ru', 'uz', 'en'].includes((root.lang || '').slice(0, 2).toLowerCase())
    ? (root.lang || '').slice(0, 2).toLowerCase()
    : 'ru';

  const copy = {
    ru: {
      multi: 'MULTI',
      multiLabel: 'мультиязычный интерфейс',
      skip: 'Перейти к содержанию',
      progress: 'Прогресс просмотра страницы'
    },
    uz: {
      multi: 'MULTI',
      multiLabel: 'ko‘p tilli interfeys',
      skip: 'Asosiy mazmunga o‘tish',
      progress: 'Sahifani ko‘rish jarayoni'
    },
    en: {
      multi: 'MULTI',
      multiLabel: 'multilingual interface',
      skip: 'Skip to main content',
      progress: 'Page reading progress'
    }
  }[lang];

  const setText = (node, text) => {
    if (node && node.textContent !== text) node.textContent = text;
  };

  const enforceFactualCopy = () => {
    // The public page must not display an unverified language-count claim.
    const storyMetric = document.querySelector('.story-stats > div:nth-child(2)');
    if (storyMetric) {
      const value = storyMetric.querySelector('b, span');
      const label = storyMetric.querySelector('span, small');
      setText(value, copy.multi);
      if (label && label !== value) setText(label, copy.multiLabel);
    }

    const productMetric = document.querySelector('.metric-row .metric:nth-child(3)');
    if (productMetric) {
      const value = productMetric.querySelector('span');
      const label = productMetric.querySelector('small');
      if (value) {
        value.removeAttribute('data-count');
        value.removeAttribute('data-suffix');
        setText(value, copy.multi);
      }
      setText(label, copy.multiLabel);
    }

    setText(document.querySelector('.hero-stage-label b'), 'MENTORA / SYSTEM');
    setText(document.querySelector('.skip-link'), copy.skip);
  };

  enforceFactualCopy();

  // Guard against legacy counter/i18n layers restoring stale marketing copy later.
  const guardedNodes = [
    document.querySelector('.story-stats'),
    document.querySelector('.metric-row')
  ].filter(Boolean);
  if ('MutationObserver' in window && guardedNodes.length) {
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        enforceFactualCopy();
      });
    });
    guardedNodes.forEach(node => observer.observe(node, { childList: true, subtree: true, characterData: true }));
  }

  // Expose visual scroll progress to assistive technology without changing the design.
  const progress = document.getElementById('scrollProgress');
  if (progress) {
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-label', copy.progress);
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', '100');

    let raf = 0;
    const updateProgress = () => {
      raf = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const value = Math.max(0, Math.min(100, Math.round((scrollY / max) * 100)));
      progress.setAttribute('aria-valuenow', String(value));
    };
    const queueProgress = () => {
      if (!raf) raf = requestAnimationFrame(updateProgress);
    };
    addEventListener('scroll', queueProgress, { passive: true });
    addEventListener('resize', queueProgress, { passive: true });
    addEventListener('pageshow', queueProgress, { passive: true });
    updateProgress();
  }

  // Explicitly hide purely decorative layers from accessibility trees.
  document.querySelectorAll('.noise,.cursor-glow,.hero-grid,.hero-blur,.hero-wordmark,.hero-corridor,.hero-ribbons,.hero-focus-cross')
    .forEach(node => node.setAttribute('aria-hidden', 'true'));
})();
