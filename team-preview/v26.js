(() => {
  const root=document.documentElement;
  root.dataset.v26='true';
  root.dataset.bundleVersion='26';

  const languageLinks=Array.from(document.querySelectorAll('.lang-switcher a,.mobile-lang-switcher a'));
  const fileFor={ru:'index.html',uz:'uz.html',en:'en.html'};
  const langOf=link=>(link.getAttribute('hreflang')||link.textContent||'').trim().toLowerCase();
  const sync=()=>{
    const hash=location.hash||'';
    languageLinks.forEach(link=>{
      const lang=langOf(link);
      if(fileFor[lang]) link.setAttribute('href',`${fileFor[lang]}${hash}`);
    });
  };
  addEventListener('hashchange',sync,{passive:true});
  addEventListener('pageshow',sync,{passive:true});
  sync();

  languageLinks.forEach(link=>{
    const lang=langOf(link);
    const active=lang===(root.lang||'ru').toLowerCase();
    link.classList.toggle('is-active',active);
    if(active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');

    if(window.top!==window){
      link.addEventListener('click',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        window.top.location.href=`v26.html?lang=${lang}${location.hash||''}`;
      },{capture:true});
    }
  });
})();
