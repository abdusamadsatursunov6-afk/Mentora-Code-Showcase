/* V43 — navigation resilience, language semantics and BFCache recovery. */
(()=>{'use strict';
const d=document;
const w=window;
const supported=['ru','uz','en'];
const queryLang=new URLSearchParams(w.parent===w?location.search:w.parent.location.search).get('lang');
const lang=supported.includes(queryLang)?queryLang:'ru';
const labels={
  ru:{nav:'Текущий раздел',langs:{ru:'Русский язык',uz:'Узбекский язык',en:'Английский язык'}},
  uz:{nav:'Joriy bo‘lim',langs:{ru:'Rus tili',uz:'O‘zbek tili',en:'Ingliz tili'}},
  en:{nav:'Current section',langs:{ru:'Russian',uz:'Uzbek',en:'English'}}
};

/* Anchor targets should not hide beneath the sticky header. */
d.querySelectorAll('main > section[id], #top, #contact').forEach(node=>{
  node.style.scrollMarginTop='96px';
});

/* Make language controls explicit to assistive technology and keep the current language obvious. */
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

/* Announce chapter changes without adding visible UI noise. */
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
  const target=d.getElementById(id);
  if(target) announce(id);
};
w.addEventListener('hashchange',normalizeHash,{passive:true});
normalizeHash();

/* BFCache restores can leave observers/menu state stale in mobile Safari and Chromium. */
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

/* Prevent accidental horizontal viewport drift after orientation changes. */
w.addEventListener('orientationchange',()=>requestAnimationFrame(()=>{
  d.documentElement.scrollLeft=0;
  d.body.scrollLeft=0;
}),{passive:true});
})();
