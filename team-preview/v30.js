// V30 — deep-linkable chapters, section-aware sharing and stronger navigation semantics.
(() => {
  document.documentElement.dataset.bundleVersion = '30';

  const lang = (document.documentElement.lang || 'ru').toLowerCase().slice(0, 2);
  const copy = {
    ru: { share: 'Поделиться разделом', copied: 'Ссылка на раздел скопирована' },
    en: { share: 'Share this section', copied: 'Section link copied' },
    uz: { share: 'Bo‘limni ulashish', copied: 'Bo‘lim havolasi nusxalandi' }
  }[lang] || { share: 'Share this section', copied: 'Section link copied' };

  const chapterIds = ['story','origin','founder','builder','dna','product','experience','vision','journey','team','contact'];
  const sections = chapterIds.map(id => document.getElementById(id)).filter(Boolean);
  const navLinks = [...document.querySelectorAll('a[href^="#"]')].filter(a => chapterIds.includes(a.getAttribute('href').slice(1)));
  const languageLinks = [...document.querySelectorAll('.lang-link, .mobile-lang-switcher a')];
  const shareButton = document.querySelector('.share-product-link');
  let activeId = location.hash.slice(1);
  if (!chapterIds.includes(activeId)) activeId = 'story';

  const sectionLabel = id => {
    const section = document.getElementById(id);
    const heading = section?.querySelector('h2, h1, h3');
    return heading?.textContent?.replace(/\s+/g, ' ').trim() || 'Mentora — Team & Story';
  };

  const canonicalBase = () => {
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    if (canonical) return canonical.split('#')[0];
    return `${location.origin}${location.pathname}`;
  };

  const sectionUrl = id => `${canonicalBase()}#${encodeURIComponent(id)}`;

  const announce = message => {
    const toast = document.getElementById('siteToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(announce.timer);
    announce.timer = setTimeout(() => toast.classList.remove('show'), 1800);
  };

  const copyUrl = async url => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (_) {
      const field = document.createElement('textarea');
      field.value = url;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;inset:0 auto auto -9999px;opacity:0';
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    announce(copy.copied);
  };

  const syncLanguageLinks = id => {
    languageLinks.forEach(link => {
      const raw = link.getAttribute('href') || '';
      const base = raw.split('#')[0];
      link.setAttribute('href', `${base}#${id}`);
    });
  };

  const syncNavState = id => {
    navLinks.forEach(link => {
      const isCurrent = link.getAttribute('href') === `#${id}`;
      if (isCurrent) link.setAttribute('aria-current', 'location');
      else if (link.getAttribute('aria-current') === 'location') link.removeAttribute('aria-current');
    });
    document.body.dataset.activeChapter = id;
    syncLanguageLinks(id);
    if (shareButton) {
      shareButton.setAttribute('aria-label', `${copy.share}: ${sectionLabel(id)}`);
      shareButton.dataset.activeSection = id;
    }
  };

  const setActive = (id, syncUrl = true) => {
    if (!chapterIds.includes(id) || activeId === id) {
      syncNavState(activeId);
      return;
    }
    activeId = id;
    syncNavState(id);
    if (syncUrl && history.replaceState) {
      history.replaceState(history.state, '', `#${id}`);
      window.dispatchEvent(new CustomEvent('mentora:chapterchange', { detail: { id } }));
    }
  };

  syncNavState(activeId);

  if ('IntersectionObserver' in window) {
    const ratios = new Map();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0));
      const best = sections
        .map(section => ({ id: section.id, ratio: ratios.get(section.id) || 0 }))
        .sort((a, b) => b.ratio - a.ratio)[0];
      if (best?.ratio > 0) setActive(best.id, true);
    }, { rootMargin: '-18% 0px -58% 0px', threshold: [0, .08, .18, .35, .6] });
    sections.forEach(section => observer.observe(section));
  }

  navLinks.forEach(link => link.addEventListener('click', () => {
    const id = link.getAttribute('href').slice(1);
    if (chapterIds.includes(id)) setActive(id, true);
  }, { passive: true }));

  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (chapterIds.includes(id)) setActive(id, false);
  }, { passive: true });

  shareButton?.addEventListener('click', async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const id = shareButton.dataset.activeSection || activeId;
    const url = sectionUrl(id);
    const title = `Mentora — ${sectionLabel(id)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    await copyUrl(url);
  }, true);

  window.addEventListener('load', () => {
    const id = location.hash.slice(1);
    const target = chapterIds.includes(id) ? document.getElementById(id) : null;
    if (!target) return;
    requestAnimationFrame(() => requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'auto' })));
  }, { once: true });
})();
