/* V43 — navigation resilience, language semantics and BFCache recovery. */
(()=>{'use strict';
const d=document;
const w=window;
const supported=['ru','uz','en'];
const declared=(d.documentElement.lang||'ru').toLowerCase().split('-')[0];
const lang=supported.includes(declared)?declared:'ru';
const labels={
  ru:{nav:'Текущий раздел',langs:{ru:'Русский язык',uz:'Узбекский язык',en:'Английский язык'}},
  uz:{nav:'Joriy bo‘lim',langs:{ru:'Rus tili',uz:'O‘zbek tili',en:'Ingliz tili'}},
  en:{nav:'Current section',langs:{ru:'Russian',uz:'Uzbek',en:'English'}}
};

d.querySelectorAll('main > section[id], #top, #contact').forEach(node=>{
  node.style.scrollMarginTop='96px';
});

const languageLinks=[...d.querySelectorAll('.lang-switcher a, .mobile-lang-switcher a')];
languageLinks.forEach(link=>{
  const text=(link.textContent||'').trim().toLowerCase();
  const code=text==='uz'?'uz':text==='en'?'en':'ru';
  link.setAttribute('lang',code);
  link.setAttribute('hreflang',code);
  link.setAttribute('aria-label',labels[lang].langs[code]);
  if(code===lang) link.setAttribute('aria-current','page');
  else link.removeAttribute('aria-current');
});

let live=d.getElementById('v43SectionStatus');
if(!live){
  live=d.createElement('div');
  live.id='v43SectionStatus';
  live.className='v43-sr-only';
  live.setAttribute('role','status');
  live.setAttribute('aria-live','polite');
  live.setAttribute('aria-atomic','true');
  d.body.appendChild(live);
}
const chapterLinks=[...d.querySelectorAll('[data-chapter-link], .chapter-rail a[href^="#"], .nav a[href^="#"], .mobile-menu a[href^="#"]')];
const announce=id=>{
  if(!id)return;
  const match=chapterLinks.find(a=>a.getAttribute('href')===`#${id}`);
  const name=(match?.querySelector('b')?.textContent||match?.textContent||id).replace(/^\s*\d+\s*/,'').trim();
  if(name) live.textContent=`${labels[lang].nav}: ${name}`;
};

const normalizeHash=()=>{
  const id=(location.hash||'#story').slice(1);
  if(d.getElementById(id)) announce(id);
};
w.addEventListener('hashchange',normalizeHash,{passive:true});
normalizeHash();

w.addEventListener('pageshow',event=>{
  if(!event.persisted)return;
  const menu=d.getElementById('mobileMenu');
  const toggle=d.getElementById('menuToggle');
  if(menu&&toggle){
    const open=toggle.getAttribute('aria-expanded')==='true';
    menu.setAttribute('aria-hidden',open?'false':'true');
    if('inert' in menu) menu.inert=!open;
  }
  requestAnimationFrame(normalizeHash);
},{passive:true});

w.addEventListener('orientationchange',()=>requestAnimationFrame(()=>{
  d.documentElement.scrollLeft=0;
  d.body.scrollLeft=0;
}),{passive:true});
})();
