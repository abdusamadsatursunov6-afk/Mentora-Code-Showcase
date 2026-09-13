/* V51 — version-safe language routing, canonical integrity, and verified locale presentation. */
(()=>{'use strict';
const d=document;
const supported=new Set(['ru','uz','en']);
const current=((d.documentElement.lang||'ru').toLowerCase().split('-')[0]);
const fallbackShell='v51.html';
const languageCaption={ru:'языка публичной версии',uz:'ommaviy versiya tillari',en:'public version languages'};
const languageName={ru:{ru:'Русский',uz:'O‘zbekcha',en:'English'},uz:{ru:'Ruscha',uz:'O‘zbekcha',en:'Inglizcha'},en:{ru:'Russian',uz:'Uzbek',en:'English'}};
const getShellPath=()=>{
  try{
    if(window.parent&&window.parent!==window){
      const name=(window.parent.location.pathname||'').split('/').pop()||'';
      if(/^v\d+\.html$/i.test(name))return name;
    }
  }catch(_){}
  return fallbackShell;
};
const getShellHash=()=>{
  try{return window.parent&&window.parent!==window?(window.parent.location.hash||location.hash||''):(location.hash||'')}catch(_){return location.hash||''}
};
const buildHref=code=>`${getShellPath()}${code==='ru'?'':`?lang=${code}`}${getShellHash()}`;
const syncOuterVersionMeta=()=>{
  try{
    if(!window.parent||window.parent===window)return;
    const p=window.parent;
    const pd=p.document;
    const cleanUrl=`${p.location.origin}${p.location.pathname}${p.location.search}${p.location.hash||''}`;
    const canonical=pd.querySelector('link[rel="canonical"]');
    if(canonical)canonical.href=cleanUrl;
    const ogUrl=pd.querySelector('meta[property="og:url"]');
    if(ogUrl)ogUrl.content=cleanUrl;
    const versionMatch=getShellPath().match(/^v(\d+)\.html$/i);
    if(versionMatch)pd.documentElement.dataset.publicVersion=versionMatch[1];
    pd.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link=>{
      const code=link.getAttribute('hreflang');
      const base=`${p.location.origin}${p.location.pathname}`;
      link.href=code==='uz'?`${base}?lang=uz`:code==='en'?`${base}?lang=en`:base;
    });
  }catch(_){}
};
const links=[...d.querySelectorAll('.lang-switcher a,.mobile-lang-switcher a')];
links.forEach(link=>{
  const raw=(link.textContent||'').trim().toLowerCase();
  const code=raw==='uz'?'uz':raw==='en'?'en':'ru';
  if(!supported.has(code))return;
  link.href=buildHref(code);
  link.target='_top';
  link.removeAttribute('rel');
  link.hreflang=code;
  link.lang=code;
  link.dataset.mentoraLang=code;
  link.setAttribute('aria-label',languageName[current]?.[code]||code.toUpperCase());
  link.addEventListener('click',()=>{link.href=buildHref(code)});
  if(code===current)link.setAttribute('aria-current','page');
  else link.removeAttribute('aria-current');
});

const stats=[...d.querySelectorAll('.story-stats > div')];
if(stats[1]){
  const value=stats[1].querySelector('b');
  const caption=stats[1].querySelector('span');
  if(value)value.textContent='3';
  if(caption)caption.textContent=languageCaption[current]||languageCaption.ru;
  stats[1].setAttribute('aria-label',`RU, UZ, EN — ${languageCaption[current]||languageCaption.ru}`);
}

const refresh=()=>{
  links.forEach(link=>{
    const code=link.dataset.mentoraLang;
    if(code)link.href=buildHref(code);
  });
  syncOuterVersionMeta();
};
window.addEventListener('hashchange',refresh,{passive:true});
window.addEventListener('mentora:chapterchange',refresh);
window.addEventListener('pageshow',refresh,{passive:true});
try{
  if(window.parent&&window.parent!==window){
    window.parent.addEventListener('hashchange',syncOuterVersionMeta,{passive:true});
    window.parent.addEventListener('pageshow',syncOuterVersionMeta,{passive:true});
  }
}catch(_){}
refresh();
})();
