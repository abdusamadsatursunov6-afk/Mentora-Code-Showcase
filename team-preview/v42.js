/* V42 — progressive semantics and below-the-fold image scheduling. */
(()=>{'use strict';
const d=document;

/* Founder photography is below the hero: do not let it compete with first-paint resources. */
d.querySelectorAll('#founder img, .founder-photo-card img').forEach(img=>{
  img.loading='lazy';
  img.decoding='async';
  try{img.fetchPriority='low'}catch(_){}
});

const menu=d.getElementById('mobileMenu');
const toggle=d.getElementById('menuToggle');
const syncMenuState=()=>{
  if(!menu||!toggle)return;
  const open=toggle.getAttribute('aria-expanded')==='true';
  menu.setAttribute('aria-hidden',open?'false':'true');
  if('inert' in menu) menu.inert=!open;
};
if(menu&&'inert' in menu) menu.inert=true;
toggle?.addEventListener('click',()=>requestAnimationFrame(syncMenuState));
new MutationObserver(syncMenuState).observe(toggle||d.documentElement,{attributes:true,attributeFilter:['aria-expanded']});

const links=[...d.querySelectorAll('[data-chapter-link], .nav a[href^="#"], .mobile-menu a[href^="#"]')];
const sections=[...d.querySelectorAll('main > section[id]')];
const markCurrent=id=>{
  if(!id)return;
  links.forEach(link=>{
    const current=link.getAttribute('href')===`#${id}`;
    if(current) link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
};

if('IntersectionObserver' in window&&sections.length){
  const visible=new Map();
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>entry.isIntersecting?visible.set(entry.target.id,entry.intersectionRatio):visible.delete(entry.target.id));
    if(!visible.size)return;
    const current=[...visible.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];
    markCurrent(current);
  },{rootMargin:'-28% 0px -56% 0px',threshold:[0,.2,.45,.7]});
  sections.forEach(section=>observer.observe(section));
}else{
  markCurrent((location.hash||'#story').slice(1));
}

window.addEventListener('hashchange',()=>markCurrent((location.hash||'#story').slice(1)),{passive:true});
})();
