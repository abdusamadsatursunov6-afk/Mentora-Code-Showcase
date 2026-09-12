// Mentora Team & Story V24 — production lifecycle guard
(() => {
  const root=document.documentElement;
  root.dataset.v24='ready';
  if (navigator.connection?.saveData) root.dataset.saveData='true';

  // Release the visual loader promptly after DOM readiness instead of waiting for every asset.
  const loader=document.querySelector('.page-loader');
  const release=()=>loader?.classList.add('is-hidden','hidden');
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(release,90),{once:true});
  else setTimeout(release,90);
  setTimeout(release,1200);

  // Decorative cursor work is desktop-only and rAF throttled.
  const glow=document.querySelector('.cursor-glow');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(pointer: fine)').matches;
  if(!fine||reduce||navigator.connection?.saveData){ glow?.remove(); }
  else if(glow){
    let frame=0,x=0,y=0;
    addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;if(!frame)frame=requestAnimationFrame(()=>{glow.style.left=x+'px';glow.style.top=y+'px';frame=0;});},{passive:true});
  }

  // External links get opener isolation consistently.
  document.querySelectorAll('a[target="_blank"]').forEach(a=>{
    const rel=new Set((a.rel||'').split(/\s+/).filter(Boolean));
    rel.add('noopener');rel.add('noreferrer');a.rel=[...rel].join(' ');
  });

  // Normalize mobile menu after bfcache restore/orientation changes.
  const menu=document.getElementById('mobileMenu'),toggle=document.getElementById('menuToggle');
  const normalize=()=>{
    if(!menu||!toggle)return;
    if(innerWidth>1100){menu.classList.remove('is-open','open');document.body.classList.remove('menu-open');}
    const open=menu.classList.contains('is-open')||menu.classList.contains('open');
    menu.setAttribute('aria-hidden',String(!open));toggle.setAttribute('aria-expanded',String(open));
    if('inert' in menu)menu.inert=!open;
  };
  addEventListener('pageshow',normalize,{passive:true});
  addEventListener('orientationchange',normalize,{passive:true});
  normalize();
})();
