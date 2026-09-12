// ======================== V23 / resilience + long-form navigation ========================
(() => {
  const labels={ru:'Наверх',en:'Back to top',uz:'Yuqoriga'};
  let backToTop = document.getElementById('backToTop');
  if (!backToTop) {
    backToTop=document.createElement('a');
    backToTop.id='backToTop'; backToTop.className='back-to-top'; backToTop.href='#top';
    const label=labels[(document.documentElement.lang||'ru').slice(0,2)]||labels.ru;
    backToTop.setAttribute('aria-label',label); backToTop.title=label; backToTop.innerHTML='<span aria-hidden="true">↑</span>';
    document.body.appendChild(backToTop);
  }
  if (backToTop) {
    let raf = 0;
    const sync = () => {
      backToTop.classList.toggle('is-visible', window.scrollY > Math.max(720, window.innerHeight * 1.15));
      raf = 0;
    };
    const requestSync = () => { if (!raf) raf = requestAnimationFrame(sync); };
    window.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('resize', requestSync, { passive: true });
    backToTop.addEventListener('click', event => {
      if (reduceMotion) return;
      event.preventDefault();
      document.getElementById('top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `${location.pathname}${location.search}`);
    });
    sync();
  }

  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    img.fetchPriority = 'low';
    img.addEventListener('error', () => img.classList.add('is-image-error'), { once: true });
  });

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  }
})();