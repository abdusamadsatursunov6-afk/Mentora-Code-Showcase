(()=>{
  const q=(s,p=document)=>p.querySelector(s),qa=(s,p=document)=>Array.from(p.querySelectorAll(s));
  const menu=q('#mobileMenu'),toggle=q('#menuToggle');
  if(menu&&toggle){
    menu.setAttribute('role','dialog');menu.setAttribute('aria-modal','true');
    if('inert' in menu)menu.inert=!menu.classList.contains('open')&&!menu.classList.contains('is-open');
    const focusables=()=>qa('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])',menu);
    let lastFocus=null;
    const opened=()=>menu.classList.contains('open')||menu.classList.contains('is-open')||menu.getAttribute('aria-hidden')==='false';
    const sync=()=>{const o=opened();if('inert' in menu)menu.inert=!o;if(o){lastFocus=lastFocus||document.activeElement;requestAnimationFrame(()=>focusables()[0]?.focus());}}
    toggle.addEventListener('click',()=>setTimeout(sync,0));
    qa('a',menu).forEach(a=>a.addEventListener('click',()=>{if(lastFocus instanceof HTMLElement)setTimeout(()=>lastFocus.focus({preventScroll:true}),0);lastFocus=null;}));
    addEventListener('keydown',e=>{if(!opened())return;if(e.key==='Escape'){setTimeout(()=>{if(lastFocus instanceof HTMLElement)lastFocus.focus({preventScroll:true});lastFocus=null;},0);return;}if(e.key!=='Tab')return;const items=focusables();if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
  }
  const bar=q('#productModeBar'),stage=q('#productStage');
  if(bar&&stage){
    bar.setAttribute('role','tablist');stage.setAttribute('role','tabpanel');stage.setAttribute('tabindex','0');stage.setAttribute('aria-live','polite');
    const tabs=qa('[data-product-mode]',bar);
    const setSemantics=i=>tabs.forEach((b,j)=>{b.setAttribute('role','tab');b.setAttribute('aria-controls','productStage');b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;});
    const activeIndex=()=>Math.max(0,tabs.findIndex(b=>b.classList.contains('is-active')));
    setSemantics(activeIndex());
    tabs.forEach((b,i)=>{b.addEventListener('click',()=>setTimeout(()=>setSemantics(activeIndex()),0));b.addEventListener('keydown',e=>{let n=null;if(e.key==='ArrowRight'||e.key==='ArrowDown')n=(i+1)%tabs.length;if(e.key==='ArrowLeft'||e.key==='ArrowUp')n=(i-1+tabs.length)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n===null)return;e.preventDefault();tabs[n].click();tabs[n].focus();setSemantics(n);});});
  }
  document.documentElement.dataset.v21='true';
})();