import {createClient} from '@supabase/supabase-js';
import {URL, KEY, DOCUMENT_ID} from './config.js';
import {validate, swap} from './rankings.js';

const client = createClient(URL, KEY);
const root = document.querySelector('#admin');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let section = 'rankings', editFighterId = null, copyPage = 'Главная', copySearch = '';
let recordDrafts = {};
let session, model, revision, division = '70', dirty = false, busy = false, authEpoch = 0;
const message = text => {const el = document.querySelector('#message'); if(el) el.textContent = text;};
function changed() {dirty = true; document.querySelector('#save-state').textContent = 'Есть несохранённые изменения';}
function loginView() {
  root.innerHTML = `<section class="login"><h1>Вход в админку</h1><p>Рейтинг, фотографии бойцов и изображения сайта. Доступ есть только у владельца сайта.</p><form id="login"><label>Email<input name="email" type="email" autocomplete="username" required></label><label>Пароль<input name="password" type="password" autocomplete="current-password" required></label><button class="primary">Войти</button></form><p id="message" class="message" role="status"></p></section>`;
  root.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault(); const button = event.target.querySelector('button'); button.disabled = true;
    message('Вход…'); const fields = new FormData(event.target);
    try {const {error} = await client.auth.signInWithPassword({email: String(fields.get('email')).trim(), password: String(fields.get('password'))}); if(error) throw error;}
    catch {message('Не удалось войти. Проверь почту и пароль, а также подключение к интернету.');}
    finally {button.disabled = false;}
  });
}
async function load() {
  const {data, error} = await client.from('site_content').select('payload,revision').eq('id',DOCUMENT_ID).eq('kind','ranking').single();
  if (error) throw Error('Не удалось загрузить рейтинг. Проверь соединение и попробуй снова.');
  recordDrafts = {}; model = structuredClone(validate(data.payload)); revision = data.revision; dirty = false;
  if (!model.divisions.some(d => d.id === division)) division = model.divisions[0].id;
}
function editorView() {
  const current = model.divisions.find(d => d.id === division);
  const candidates = model.fighters.filter(f => (f.divisions || [f.division]).includes(division));
  if(!candidates.some(f=>f.id===editFighterId))editFighterId=current.champion||current.ranking.find(Boolean)||candidates[0]?.id||null;
  const editing=candidates.find(f=>f.id===editFighterId);
  const options = (value, index) => `<option value="">${index === -1 ? 'Пояс вакантен' : 'Будет объявлен'}</option>` + candidates.map(f => {
    const used = current.champion === f.id || current.ranking.includes(f.id);
    return `<option value="${esc(f.id)}" ${f.id===value?'selected':''} ${used&&f.id!==value?'disabled':''}>${esc(f.name)}</option>`;
  }).join('');
  root.innerHTML = `<div class="toolbar"><div class="actions"><a class="button" href="./#rankings" target="_blank" rel="noopener">Посмотреть сайт ↗</a><button id="logout">Выйти</button></div></div><p id="message" class="message" role="status"></p><section class="ranking-editor"><label>Весовая категория<select id="division">${model.divisions.map(d => `<option value="${esc(d.id)}" ${d.id===division?'selected':''}>${esc(d.name)} · ${esc(d.limit)}</option>`).join('')}</select></label><label>Название категории<input id="division-name" maxlength="100" value="${esc(current.name)}"></label><h2>${esc(current.name)} · ${esc(current.limit)}</h2><div class="champion-editor"><label>Чемпион<select data-position="-1">${options(current.champion,-1)}</select></label>${current.champion?`<button type="button" data-edit-fighter="${esc(current.champion)}">Фото и рекорд</button>`:``}</div><h2>Претенденты</h2>${Array.from({length:10},(_,i)=>`<div class="ranking-row"><span class="rank-number">${i+1}</span><label><span class="sr-only">Место ${i+1}</span><select aria-label="Место ${i+1}" data-position="${i}">${options(current.ranking[i],i)}</select></label><div class="row-actions">${current.ranking[i]?`<button type="button" data-edit-fighter="${esc(current.ranking[i])}" aria-label="Фото и рекорд: ${esc(model.fighters.find(f=>f.id===current.ranking[i])?.name||'боец')}">Фото и рекорд</button>`:``}<button type="button" data-move="${i}" data-direction="-1" aria-label="Поднять место ${i+1}" ${i===0?'disabled':''}>↑</button><button type="button" data-move="${i}" data-direction="1" aria-label="Опустить место ${i+1}" ${i===9?'disabled':''}>↓</button></div></div>`).join('')}<section id="fighter-editor" class="inline-fighter-editor"><label>Редактировать бойца<select id="fighter-to-edit">${candidates.map(f=>`<option value="${esc(f.id)}" ${f.id===editFighterId?'selected':''}>${esc(f.name)}</option>`).join('')}</select></label>${editing?imageControl('fighter',editing.id,editing.photo||'fighter-placeholder.svg',editing.name):'<p>Сначала добавь бойца в категорию.</p>'}</section><details><summary>Добавить бойца в эту категорию</summary><form id="add-fighter"><label>Имя бойца<input name="name" maxlength="100" required></label><label>Страна<select name="country"><option value="unknown">Не указана</option><option value="KZ">Казахстан</option><option value="KG">Кыргызстан</option><option value="UZ">Узбекистан</option><option value="RU">Россия</option><option value="BR">Бразилия</option><option value="AZ">Азербайджан</option><option value="GE">Грузия</option></select></label><div class="field-grid">${['Победы','Поражения','Ничьи'].map((s,i)=>`<label>${s}<input name="record${i}" type="number" min="0" max="999" placeholder="Неизвестно"></label>`).join('')}</div><button>Добавить бойца</button></form></details><label class="check"><input type="checkbox" id="verified" ${model.status==='verified'?'checked':''}>Я проверил имена, рекорды и рейтинг во всех категориях. Показывать базу как подтверждённую.</label><div class="save-bar"><div class="actions"><button class="primary" id="publish">Опубликовать изменения</button><button id="reload">Загрузить заново</button><span id="save-state" class="dirty" role="status">${dirty?'Есть несохранённые изменения':'Все изменения сохранены'}</span></div></div></section>`;
  enhanceEditor();
  root.querySelector('#fighter-to-edit').onchange=e=>{editFighterId=e.target.value;editorView();root.querySelector('#fighter-editor')?.scrollIntoView({block:'start'});};
  root.querySelectorAll('[data-edit-fighter]').forEach(button=>button.onclick=()=>{editFighterId=button.dataset.editFighter;editorView();root.querySelector('#fighter-editor')?.scrollIntoView({block:'start'});root.querySelector('#fighter-to-edit')?.focus({preventScroll:true});});
  bindImages(root.querySelector('.ranking-editor'));
  root.querySelector('#division-name').oninput = e => {current.name=e.target.value;changed();};
  root.querySelector('#division').onchange = event => {division = event.target.value; editorView();};
  root.querySelectorAll('[data-position]').forEach(select => select.onchange = () => {
    const i = Number(select.dataset.position);
    if (i===-1) current.champion = select.value || null;
    else {current.ranking = Array.from({length:10},(_,n)=>current.ranking[n]||null); current.ranking[i] = select.value || null;}
    changed(); editorView();
  });
  root.querySelectorAll('[data-move]').forEach(button => button.onclick = () => {
    const i = Number(button.dataset.move); current.ranking = swap(current.ranking,i,i+Number(button.dataset.direction));
    changed(); editorView(); root.querySelector(`[data-move="${i+Number(button.dataset.direction)}"][data-direction="${button.dataset.direction}"]`)?.focus();
  });
  root.querySelector('#verified').onchange = event => {model.status = event.target.checked?'verified':'preview'; changed();};
  root.querySelector('#add-fighter').onsubmit = event => {
    event.preventDefault(); const fields = new FormData(event.target);
    const countries = {unknown:'Страна не указана',KZ:'Казахстан',KG:'Кыргызстан',UZ:'Узбекистан',RU:'Россия',BR:'Бразилия',AZ:'Азербайджан',GE:'Грузия'};
    const fighter = {id: `fighter-${crypto.randomUUID()}`,name:String(fields.get('name')).trim(),division,country:countries[fields.get('country')],code:fields.get('country')==='unknown'?'—':fields.get('country'),record:[0,1,2].map(i=>fields.get(`record${i}`)===''?null:Number(fields.get(`record${i}`))),leagueRecord:[null,null,null],photo:null,fights:[],finishes:null};
    try {validate({...model,fighters:[...model.fighters,fighter]}); model.fighters.push(fighter); editFighterId=fighter.id; changed(); editorView(); message('Боец добавлен. Выбери его место и опубликуй изменения.');} catch(error) {message(error.message);}
  };
  root.querySelector('#publish').onclick = publish;
  root.querySelector('#reload').onclick = async () => {if (dirty&&!confirm('Отменить несохранённые изменения и загрузить последнюю версию?')) return; setBusy(true); try {await load(); editorView();} catch(error) {message(error.message);} finally {setBusy(false);}};
  root.querySelector('#logout').onclick = async () => {if (dirty&&!confirm('Выйти без сохранения изменений?')) return; setBusy(true); const {error} = await client.auth.signOut(); if(error) {message('Не удалось выйти. Попробуй снова.'); setBusy(false);} else {dirty=false; model=null;}};
}
function setBusy(value) {busy=value; root.querySelectorAll('button,input,select,textarea').forEach(el=>{if(value){el.dataset.disabledBefore=String(el.disabled);el.disabled=true;}else if('disabledBefore' in el.dataset){el.disabled=el.dataset.disabledBefore==='true';delete el.dataset.disabledBefore;}});}
async function publish() {
  if (busy) return;
  try {
    if(Object.values(recordDrafts).some(v=>v!==''&&(!/^\d+$/.test(v)||!Number.isSafeInteger(Number(v)))))throw Error('Проверь рекорд бойца: допустимы только целые числа от 0. Неизвестные результаты оставь пустыми.');
    validateCopy();validate(model); setBusy(true); message('Сохранение…');
    const {data,error} = await client.from('site_content').update({payload:model}).eq('id',DOCUMENT_ID).eq('kind','ranking').eq('revision',revision).select('revision');
    if(error) throw Error('Не удалось сохранить. Изменения остались в редакторе — проверь соединение и повтори.');
    if(!data?.length) throw Error('Рейтинг уже изменён в другой вкладке или доступ отозван. Твои правки не отправлены. Сохрани их для себя, затем нажми «Загрузить заново».');
    revision=data[0].revision; dirty=false; editorView(); message('Опубликовано. Посетители увидят изменения после открытия или обновления сайта.');
  } catch(error) {message(error.message);} finally {setBusy(false);}
}
async function authenticate(next) {
  const epoch=++authEpoch; session=next;
  if(!session){model=null;dirty=false;loginView();return;}
  root.innerHTML='<p>Проверяем доступ…</p>';
  try {
    const {data,error}=await client.from('site_editors').select('email');
    if(epoch!==authEpoch)return;
    if(error||!data?.length) throw Error('У этого аккаунта нет прав на редактирование сайта.');
    await load(); if(epoch===authEpoch)editorView();
  } catch(error) {if(epoch!==authEpoch)return;root.innerHTML=`<h1>Админка</h1><p>${esc(error.message)}</p><button id="retry">Повторить</button> <button id="signout">Выйти</button>`;root.querySelector('#retry').onclick=()=>authenticate(session);root.querySelector('#signout').onclick=()=>client.auth.signOut();}
}
let currentUser;
client.auth.onAuthStateChange((_event,next)=>{
  const id=next?.user.id||null;
  // Token refresh must not erase an unsaved ranking.
  if(id===currentUser){session=next;return;}
  currentUser=id;setTimeout(()=>authenticate(next),0);
});
window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}});

const mediaSlots = [['league','Фото лиги','league.jpg'],['logo','Логотип сайта','logo.jpg']];
function imageControl(kind,id,url,title){
 const fighter=kind==='fighter'?model.fighters.find(f=>f.id===id):null;
 const fields=fighter?`<div class="record-editor">${[['record','Общий рекорд'],['leagueRecord','Alash Pride']].map(([type,caption])=>`<fieldset class="record-fields"><legend>${type==='leagueRecord'?'<img src="logo.jpg" width="17" height="17" alt="">':''}${caption}</legend><div>${['Победы','Поражения','Ничьи'].map((label,i)=>`<label>${label}<input type="text" inputmode="numeric" pattern="[0-9]*" data-record="${i}" data-record-type="${type}" data-fighter="${esc(id)}" value="${esc(recordDrafts[`${id}:${type}:${i}`] ?? (fighter[type]||[null,null,null])[i] ?? '')}" placeholder="—" aria-label="${caption}, ${label}: ${esc(title)}"></label>`).join('')}</div></fieldset>`).join('')}</div>`:'';

 return `<article class="media-card"><img src="${esc(url)}" alt="${esc(title)}" class="media-preview ${kind==='fighter'?'fighter-preview':''}"><div><h3>${esc(title)}</h3>${fighter?`<label>Имя бойца<input data-fighter-name="${esc(id)}" value="${esc(fighter.name)}" maxlength="100"></label>`:``}${fields}<label class="upload-label">Выбрать фото<input type="file" accept="image/jpeg,image/png,image/webp" data-upload="${kind}" data-id="${esc(id)}"></label><button type="button" data-reset-image="${kind}" data-id="${esc(id)}">${kind==='fighter'?'Убрать фото':'Вернуть исходное'}</button></div></article>`;
}
function enhanceEditor(){
 const ranking=root.querySelector('.ranking-editor');
 const bar=ranking.querySelector('.save-bar');root.append(bar);
 const tabs=document.createElement('nav');tabs.className='admin-tabs';tabs.setAttribute('aria-label','Разделы админки');
 tabs.innerHTML=[['rankings','Рейтинг'],['media','Изображения'],['copy','Тексты']].map(([id,label])=>`<button type="button" data-section="${id}" aria-pressed="${section===id}">${label}</button>`).join('');
 ranking.before(tabs);ranking.hidden=section!=='rankings';
 const panel=document.createElement('section');panel.className='media-editor';bar.before(panel);
 if(section==='media'){
  panel.innerHTML='<div class="media-grid">'+mediaSlots.map(([id,title,fallback])=>imageControl('media',id,model.media?.[id]||fallback,title)).join('')+'</div>';bindImages(panel);
 }else if(section==='copy')renderCopyEditor(panel);
 else panel.hidden=true;
 tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(busy)return;section=b.dataset.section;editorView();});
}
function bindImages(panel){
 panel.querySelectorAll('[data-fighter-name]').forEach(input=>input.oninput=()=>{model.fighters.find(f=>f.id===input.dataset.fighterName).name=input.value;changed();});
 panel.querySelectorAll('[data-record]').forEach(input=>input.oninput=()=>{
  const id=input.dataset.fighter,i=Number(input.dataset.record),type=input.dataset.recordType,value=input.value;
  recordDrafts[`${id}:${type}:${i}`]=value;
  const valid=value===''||(/^\d+$/.test(value)&&Number.isSafeInteger(Number(value)));
  input.setCustomValidity(valid?'':'Введи целое число от 0 или оставь поле пустым.');
  input.setAttribute('aria-invalid',String(!valid));
  if(valid){const fighter=model.fighters.find(f=>f.id===id);fighter[type] ||= [null,null,null];fighter[type][i]=value===''?null:Number(value);}
  changed();
 });

 panel.querySelectorAll('[data-upload]').forEach(input=>input.onchange=()=>uploadImage(input));
 panel.querySelectorAll('[data-reset-image]').forEach(button=>button.onclick=()=>{
  if(busy)return;
  if(button.dataset.resetImage==='fighter')model.fighters.find(f=>f.id===button.dataset.id).photo=null;
  else {model.media ||= {};delete model.media[button.dataset.id];}
  changed();editorView();message('Изображение изменено в редакторе. Опубликуй изменения, чтобы обновить сайт.');
 });
}
async function prepareImage(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Выбери JPG, PNG или WebP.');
 if(file.size>15*1024*1024)throw Error('Файл больше 15 МБ. Выбери изображение поменьше.');
 const url=URLGlobal.createObjectURL(file);
 try {
  const img=new Image();img.src=url;await img.decode();
  const scale=Math.min(1,1920/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.86));
  if(blob?.size>5*1024*1024)throw Error('После обработки файл больше 5 МБ. Выбери изображение поменьше.');
  if(!blob)throw Error('Не удалось обработать фото. Попробуй другой файл.');return blob;
 }finally{URLGlobal.revokeObjectURL(url);}
}
const URLGlobal=window.URL;
async function uploadImage(input){
 const file=input.files[0];if(!file||busy)return;
 const kind=input.dataset.upload,id=input.dataset.id;
 setBusy(true);message('Обрабатываем и загружаем фото…');
 try{
  const blob=await prepareImage(file);
  const path=`${kind}/${id}/${crypto.randomUUID()}.${blob.type==='image/webp'?'webp':'png'}`;
  const {error}=await client.storage.from('league-media').upload(path,blob,{contentType:blob.type,upsert:false});
  if(error)throw Error('Не удалось загрузить фото. Проверь соединение и повтори выбор файла.');
  const {data}=client.storage.from('league-media').getPublicUrl(path);
  if(kind==='fighter')model.fighters.find(f=>f.id===id).photo=data.publicUrl;
  else {model.media ||= {};model.media[id]=data.publicUrl;}
  changed();editorView();message('Фото загружено. Проверь результат и нажми «Опубликовать изменения».');
 }catch(error){message(error.message);input.value='';}finally{setBusy(false);}
}

function validateCopy(){
 if(model.divisions.some(d=>!d.name?.trim()))throw Error('Укажи название каждой весовой категории.');
 const fields=new Set(window.ALASH_COPY_FIELDS.map(f=>f.key));
 if(Object.entries(model.copy||{}).some(([key,value])=>!fields.has(key)||typeof value!=='string'||!value.trim()||value.length>1200))
  throw Error('Проверь тексты: поле не должно быть пустым или длиннее 1200 символов.');
}
function renderCopyEditor(panel){
 const fields=window.ALASH_COPY_FIELDS.filter(f=>!['Новости','Видео','Результаты'].includes(f.group)&&!/#(?:news|video|results)|\.home-videos|\.home-below \.section-title/.test(f.selector));
 const groups=[...new Set(fields.map(f=>f.group))];
 panel.innerHTML=`<div class="copy-tools"><label>Раздел<select id="copy-page">${groups.map(group=>`<option ${group===copyPage?'selected':''}>${esc(group)}</option>`).join('')}</select></label><label>Найти текст<input type="search" id="copy-search" value="${esc(copySearch)}" placeholder="Заголовок или слово…"></label></div><p id="copy-count" class="muted" role="status"></p><div id="copy-fields" class="copy-fields"></div>`;
 const list=panel.querySelector('#copy-fields');
 const draw=()=>{
  const shown=fields.filter(f=>(copySearch?`${f.label} ${f.original} ${f.group}`.toLocaleLowerCase('ru').includes(copySearch.toLocaleLowerCase('ru')):f.group===copyPage));
  panel.querySelector('#copy-count').textContent=`Полей: ${shown.length}`;
  list.innerHTML=shown.map(f=>{
   const value=model.copy?.[f.key]??f.original;
   const multiline=f.original.length>100;
   return `<div class="copy-field"><label for="${f.key}"><span>${esc(f.group)} · ${esc(f.label)}</span></label>${multiline?`<textarea id="${f.key}" data-copy-key="${f.key}" rows="4" maxlength="1200">${esc(value)}</textarea>`:`<input id="${f.key}" data-copy-key="${f.key}" type="text" maxlength="1200" value="${esc(value)}">`}<button type="button" data-copy-reset="${f.key}" ${model.copy?.[f.key]===undefined?'disabled':''}>Вернуть исходный</button></div>`;
  }).join('')||'<p>Совпадений нет.</p>';
  list.querySelectorAll('[data-copy-key]').forEach(input=>input.oninput=()=>{
   const field=fields.find(f=>f.key===input.dataset.copyKey);
   model.copy ||= {};
   if(input.value===field.original)delete model.copy[field.key];
   else model.copy[field.key]=input.value;
   input.setCustomValidity(input.value.trim()?'':'Введите текст или верните исходный.');
   input.closest('.copy-field').querySelector('[data-copy-reset]').disabled=model.copy[field.key]===undefined;
   changed();
  });
  list.querySelectorAll('[data-copy-reset]').forEach(button=>button.onclick=()=>{
   const field=fields.find(f=>f.key===button.dataset.copyReset);
   delete model.copy[field.key];changed();draw();
  });
 };
 panel.querySelector('#copy-page').onchange=e=>{copyPage=e.target.value;copySearch='';panel.querySelector('#copy-search').value='';draw();};
 panel.querySelector('#copy-search').oninput=e=>{copySearch=e.target.value;draw();};
 draw();
}
