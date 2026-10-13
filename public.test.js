import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
function page(hash){
 const dom=new JSDOM(readFileSync(new URL('./index.html',import.meta.url),'utf8'),{url:'https://example.test/#'+hash,runScripts:'outside-only'});
 const w=dom.window;w.scrollTo=()=>{};
 for(const file of ['fighters.js','site-copy.js','app.js'])w.eval(readFileSync(new URL(file,import.meta.url),'utf8'));
 return dom;
}
test('rankings group portrait, name and country together while keeping both records',()=>{
 const dom=page('rankings?weight=all');
 try{const doc=dom.window.document;
  assert.equal(doc.querySelectorAll('.division-block').length,8);
  for(const table of doc.querySelectorAll('.rank-table')){
   assert.equal(table.querySelectorAll('thead th').length,3);
   assert.equal(table.querySelectorAll('tbody tr').length,10);
   for(const row of table.querySelectorAll('tbody tr:not(.unfilled)')){
    assert.equal(row.children.length,3);
    assert.ok(row.querySelector('.rank-fighter .portrait'));
    assert.ok(row.querySelector('.rank-fighter-info .country-flags'));
    assert.ok(row.querySelector('.rank-fighter-name').textContent.trim());
    assert.equal(row.querySelectorAll('.record-line').length,2);
   }
  }
 }finally{dom.window.close()}
});
test('all public sections render and keep admin access out of public navigation',()=>{
 for(const route of ['home','fighters','champions','events','tickets','about']){
  const dom=page(route);try{assert.equal(dom.window.document.querySelectorAll('main h1').length,1);assert.equal(dom.window.document.querySelector('a[href="admin.html"]'),null);}finally{dom.window.close()}
 }
});

test('fighter filter links restore the controls and matching results after reload',()=>{
 const dom=page('fighters');const w=dom.window;
 try{
  const fighter=w.ALASH_DATA.fighters[0];
  const search=w.document.querySelector('#fighter-search');search.value=fighter.name;search.dispatchEvent(new w.Event('input',{bubbles:true}));
  const weight=w.document.querySelector('#weight-filter');weight.value=fighter.division;weight.dispatchEvent(new w.Event('change',{bubbles:true}));
  const country=w.document.querySelector('#country-filter');country.value=fighter.countries[0];country.dispatchEvent(new w.Event('change',{bubbles:true}));
  const restored=page(w.location.hash.slice(1));try{
   const d=restored.window.document;
   assert.equal(d.querySelector('#fighter-search').value,fighter.name);
   assert.equal(d.querySelector('#weight-filter').value,fighter.division);
   assert.equal(d.querySelector('#country-filter').value,fighter.countries[0]);
   assert.ok([...d.querySelectorAll('.fighter-card h2')].some(el=>el.textContent===fighter.name));
  }finally{restored.window.close()}
  search.value='no such fighter';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  w.document.querySelector('[data-reset-filters]').click();
  assert.equal(w.location.hash,'#fighters');assert.equal(w.document.querySelector('#weight-filter').value,'all');
 }finally{w.close()}
});

test('event status deep links restore visible cards and selected filter',()=>{
 const dom=page('events?status=past');const w=dom.window;
 try{
  assert.equal(w.document.querySelector('[data-filter="past"]').getAttribute('aria-pressed'),'true');
  assert.ok([...w.document.querySelectorAll('[data-status="upcoming"]')].every(el=>el.hidden));
  w.document.querySelector('[data-filter="upcoming"]').click();
  assert.equal(w.location.hash,'#events?status=upcoming');
  assert.ok([...w.document.querySelectorAll('[data-status="past"]')].every(el=>el.hidden));
 }finally{w.close()}
});

test('semantic heading changes preserve every editable event, ticket and about field',()=>{
 for(const [route,group] of [['events','Турниры'],['tickets','Билеты'],['about','О лиге']]){
  const dom=page(route);const w=dom.window;
  try{
   for(const field of w.ALASH_COPY_FIELDS.filter(f=>f.group===group)){
    const value='Updated '+field.key;w.ALASH_DATA.copy={[field.key]:value};
    w.dispatchEvent(new w.Event('alash:rankings'));
    const targets=w.document.querySelectorAll(field.selector);
    assert.ok(targets.length,field.label);
    assert.ok([...targets].every(el=>el.textContent.includes(value)),field.label);
   }
  }finally{w.close()}
 }
});
test('ranking redesign preserves editable empty places and literal fighter names',()=>{
 const dom=page('rankings?weight=all');const w=dom.window;
 try{const field=w.ALASH_COPY_FIELDS.find(f=>f.label==='Пустое место');w.ALASH_DATA.copy={[field.key]:'Место свободно'};w.ALASH_DATA.fighters[0].name='<b>Тест</b>';w.dispatchEvent(new w.Event('alash:rankings'));
 assert.ok([...w.document.querySelectorAll('.unfilled td:nth-child(2)')].every(e=>e.textContent==='Место свободно'));
 assert.ok(w.document.querySelector('main').textContent.includes('<b>Тест</b>'));assert.equal(w.document.querySelector('.champion-copy h3 b'),null);
 }finally{w.close()}
});
