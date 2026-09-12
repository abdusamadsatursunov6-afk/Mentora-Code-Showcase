// Mentora Team & Story V20 — production lifecycle and mobile interaction pass
(() => {
  const root=document.documentElement;
  const q=(s,p=document)=>p.querySelector(s);
  const qa=(s,p=document)=>Array.from(p.querySelectorAll(s));
  const syncVisibility=()=>{root.dataset.pageHidden=document.hidden?'true':'false'};
  document.addEventListener('visibilitychange',syncVisibility,{passive:true});
  syncVisibility();
  const bar=q('#productModeBar');
  if(bar){qa('[data-product-mode]',bar).forEach(btn=>btn.addEventListener('click',()=>{if(innerWidth<=760&&!reduceMotion){requestAnimationFrame(()=>btn.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'}));}}));}
  let wasMobile=innerWidth<=760;
  window.addEventListener('resize',()=>{const mobile=innerWidth<=760;if(mobile!==wasMobile){wasMobile=mobile;const heroObject=q('#heroObject');if(heroObject){heroObject.style.opacity='';heroObject.style.filter='';if(mobile)heroObject.style.transform='';}}},{passive:true});
})();
