/* Mentora Team & Story V47 */
(()=>{'use strict';
const d=document;
const lang=(d.documentElement.lang||'ru').toLowerCase().split('-')[0];
const text={ru:'языка публичной версии',uz:'ommaviy versiya tillari',en:'public version languages'};
const stats=[...d.querySelectorAll('.story-stats > div')];
if(stats[1]){
  const value=stats[1].querySelector('b');
  const caption=stats[1].querySelector('span');
  if(value)value.textContent='3';
  if(caption)caption.textContent=text[lang]||text.ru;
  stats[1].setAttribute('aria-label',`RU, UZ, EN — ${text[lang]||text.ru}`);
}
const hash=()=>{try{return parent&&parent!==window?(parent.location.hash||location.hash||''):(location.hash||'')}catch(_){return location.hash||''}};
const links=[...d.querySelectorAll('.lang-switcher a,.mobile-lang-switcher a')];
for(const link of links){
  const raw=(link.textContent||'').trim().toLowerCase();
  const code=raw==='uz'?'uz':raw==='en'?'en':'ru';
  link.href=`v47.html${code==='ru'?'':`?lang=${code}`}${hash()}`;
  link.target='_top';
  if(code===lang)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
}
})();
