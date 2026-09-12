// ======================== V22 / shareability + repeat-visit performance ========================
(() => {
  const root = document.documentElement;
  try {
    const navEntry = performance.getEntriesByType?.('navigation')?.[0];
    const alreadySeen = sessionStorage.getItem('mentora-team-seen') === '1';
    if (alreadySeen || navEntry?.type === 'back_forward') root.dataset.returnVisit = 'true';
    sessionStorage.setItem('mentora-team-seen', '1');
  } catch (_) {}

  document.querySelectorAll('.lang-switcher a,.mobile-lang-switcher a').forEach(link => {
    link.addEventListener('click', () => {
      const hash = location.hash;
      if (hash && !link.href.includes('#')) link.href += hash;
      try { localStorage.setItem('mentora-team-language', link.hreflang || link.textContent.trim().toLowerCase()); } catch (_) {}
    });
  });

  const lang = document.documentElement.lang || 'ru';
  const shareCopy = {
    ru:{title:'Mentora — Team & Story',text:'Познакомьтесь с Mentora — продуктом, системой и историей.',shared:'Окно отправки открыто',copied:'Ссылка скопирована'},
    uz:{title:'Mentora — Team & Story',text:'Mentora mahsuloti, tizimi va tarixi bilan tanishing.',shared:'Ulashish oynasi ochildi',copied:'Havola nusxalandi'},
    en:{title:'Mentora — Team & Story',text:'Explore the product, system and story behind Mentora.',shared:'Share sheet opened',copied:'Link copied'}
  }[lang] || null;
  const live = document.createElement('span');
  live.className='sr-only'; live.setAttribute('aria-live','polite'); live.setAttribute('aria-atomic','true');
  document.body.appendChild(live);

  document.querySelectorAll('.copy-product-link').forEach(button => {
    if (!navigator.share || !shareCopy) return;
    button.dataset.v22Share = 'true';
    button.addEventListener('click', async event => {
      event.stopImmediatePropagation();
      try {
        await navigator.share({title:shareCopy.title,text:shareCopy.text,url:location.href.split('#')[0]});
        live.textContent=shareCopy.shared;
      } catch (err) {
        if (err?.name === 'AbortError') return;
        try { await navigator.clipboard.writeText(location.href.split('#')[0]); live.textContent=shareCopy.copied; } catch (_) {}
      }
    }, {capture:true});
  });
})();
