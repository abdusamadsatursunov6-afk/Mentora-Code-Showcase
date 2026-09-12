// V33 — accessible mobile nav, focus containment and coarse-pointer safeguards.
(() => {
  const root = document.documentElement;
  root.dataset.bundleVersion = '33';

  const menu = document.getElementById('mobileMenu');
  const toggle = document.getElementById('menuToggle');
  if (!menu || !toggle) return;

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  let lastFocused = null;

  const isOpen = () =>
    menu.classList.contains('open') ||
    menu.getAttribute('aria-hidden') === 'false';

  const syncState = (open, { restoreFocus = false } = {}) => {
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    root.dataset.menuOpen = String(open);

    if (open) {
      lastFocused = document.activeElement;
      const first = menu.querySelector(focusableSelector);
      requestAnimationFrame(() => first?.focus({ preventScroll: true }));
    } else if (restoreFocus) {
      requestAnimationFrame(() => {
        const target = lastFocused instanceof HTMLElement ? lastFocused : toggle;
        target.focus({ preventScroll: true });
      });
    }
  };

  // Capture phase runs before the legacy click handler and normalizes the final state.
  toggle.addEventListener('click', () => {
    queueMicrotask(() => syncState(isOpen()));
  }, true);

  menu.addEventListener('click', event => {
    if (event.target.closest('a[href]')) {
      queueMicrotask(() => syncState(false));
    }
  }, true);

  document.addEventListener('keydown', event => {
    if (!isOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      syncState(false, { restoreFocus: true });
      return;
    }

    if (event.key !== 'Tab') return;

    const items = [...menu.querySelectorAll(focusableSelector)]
      .filter(el => !el.hasAttribute('hidden') && el.getClientRects().length);
    if (!items.length) {
      event.preventDefault();
      toggle.focus();
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Close stale mobile-menu state when viewport switches to desktop.
  const desktop = matchMedia('(min-width: 761px)');
  const onViewportChange = event => {
    if (event.matches && isOpen()) syncState(false);
  };
  desktop.addEventListener?.('change', onViewportChange);

  // BFCache/session restoration must never leave the document scroll-locked.
  addEventListener('pageshow', () => {
    if (!isOpen()) root.dataset.menuOpen = 'false';
  }, { passive: true });

  // Disable hover-only motion semantics on coarse pointers without altering visuals.
  if (matchMedia('(hover: none), (pointer: coarse)').matches) {
    root.dataset.pointerMode = 'coarse';
  }

  // Initial ARIA/scroll state normalization.
  syncState(isOpen());
})();
