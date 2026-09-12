(() => {
  const lang=(document.documentElement.lang||'ru').toLowerCase().slice(0,2);
  const copy={
    ru:{modeLabel:'Режимы демонстрации Mentora',modes:[['01','CREATE','Конструктор урока'],['02','OPERATE','Работа класса'],['03','UNDERSTAND','Обзор результатов']],closing:['MENTORA / NEXT CHAPTER','Не ещё один сервис.','Одна образовательная система.','Mentora развивается вокруг одной идеи: соединить подготовку урока, работу класса, результаты и управление школой в понятный ежедневный процесс.']},
    en:{modeLabel:'Mentora product demo modes',modes:[['01','CREATE','Lesson builder'],['02','OPERATE','Class workflow'],['03','UNDERSTAND','Results overview']],closing:['MENTORA / NEXT CHAPTER','Not another tool.','One education system.','Mentora is growing around one idea: connect lesson preparation, classroom work, results, and school operations into one clear daily flow.']},
    uz:{modeLabel:'Mentora mahsulot demo rejimlari',modes:[['01','CREATE','Dars konstruktori'],['02','OPERATE','Sinf jarayoni'],['03','UNDERSTAND','Natijalar ko‘rinishi']],closing:['MENTORA / NEXT CHAPTER','Yana bir servis emas.','Bitta ta’lim tizimi.','Mentora bitta g‘oya atrofida rivojlanadi: dars tayyorlash, sinf jarayoni, natijalar va maktab boshqaruvini bitta tushunarli kundalik oqimga bog‘lash.']}
  }[lang]||null;
  const c=copy||{};
  const stage=document.getElementById('productStage');
  if(stage&&!document.getElementById('productModeBar')){
    const bar=document.createElement('div');bar.className='product-mode-bar reveal is-visible';bar.id='productModeBar';bar.setAttribute('aria-label',c.modeLabel||'Mentora product modes');
    bar.innerHTML=(c.modes||[]).map((m,i)=>`<button class="${i===0?'is-active':''}" type="button" data-product-mode="${i}"><small>${m[0]}</small><b>${m[1]}</b><span>${m[2]}</span></button>`).join('');
    stage.parentNode.insertBefore(bar,stage);
  }
  const dashMain=document.querySelector('#productStage .dash-main');
  if(dashMain&&!dashMain.querySelector('.cockpit-telemetry')){
    const el=document.createElement('div');el.className='cockpit-telemetry';el.setAttribute('aria-hidden','true');el.innerHTML='<span><i></i> LIVE PRODUCT DEMO</span><b id="cockpitModeLabel">CREATE / LESSON</b>';
    const form=dashMain.querySelector('.lesson-form');if(form)dashMain.insertBefore(el,form);
  }
  const contact=document.getElementById('contact');
  if(contact&&!contact.querySelector('.closing-console')){
    const grid=contact.querySelector('.contact-grid');const box=document.createElement('div');box.className='closing-console reveal is-visible';
    box.innerHTML=`<div class="closing-visual" aria-hidden="true"><div class="closing-orbit co-1"></div><div class="closing-orbit co-2"></div><div class="closing-orbit co-3"></div><div class="closing-core"><span>M</span><small>EDUCATION × AI</small></div><i class="closing-node cn-1"></i><i class="closing-node cn-2"></i><i class="closing-node cn-3"></i></div><div class="closing-copy"><small>${c.closing?.[0]||'MENTORA / NEXT CHAPTER'}</small><h3>${c.closing?.[1]||'Not another tool.'}<br><em>${c.closing?.[2]||'One education system.'}</em></h3><p>${c.closing?.[3]||''}</p><div class="closing-tags"><span>BUILT IN UZBEKISTAN</span><span>EDUCATION FIRST</span><span>DESIGNED TO SCALE</span></div></div>`;
    if(grid)contact.insertBefore(box,grid);else contact.appendChild(box);
  }
  const version=document.querySelector('.version-tag');if(version)version.textContent='SITE V18';
  const heroVer=document.querySelector('.hero-stage-label b');if(heroVer)heroVer.textContent='MENTORA / 18';
})();
// ======================== V18 / product cockpit modes ========================
(() => {
  const q=(s,p=document)=>p.querySelector(s), qa=(s,p=document)=>Array.from(p.querySelectorAll(s));
  const lang=(document.documentElement.lang||'ru').toLowerCase().slice(0,2);
  const stage=q('#productStage'), bar=q('#productModeBar');
  if(!stage||!bar)return;

  const productModes={
    ru:[
      {mode:'CREATE / LESSON',head:'Создать новый урок',action:'Сгенерировать урок',ready:'Mentora AI готов к генерации',hint:'Выберите контекст урока и запустите интерактивную демонстрацию.',working:'Mentora AI собирает урок…',done:'Урок собран в единый поток',fields:[['ПРЕДМЕТ','Математика'],['КЛАСС','7 класс'],['ТЕМА','Линейные уравнения']],outputs:[['Теория','Структурированное объяснение темы'],['Практика','Задания по уровню класса'],['Тест','Проверка понимания материала'],['Домашнее задание','Персональная практика ученика']],sidebar:0},
      {mode:'OPERATE / CLASS',head:'Рабочее пространство класса',action:'Открыть рабочий поток',ready:'Класс готов к работе',hint:'Один экран связывает занятие, задания, журнал и коммуникацию.',working:'Собираем рабочее пространство…',done:'Рабочий поток класса готов',fields:[['КЛАСС','7A'],['СТАТУС','Активный класс'],['СЕГОДНЯ','Математика']],outputs:[['Посещаемость','Быстрая отметка участия'],['Задания','Материалы и домашняя работа'],['Журнал','Результаты внутри класса'],['Связь','Контекст для родителей и школы']],sidebar:1},
      {mode:'UNDERSTAND / INSIGHTS',head:'Обзор результатов',action:'Обновить обзор',ready:'Аналитика готова к обновлению',hint:'Mentora собирает учебные сигналы в понятную картину для школы.',working:'Обновляем обзор результатов…',done:'Обзор результатов обновлён',fields:[['ПЕРИОД','Текущая неделя'],['КЛАСС','7A'],['ФОКУС','Линейные уравнения']],outputs:[['Прогресс','Динамика освоения темы'],['Посещаемость','Картина участия в занятиях'],['Домашняя работа','Статус выполнения заданий'],['Следующий шаг','Что требует внимания учителя']],sidebar:4}
    ],
    en:[
      {mode:'CREATE / LESSON',head:'Create a new lesson',action:'Generate lesson',ready:'Mentora AI is ready',hint:'Choose lesson context and start the interactive product demo.',working:'Mentora AI is assembling the lesson…',done:'Lesson assembled into one flow',fields:[['SUBJECT','Mathematics'],['GRADE','Grade 7'],['TOPIC','Linear equations']],outputs:[['Theory','Structured explanation of the topic'],['Practice','Tasks adapted to the class level'],['Test','Check understanding'],['Homework','Personalized student practice']],sidebar:0},
      {mode:'OPERATE / CLASS',head:'Class workspace',action:'Open class workflow',ready:'Class workspace is ready',hint:'One screen connects the lesson, assignments, gradebook and communication.',working:'Building the class workspace…',done:'Class workflow is ready',fields:[['CLASS','7A'],['STATUS','Active class'],['TODAY','Mathematics']],outputs:[['Attendance','Quick participation check'],['Assignments','Materials and homework'],['Gradebook','Results inside the class'],['Communication','Context for families and school']],sidebar:1},
      {mode:'UNDERSTAND / INSIGHTS',head:'Results overview',action:'Refresh overview',ready:'Insights are ready to refresh',hint:'Mentora turns learning signals into a clear picture for the school.',working:'Refreshing learning insights…',done:'Results overview refreshed',fields:[['PERIOD','Current week'],['CLASS','7A'],['FOCUS','Linear equations']],outputs:[['Progress','Topic learning trajectory'],['Attendance','Participation picture'],['Homework','Assignment completion status'],['Next step','What needs teacher attention']],sidebar:4}
    ],
    uz:[
      {mode:'CREATE / LESSON',head:'Yangi dars yaratish',action:'Dars yaratish',ready:'Mentora AI tayyor',hint:'Dars kontekstini tanlang va interaktiv mahsulot demosini ishga tushiring.',working:'Mentora AI darsni yig‘moqda…',done:'Dars yagona oqimga yig‘ildi',fields:[['FAN','Matematika'],['SINF','7-sinf'],['MAVZU','Chiziqli tenglamalar']],outputs:[['Nazariya','Mavzuning tuzilgan tushuntirishi'],['Amaliyot','Sinf darajasiga mos topshiriqlar'],['Test','Tushunishni tekshirish'],['Uy vazifasi','O‘quvchi uchun shaxsiy amaliyot']],sidebar:0},
      {mode:'OPERATE / CLASS',head:'Sinf ish maydoni',action:'Sinf oqimini ochish',ready:'Sinf ishga tayyor',hint:'Bitta ekran dars, topshiriqlar, jurnal va aloqani bog‘laydi.',working:'Sinf ish maydonini yig‘moqdamiz…',done:'Sinf ish oqimi tayyor',fields:[['SINF','7A'],['HOLAT','Faol sinf'],['BUGUN','Matematika']],outputs:[['Davomat','Ishtirokni tez belgilash'],['Topshiriqlar','Materiallar va uy vazifasi'],['Jurnal','Sinf ichidagi natijalar'],['Aloqa','Ota-ona va maktab uchun kontekst']],sidebar:1},
      {mode:'UNDERSTAND / INSIGHTS',head:'Natijalar ko‘rinishi',action:'Ko‘rinishni yangilash',ready:'Tahlil yangilanishga tayyor',hint:'Mentora o‘quv signallarini maktab uchun tushunarli manzaraga aylantiradi.',working:'Natijalar ko‘rinishini yangilamoqdamiz…',done:'Natijalar ko‘rinishi yangilandi',fields:[['DAVR','Joriy hafta'],['SINF','7A'],['FOKUS','Chiziqli tenglamalar']],outputs:[['Rivojlanish','Mavzuni o‘zlashtirish dinamikasi'],['Davomat','Darslardagi ishtirok manzarasi'],['Uy vazifasi','Topshiriqlar bajarilishi holati'],['Keyingi qadam','O‘qituvchi e’tibor berishi kerak bo‘lgan joy']],sidebar:4}
    ]
  };
  const modes=productModes[lang]||productModes.ru;
  const buttons=qa('[data-product-mode]',bar), nav=qa('.dash-nav',stage), fields=qa('.form-field',stage), outputs=qa('.demo-output',stage), head=q('.dash-main-head h3',stage), telemetry=q('#cockpitModeLabel',stage), status=q('#generationStatus',stage);
  const oldButton=q('#generateDemo',stage);
  if(!oldButton)return;
  const actionButton=oldButton.cloneNode(true);oldButton.replaceWith(actionButton);
  const actionLabel=q('.generate-label',actionButton);
  let current=0,running=false;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));

  const softSwap=(el,text)=>{if(!el)return;el.style.opacity='.2';el.style.transform='translateY(4px)';setTimeout(()=>{el.textContent=text;el.style.opacity='';el.style.transform='';},100)};
  const applyMode=(i,animate=true)=>{
    current=i;const m=modes[i];stage.dataset.productMode=String(i);bar.dataset.active=String(i);buttons.forEach((b,j)=>b.classList.toggle('is-active',i===j));nav.forEach((n,j)=>n.classList.toggle('active',j===m.sidebar));
    outputs.forEach(card=>card.classList.remove('demo-ready','demo-loading'));
    const shell=q('#dashboardShell',stage);if(animate&&shell){shell.classList.add('v18-switching');setTimeout(()=>shell.classList.remove('v18-switching'),390)}
    softSwap(head,m.head);softSwap(telemetry,m.mode);if(actionLabel)softSwap(actionLabel,m.action);
    fields.forEach((f,j)=>{const pair=m.fields[j];if(!pair)return;softSwap(q('small',f),pair[0]);softSwap(q('b',f),pair[1]);});
    outputs.forEach((card,j)=>{const pair=m.outputs[j];if(!pair)return;softSwap(q('b',card),pair[0]);softSwap(q('small',card),pair[1]);});
    if(status){status.className='generation-status';q('b',status).textContent=m.ready;q('small',status).textContent=m.hint;}
  };
  buttons.forEach((b,i)=>b.addEventListener('click',()=>{if(!running)applyMode(i,true)}));

  actionButton.addEventListener('click',async()=>{
    if(running)return;running=true;const m=modes[current];outputs.forEach(c=>c.classList.remove('demo-ready','demo-loading'));actionButton.classList.add('is-generating');
    if(actionLabel)actionLabel.textContent=m.working;if(status){status.className='generation-status is-generating';q('b',status).textContent=m.working;q('small',status).textContent=m.hint;}
    for(let i=0;i<outputs.length;i++){const card=outputs[i];card.classList.add('demo-loading');await wait(reduceMotion?45:360);card.classList.remove('demo-loading');card.classList.add('demo-ready');if(status){q('b',status).textContent=m.outputs[i][0];q('small',status).textContent=`${i+1} / ${outputs.length}`;}}
    if(status){status.className='generation-status is-ready';q('b',status).textContent=m.done;q('small',status).textContent=m.hint;}if(actionLabel)actionLabel.textContent=m.action;actionButton.classList.remove('is-generating');running=false;
  });
  applyMode(0,false);

  const closing=q('.closing-console');
  if(closing&&!reduceMotion){closing.addEventListener('pointermove',e=>{if(innerWidth<760)return;const r=closing.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;const visual=q('.closing-visual',closing);if(visual)visual.style.transform=`rotateX(${-y*3}deg) rotateY(${x*5}deg) translate3d(${x*5}px,${y*4}px,0)`;},{passive:true});closing.addEventListener('pointerleave',()=>{const visual=q('.closing-visual',closing);if(visual)visual.style.transform='';});}
})();
