'use strict';
const data = window.ALASH_DATA;
const main = document.querySelector('#main');
const menu = document.querySelector('#site-menu');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const paths = {
 home:'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
 rankings:'M4 21V11h3v10M11 21V3h3v18M18 21V7h3v14',
 fighters:'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-3a4 4 0 0 0-3-4M16 3a4 4 0 0 1 0 7',
 champions:'M8 3h8v7a4 4 0 0 1-8 0ZM8 5H3v3a5 5 0 0 0 5 5M16 5h5v3a5 5 0 0 1-5 5M12 14v7M8 21h8',
 events:'M5 5h14v16H5ZM8 2v6M16 2v6M5 10h14M9 14h6M9 17h4',
 news:'M5 3h14v18H5ZM8 7h8M8 11h8M8 15h8M8 18h5',
 video:'M3 5h18v14H3ZM10 9l5 3-5 3Z',
 about:'M12 17v-5M12 8h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 search:'M21 21l-6-6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
 menu:'M4 6h16M4 12h16M4 18h16',
 more:'M4 12h.01M12 12h.01M20 12h.01'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${name==='more'?'<circle cx="4" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="20" cy="12" r="1"/>':`<path d="${paths[name]||paths.about}"/>`}</svg>`;
const links=[['home','Главная'],['rankings','Рейтинг бойцов'],['fighters','Бойцы'],['champions','Чемпионы'],['events','Турниры'],['news','Новости'],['video','Видео'],['results','Результаты'],['about','О лиге']];
const fighterById = id => data.fighters.find(f=>f.id===id);
const divisionById = id => data.divisions.find(d=>d.id===id);
const isChampion = f => data.divisions.some(d=>d.champion===f.id);
const portrait = f => `<img class="portrait ${f.photo?'':'placeholder'}" src="${esc(f.photo||'fighter-placeholder.svg')}" alt="${f.photo?esc(f.name):'Фото бойца пока не добавлено'}" loading="lazy">`;
const record = f => `<span class="record" aria-label="${f.record[0] ?? '—'} побед, ${f.record[1] ?? '—'} поражений, ${f.record[2] ?? '—'} ничьих"><b>${f.record[0] ?? '—'}</b><i> - </i><b>${f.record[1] ?? '—'}</b><i> - </i><b>${f.record[2] ?? '—'}</b></span>`;
// Preserve the owner's country assignments when a legacy admin payload has no countries.
const countryCatalog = data.countries;
const bundledCountries = new Map(data.fighters.map(f => [f.id, f.countries]));
const countryAliases = {KZ:'KAZ',RU:'RUS',UZ:'UZB',KG:'KGZ',AZ:'AZE',BR:'BRA',GE:'GEO'};
const countryCodes = f => {
 const codes = Array.isArray(f.countries) && f.countries.length ? f.countries : String(f.code || '').split('/').map(c => c.trim());
 const normalized = codes.map(c => countryAliases[c] || c).filter(c => countryCatalog[c]);
 return normalized.length ? normalized : bundledCountries.get(f.id) || ['—'];
};
const flag = f => `<span class="country-flags">${countryCodes(f).map(code => {
 const country = countryCatalog[code];
 return country ? `<span class="country-code" title="${esc(country.name)}" aria-label="${esc(country.name)}"><img class="country-flag" src="flags/${esc(country.flag)}.svg" width="20" height="15" alt=""><span aria-hidden="true">${esc(code)}</span></span>` : `<span class="country-code">${esc(code)}</span>`;
}).join('<span class="country-separator" aria-hidden="true"> / </span>')}</span>`;
const notice = () => (window.ALASH_RANKING_ERROR?'<p class="preview-note">Не удалось загрузить актуальный рейтинг. Ниже — сохранённый список от 07.10.2026. Попробуйте обновить страницу.</p>':'')+(data.status==='preview'?'<p class="preview-note">МАКЕТ · Имена и рекорды из референса. Официальные данные ещё не добавлены.</p>':'');
const heading=(title,subtitle)=>`<div class="page-heading"><p class="eyebrow">ALASH PRIDE LEAGUE</p><h1>${title}</h1><p>${subtitle}</p></div>`;
const template=name=>document.querySelector(`#template-${name}`).innerHTML;
const primary=(href,label)=>`<a class="primary-button" href="${href}">${label}<span aria-hidden="true">→</span></a>`;
function championCard(d){
 const f=fighterById(d.champion);
 if(!f)return `<div class="champion-card vacant"><span class="champion-marker">${icon('champions')} ЧЕМПИОН</span><h3>Скоро объявим</h3><p>Чемпион категории ${d.limit} ещё не добавлен</p></div>`;
 return `<article class="champion-card">${portrait(f)}<div class="champion-copy"><span class="champion-marker">${icon('champions')} ЧЕМПИОН</span><h3>${esc(f.name)}</h3><p>${flag(f)}</p>${record(f)}<small>${esc(f.team||'Команда не указана')}</small></div></article>`;
}
function rankingBlock(d){
 const ids=d.ranking.map(id=>id===d.champion?null:id);
 return `<section class="division-block" aria-label="${esc(d.name)}"><h2>${d.name} <span>— ${d.limit}</span></h2>${championCard(d)}<table class="rank-table"><caption class="sr-only">Топ-10: ${d.name}. Чемпион отдельно.</caption><thead><tr><th scope="col">#</th><th scope="col">БОЕЦ</th><th scope="col">СТРАНА</th><th scope="col">РЕКОРД</th></tr></thead><tbody>${Array.from({length:10},(_,i)=>{const f=fighterById(ids[i]);return `<tr class="${f?'':'unfilled'}"><td>${i+1}</td><td>${f?`<span class="rank-fighter">${portrait(f)}<span>${esc(f.name)}</span></span>`:'Будет объявлен'}</td><td>${f?flag(f):'—'}</td><td>${f?f.record.map(n=>n??'—').join(' - '):'—'}</td></tr>`;}).join('')}</tbody></table></section>`;
}
function rankings(params){
 const selected=params.get('weight')||'70';
 const chosen=divisionById(selected);
 return `<div class="shell page">${heading('РЕЙТИНГ БОЙЦОВ','Чемпион и десять претендентов в каждой весовой')}${notice()}<nav class="weight-tabs" aria-label="Весовая категория">${[['all','ВСЕ'],...data.divisions.map(d=>[d.id,d.limit])].map(([id,label])=>`<a href="#rankings?weight=${id}" ${selected===id?'aria-current="page"':''}>${label}</a>`).join('')}</nav><div class="rankings-grid">${(selected==='all'?data.divisions:[chosen||divisionById('70')]).map(rankingBlock).join('')}</div></div>`;
}
function fighterCard(f){return `<article class="fighter-card"><div class="fighter-photo">${portrait(f)}${isChampion(f)?`<span class="small-crown" aria-label="Чемпион">${icon('champions')}</span>`:''}<span class="photo-pending">${f.photo?'':'ФОТО СКОРО'}</span></div><div class="fighter-card-copy"><h2>${esc(f.name)}</h2><p class="fighter-card-country">${flag(f)}</p><div><span>${(f.divisions||[f.division]).map(id=>divisionById(id).limit).join(' / ')}</span>${record(f)}</div></div></article>`;}
let filters={q:'',weight:'all',country:'all'};
function fighterResults(){const q=filters.q.trim().toLocaleLowerCase('ru');return data.fighters.filter(f=>(filters.weight==='all'||(f.divisions||[f.division]).includes(filters.weight))&&(filters.country==='all'||countryCodes(f).includes(filters.country))&&f.name.toLocaleLowerCase('ru').includes(q));}
function updateFighters(){const results=fighterResults();document.querySelector('#fighter-grid').innerHTML=results.length?results.map(fighterCard).join(''):'<div class="empty-state"><h2>Бойцы не найдены</h2><p>Попробуйте другое имя или сбросьте фильтры.</p><button class="text-button" data-reset-filters>Сбросить фильтры →</button></div>';document.querySelector('#fighter-count').textContent=`Найдено: ${results.length}`;}
function fighters(){return `<div class="shell page">${heading('БОЙЦЫ','Лица Alash Pride. Характер за каждым именем.')}${notice()}<div class="fighter-controls"><label class="search-field">${icon('search')}<input type="search" id="fighter-search" value="${esc(filters.q)}" placeholder="Поиск бойца…" aria-label="Поиск бойца по имени" autocomplete="off"></label><div class="filter-selects"><label><span class="sr-only">Весовая категория</span><select id="weight-filter"><option value="all">Все категории</option>${data.divisions.map(d=>`<option value="${d.id}" ${filters.weight===d.id?'selected':''}>${d.limit}</option>`).join('')}</select></label><label><span class="sr-only">Страна</span><select id="country-filter">${[['all','Все страны'],...Object.entries(countryCatalog).map(([code,country])=>[code,`${code} · ${country.name}`])].map(([id,text])=>`<option value="${id}" ${filters.country===id?'selected':''}>${text}</option>`).join('')}</select></label></div></div><p id="fighter-count" class="result-count" role="status"></p><div id="fighter-grid" class="fighter-grid"></div></div>`;}
function champions(){return `<div class="shell page">${heading('ЧЕМПИОНЫ ЛИГИ','Один пояс. Одна вершина. Каждая весовая.')}${notice()}<div class="champions-list">${data.divisions.map(d=>{const f=fighterById(d.champion);return f?`<article class="champion-row"><strong class="division-weight">${d.limit}</strong>${portrait(f)}<div><h2>${esc(f.name)}</h2><p>${flag(f)}</p>${record(f)}</div></article>`:`<div class="champion-row vacant-row"><strong class="division-weight">${d.limit}</strong><div><h2>Скоро объявим</h2><p>${d.name}</p></div></div>`;}).join('')}</div></div>`;}
function home(){return `<div class="home-page"><section class="home-hero"><img class="home-hero-image" src="hero.jpg" alt="Архив Alash Pride — боец перед поединком" fetchpriority="high"><div class="home-hero-content shell"><p class="eyebrow">KAZAKHSTAN MMA LEAGUE</p><h1>ALASH PRIDE<span>СИЛА. ЧЕСТЬ. НАСЛЕДИЕ.</span></h1>${primary('#rankings','СМОТРЕТЬ РЕЙТИНГИ')}</div><a class="hero-photo-source" href="https://sportplustv.kz/ru/news/revans-zumabaev-velington-dobavlen-v-kard-alash-pride-108" target="_blank" rel="noopener noreferrer">Архив лиги · Фото Sport+ ↗</a></section><div class="shell home-below"><a class="next-tournament" href="#events"><img src="logo.jpg" alt="" width="64" height="64"><div><span class="eyebrow">СЛЕДУЮЩИЙ ТУРНИР</span><h2>ALASH PRIDE · СЕМЕЙ</h2><p>Декабрь 2026 <span>·</span> Казахстан</p></div><span class="chevron">›</span></a><nav class="quick-links" aria-label="Быстрые разделы">${[['rankings','Рейтинг'],['fighters','Бойцы'],['events','Турниры'],['news','Новости']].map(([id,label])=>`<a href="#${id}"><span>${icon(id)}</span>${label}</a>`).join('')}</nav><div class="section-title"><h2>ПОСЛЕДНИЕ БОИ</h2><a href="#video">ВСЕ →</a></div><div class="home-videos"><a href="#results"><div><img src="hero.jpg" alt="Архивный кадр Alash Pride" loading="lazy">${icon('video')}</div><h3>РЕЗУЛЬТАТ ГЛАВНОГО БОЯ</h3><p>Alash Pride 132</p></a><a href="https://www.youtube.com/@alashpridetv" target="_blank" rel="noopener noreferrer"><div><img src="league.jpg" alt="Команда Alash Pride у октагона" loading="lazy">${icon('video')}</div><h3>В ЦЕНТРЕ СОБЫТИЙ</h3><p>Alash Pride TV ↗</p></a></div><section class="home-rating-link"><div><span class="eyebrow">ПУТЬ К ПОЯСУ</span><h2>ВЕРШИНА — ОДНА.</h2><p>Чемпионы и претенденты каждой весовой категории.</p></div><a href="#champions">ЧЕМПИОНЫ ЛИГИ →</a></section></div></div>`;}
function news(){return `<div class="shell page">${heading('НОВОСТИ','Последние события Alash Pride')}<article class="news-lead"><a href="#tickets"><img src="league.jpg" alt="Архив турниров Alash Pride"><div><span class="eyebrow">СЛЕДУЮЩИЙ ТУРНИР</span><h2>ALASH PRIDE В СЕМЕЕ</h2><p>Декабрь 2026. Точная дата, арена и кард будут объявлены дополнительно.</p><span class="text-link">ИНФОРМАЦИЯ И БИЛЕТЫ →</span></div></a></article><article class="news-row"><span>29.10.2025</span><h2><a href="https://offside.kz/mma/23629-million-golosov-za-kazakhstanskii-mma-youtube-kanal-alash-pride-preodolel-istoricheskuiu-otmetku" target="_blank" rel="noopener noreferrer">Миллион подписчиков Alash Pride TV ↗</a></h2><p>История золотой кнопки YouTube — на Offside.kz.</p></article><a class="primary-button" href="https://www.instagram.com/alash_pridefc/" target="_blank" rel="noopener noreferrer">НОВОСТИ В INSTAGRAM <span>↗</span></a></div>`;}
function render(){
 const [path,query='']=(location.hash.slice(1)||'home').split('?');const params=new URLSearchParams(query);const route=path.split('/')[0];
 if(route==='fighter'){location.replace('#fighters');return;}
 if(path==='main'){main.focus();return;}
 if(menu.open)menu.close();
 const renders={home,rankings:()=>rankings(params),fighters,champions,news,events:()=>template('events'),tickets:()=>template('tickets'),results:()=>template('results'),video:()=>template('video'),about:()=>template('about')};
 main.innerHTML=(renders[route]||home)();
 applyMedia();
 if(route==='fighters'){updateFighters();if(params.has('search'))document.querySelector('#fighter-search').focus();}
 document.querySelectorAll('.bottom-nav a,.desktop-nav a').forEach(a=>{const active=a.hash===`#${route==='fighter'?'fighters':route}`;if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 document.title=`${route==='fighter'?(fighterById(path.split('/')[1])?.name||'Боец'):links.find(([id])=>id===route)?.[1]||'Alash Pride'} — Alash Pride League`;
 window.scrollTo({top:0,behavior:'instant'});
 if(!(route==='fighters'&&params.has('search')))main.focus({preventScroll:true});
}
document.querySelector('.search-shortcut').innerHTML=icon('search');
document.querySelector('.menu-button').innerHTML=icon('menu');
document.querySelector('.menu-links').innerHTML=links.map(([id,label])=>`<a href="#${id}">${icon(id)}<span>${label}</span><span>›</span></a>`).join('');
document.querySelector('.bottom-nav').innerHTML=[['home','Главная'],['rankings','Рейтинг'],['fighters','Бойцы'],['events','Турниры']].map(([id,label])=>`<a href="#${id}">${icon(id)}<span>${label}</span></a>`).join('')+`<button class="more-menu" aria-label="Все разделы" aria-haspopup="dialog" aria-controls="site-menu">${icon('more')}<span>Ещё</span></button>`;
let menuOpener;
function openMenu(button){menuOpener=button;menu.showModal();document.body.classList.add('menu-open');}
menu.addEventListener('close',()=>{document.body.classList.remove('menu-open');menuOpener?.focus({preventScroll:true});});
document.addEventListener('click',event=>{
 const target=event.target;
 const opener=target.closest('.menu-button,.more-menu');if(opener)openMenu(opener);
 if(target.closest('.close-menu')||target===menu)menu.close();
 if(target.closest('#site-menu a'))menu.close();
 if(target.closest('[data-reset-filters]')){filters={q:'',weight:'all',country:'all'};render();document.querySelector('#fighter-search').focus();}
 const filter=target.closest('[data-filter]');if(filter){document.querySelectorAll('[data-filter]').forEach(b=>{const active=b===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});document.querySelectorAll('[data-status]').forEach(card=>{card.hidden=filter.dataset.filter!=='all'&&card.dataset.status!==filter.dataset.filter;});}
});
document.addEventListener('input',event=>{if(event.target.id==='fighter-search'){filters.q=event.target.value;updateFighters();}});
document.addEventListener('change',event=>{if(event.target.id==='weight-filter')filters.weight=event.target.value;else if(event.target.id==='country-filter')filters.country=event.target.value;else return;updateFighters();});
window.addEventListener('hashchange',render);
window.addEventListener('alash:rankings',()=>{const y=window.scrollY;render();window.scrollTo({top:y,behavior:'instant'});});
render();

function applyMedia(){
 document.querySelectorAll('img').forEach(img=>{
  const original=img.dataset.originalSrc||img.getAttribute('src');
  if(!['hero.jpg','league.jpg','logo.jpg'].includes(original))return;
  img.dataset.originalSrc=original;
  const key=original.split('.')[0];
  img.src=data.media?.[key]||original;
  if(data.media?.[key]&&key!=='logo')img.alt='Alash Pride';
 });
 if(data.media?.hero){document.querySelectorAll('.hero-photo-source,.video-grid figcaption').forEach(el=>el.hidden=true);}
}
