/* V46 — production-safe language routing, preserving chapter state. */
(()=>{'use strict';
const d=document;
const supported=new Set(['ru','uz','en']);
const current=((d.documentElement.lang||'ru').toLowerCase().split('-')[0]);
const shellPath='v46.html';
const getShellHash=()=>{
  try{return window.parent&&window.parent!==window?(window.parent.location.hash||location.hash||''):(location.hash||'')}catch(_){return location.hash||''}
};
const buildHref=code=>`${shellPath}${code==='ru'?'':`?lang=${code}`}${getShellHash()}`;
const links=[...d.querySelectorAll('.lang-switcher a,.mobile-lang-switcher a')];
links.forEach(link=>{
  const raw=(link.textContent||'').trim().toLowerCase();
  const code=raw==='uz'?'uz':raw==='en'?'en':'ru';
  if(!supported.has(code))return;
  link.href=buildHref(code);
  link.target='_top';
  link.rel='nofollow';
  link.dataset.mentoraLang=code;
  link.addEventListener('click',()=>{link.href=buildHref(code)});
  if(code===current)link.setAttribute('aria-current','page');
  else link.removeAttribute('aria-current');
});

// Keep language URLs correct when the active chapter changes.
const refresh=()=>links.forEach(link=>{
  const code=link.dataset.mentoraLang;
  if(code)link.href=buildHref(code);
});
window.addEventListener('hashchange',refresh,{passive:true});
window.addEventListener('mentora:chapterchange',refresh);
refresh();
})();
