(() => {
  const root=document.documentElement;
  root.dataset.v25='true';
  const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  const effectiveType=connection?.effectiveType||'';
  const lowMemory=Number(navigator.deviceMemory||8)<=2;
  if(connection?.saveData||lowMemory||effectiveType==='slow-2g'||effectiveType==='2g') root.dataset.liteFx='true';

  const lang=(root.lang||'ru').toLowerCase().split('-')[0];
  const copy={
    ru:['MULTI','мультиязычный интерфейс'],
    en:['MULTI','multilingual interface'],
    uz:['MULTI','ko‘p tilli interfeys']
  }[lang]||['MULTI','multilingual interface'];
  const metric=document.querySelector('.metric-row .metric:nth-child(3)');
  if(metric){const value=metric.querySelector('span'),label=metric.querySelector('small');if(value){value.removeAttribute('data-count');value.removeAttribute('data-suffix');value.textContent=copy[0]}if(label)label.textContent=copy[1]}
  const heroVersion=document.querySelector('.hero-stage-label b'); if(heroVersion) heroVersion.textContent='MENTORA / SYSTEM';
  const languageFloat=document.querySelector('.product-float.pf-two span'); if(languageFloat) languageFloat.textContent='RU · UZ · EN';

  const stage=document.getElementById('productStage');
  const tabs=Array.from(document.querySelectorAll('#productModeBar [role="tab"]'));
  const syncTabLabel=()=>{if(!stage||!tabs.length)return;tabs.forEach((tab,i)=>{if(!tab.id)tab.id=`product-mode-${i+1}`});const active=tabs.find(tab=>tab.getAttribute('aria-selected')==='true')||tabs[0];stage.setAttribute('aria-labelledby',active.id)};
  tabs.forEach(tab=>tab.addEventListener('click',()=>requestAnimationFrame(syncTabLabel)));
  syncTabLabel();

  const languageLinks=Array.from(document.querySelectorAll('.lang-switcher a,.mobile-lang-switcher a'));
  const targetLang=href=>{const name=(href||'').split('/').pop()?.split('#')[0]?.split('?')[0];return name==='en.html'?'en':name==='uz.html'?'uz':'ru'};
  languageLinks.forEach(link=>link.addEventListener('click',event=>{
    if(window.top===window)return;
    event.preventDefault();
    const next=targetLang(link.getAttribute('href'));
    const hash=location.hash||'';
    window.top.location.href=`v25.html?lang=${next}${hash}`;
  }));
})();
