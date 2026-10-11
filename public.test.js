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
  const dom=page(route);try{assert.ok(dom.window.document.querySelector('main h1,main h2'));assert.equal(dom.window.document.querySelector('a[href="admin.html"]'),null);}finally{dom.window.close()}
 }
});
test('ranking redesign preserves editable empty places and literal fighter names',()=>{
 const dom=page('rankings?weight=all');const w=dom.window;
 try{const field=w.ALASH_COPY_FIELDS.find(f=>f.label==='Пустое место');w.ALASH_DATA.copy={[field.key]:'Место свободно'};w.ALASH_DATA.fighters[0].name='<b>Тест</b>';w.dispatchEvent(new w.Event('alash:rankings'));
 assert.ok([...w.document.querySelectorAll('.unfilled td:nth-child(2)')].every(e=>e.textContent==='Место свободно'));
 assert.ok(w.document.querySelector('main').textContent.includes('<b>Тест</b>'));assert.equal(w.document.querySelector('.champion-copy h3 b'),null);
 }finally{w.close()}
});
