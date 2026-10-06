import {createClient} from '@supabase/supabase-js';
import {URL, KEY, DOCUMENT_ID} from './config.js';
import {validate, swap} from './rankings.js';

const client = createClient(URL, KEY);
const root = document.querySelector('#admin');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let session, model, revision, division = '70', dirty = false, busy = false, authEpoch = 0;
const message = text => {const el = document.querySelector('#message'); if(el) el.textContent = text;};
function changed() {dirty = true; document.querySelector('#save-state').textContent = 'Есть несохранённые изменения';}
function loginView() {
  root.innerHTML = `<section class="login"><h1>Вход в админку</h1><p>Управление чемпионами и рейтингом бойцов. Доступ есть только у владельца сайта.</p><form id="login"><label>Email<input name="email" type="email" autocomplete="username" required></label><label>Пароль<input name="password" type="password" autocomplete="current-password" required></label><button class="primary">Войти</button></form><p id="message" class="message" role="status"></p></section>`;
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
  model = structuredClone(validate(data.payload)); revision = data.revision; dirty = false;
  if (!model.divisions.some(d => d.id === division)) division = model.divisions[0].id;
}
function editorView() {
  const current = model.divisions.find(d => d.id === division);
  const candidates = model.fighters.filter(f => (f.divisions || [f.division]).includes(division));
  const options = (value, index) => `<option value="">${index === -1 ? 'Пояс вакантен' : 'Будет объявлен'}</option>` + candidates.map(f => {
    const used = current.champion === f.id || current.ranking.includes(f.id);
    return `<option value="${esc(f.id)}" ${f.id===value?'selected':''} ${used&&f.id!==value?'disabled':''}>${esc(f.name)}</option>`;
  }).join('');
  root.innerHTML = `<div class="toolbar"><div><h1>Рейтинг бойцов</h1><p>${esc(session.user.email)}</p></div><div class="actions"><a class="button" href="./#rankings" target="_blank" rel="noopener">Посмотреть сайт ↗</a><button id="logout">Выйти</button></div></div><p id="message" class="message" role="status"></p><section class="ranking-editor"><label>Весовая категория<select id="division">${model.divisions.map(d => `<option value="${esc(d.id)}" ${d.id===division?'selected':''}>${esc(d.name)} · ${esc(d.limit)}</option>`).join('')}</select></label><h2>${esc(current.name)} · ${esc(current.limit)}</h2><p class="help">Выбери чемпиона и до десяти претендентов. Стрелки меняют места; пустую позицию можно оставить для будущего бойца. Все категории публикуются одной кнопкой.</p><label>Чемпион<select data-position="-1">${options(current.champion,-1)}</select></label><h2>Претенденты</h2>${Array.from({length:10},(_,i)=>`<div class="ranking-row"><span class="rank-number">${i+1}</span><label><span class="sr-only">Место ${i+1}</span><select aria-label="Место ${i+1}" data-position="${i}">${options(current.ranking[i],i)}</select></label><div class="row-actions"><button type="button" data-move="${i}" data-direction="-1" aria-label="Поднять место ${i+1}" ${i===0?'disabled':''}>↑</button><button type="button" data-move="${i}" data-direction="1" aria-label="Опустить место ${i+1}" ${i===9?'disabled':''}>↓</button></div></div>`).join('')}<details><summary>Добавить бойца в эту категорию</summary><p class="help">Добавь профиль, затем выбери бойца в рейтинге. Он появится на сайте после публикации.</p><form id="add-fighter"><label>Имя бойца<input name="name" maxlength="100" required></label><label>Страна<select name="country"><option value="unknown">Не указана</option><option value="KZ">Казахстан</option><option value="KG">Кыргызстан</option><option value="UZ">Узбекистан</option><option value="RU">Россия</option><option value="BR">Бразилия</option></select></label><div class="field-grid">${['Победы','Поражения','Ничьи'].map((s,i)=>`<label>${s}<input name="record${i}" type="number" min="0" max="999" placeholder="Неизвестно"></label>`).join('')}</div><button>Добавить бойца</button></form></details><label class="check"><input type="checkbox" id="verified" ${model.status==='verified'?'checked':''}>Я проверил имена, рекорды и рейтинг во всех категориях. Показывать базу как подтверждённую.</label><p class="help">Пока флажок снят, сайт сохраняет пометку «Макет». Рейтинг и имена подтверждает владелец. Неизвестные рекорды показаны прочерками.</p><div class="save-bar"><div class="actions"><button class="primary" id="publish">Опубликовать изменения</button><button id="reload">Загрузить заново</button><span id="save-state" class="dirty" role="status">${dirty?'Есть несохранённые изменения':'Все изменения сохранены'}</span></div></div></section>`;
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
    const countries = {unknown:'Страна не указана',KZ:'Казахстан',KG:'Кыргызстан',UZ:'Узбекистан',RU:'Россия',BR:'Бразилия'};
    const fighter = {id: `fighter-${crypto.randomUUID()}`,name:String(fields.get('name')).trim(),division,country:countries[fields.get('country')],code:fields.get('country')==='unknown'?'—':fields.get('country'),record:[0,1,2].map(i=>fields.get(`record${i}`)===''?null:Number(fields.get(`record${i}`))),photo:null,fights:[],finishes:null};
    try {validate({...model,fighters:[...model.fighters,fighter]}); model.fighters.push(fighter); changed(); editorView(); message('Боец добавлен. Выбери его место и опубликуй изменения.');} catch(error) {message(error.message);}
  };
  root.querySelector('#publish').onclick = publish;
  root.querySelector('#reload').onclick = async () => {if (dirty&&!confirm('Отменить несохранённые изменения и загрузить последнюю версию?')) return; setBusy(true); try {await load(); editorView();} catch(error) {message(error.message);} finally {setBusy(false);}};
  root.querySelector('#logout').onclick = async () => {if (dirty&&!confirm('Выйти без сохранения изменений?')) return; setBusy(true); const {error} = await client.auth.signOut(); if(error) {message('Не удалось выйти. Попробуй снова.'); setBusy(false);} else {dirty=false; model=null;}};
}
function setBusy(value) {busy=value; root.querySelectorAll('button,input,select').forEach(el=>{if(value){el.dataset.disabledBefore=String(el.disabled);el.disabled=true;}else if('disabledBefore' in el.dataset){el.disabled=el.dataset.disabledBefore==='true';delete el.dataset.disabledBefore;}});}
async function publish() {
  if (busy) return;
  try {
    validate(model); setBusy(true); message('Сохранение…');
    const {data,error} = await client.from('site_content').update({payload:model}).eq('id',DOCUMENT_ID).eq('kind','ranking').eq('revision',revision).select('revision');
    if(error) throw Error('Не удалось сохранить. Изменения остались в редакторе — проверь соединение и повтори.');
    if(!data?.length) throw Error('Рейтинг уже изменён в другой вкладке или доступ отозван. Твои правки не отправлены. Сохрани их для себя, затем нажми «Загрузить заново».');
    revision=data[0].revision; dirty=false; editorView(); message('Опубликовано. Посетители увидят новый рейтинг после открытия или обновления сайта.');
  } catch(error) {message(error.message);} finally {setBusy(false);}
}
async function authenticate(next) {
  const epoch=++authEpoch; session=next;
  if(!session){model=null;dirty=false;loginView();return;}
  root.innerHTML='<p>Проверяем доступ…</p>';
  try {
    const {data,error}=await client.from('site_editors').select('email');
    if(epoch!==authEpoch)return;
    if(error||!data?.length) throw Error('У этого аккаунта нет прав на редактирование рейтинга.');
    await load(); if(epoch===authEpoch)editorView();
  } catch(error) {if(epoch!==authEpoch)return;root.innerHTML=`<h1>Управление рейтингом</h1><p>${esc(error.message)}</p><button id="retry">Повторить</button> <button id="signout">Выйти</button>`;root.querySelector('#retry').onclick=()=>authenticate(session);root.querySelector('#signout').onclick=()=>client.auth.signOut();}
}
let currentUser;
client.auth.onAuthStateChange((_event,next)=>{
  const id=next?.user.id||null;
  // Token refresh must not erase an unsaved ranking.
  if(id===currentUser){session=next;return;}
  currentUser=id;setTimeout(()=>authenticate(next),0);
});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
