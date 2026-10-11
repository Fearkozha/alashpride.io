import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';

// Exercise the actual form and publish handler; only the external network is replaced.
const source=readFileSync(new URL('./admin.source.js',import.meta.url),'utf8');
const bundle=await build({stdin:{contents:source+'\nwindow.testAdmin={start(value){model=value;revision=1;editorView();},snapshot(){return model;}};',resolveDir:process.cwd()},bundle:true,write:false,format:'iife',plugins:[{name:'offline-client',setup(b){b.onResolve({filter:/^@supabase\/supabase-js$/},()=>({path:'client',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const createClient=()=>window.testClient;'}));}}]});
function setup(full=false){
 const dom=new JSDOM('<main id="admin"></main>',{url:'https://example.test/admin.html',runScripts:'outside-only'});
 const w=dom.window;w.structuredClone=structuredClone;w.ALASH_COPY_FIELDS=[];w.HTMLElement.prototype.scrollIntoView=function(){};
 let saved;
 w.testClient={auth:{onAuthStateChange(){}},from(){return {update(value){saved=structuredClone(value.payload);return this},eq(){return this},async select(){return {data:[{revision:2}],error:null}}}}};
 w.eval(bundle.outputFiles[0].text);
 const fighters=Array.from({length:full?10:1},(_,i)=>({id:'old-'+i,name:'Old '+i,division:'70',record:[1,0,0],fights:[]}));
 w.testAdmin.start({status:'verified',divisions:[{id:'70',name:'Лёгкий',limit:'70 кг',champion:null,ranking:full?fighters.map(f=>f.id):['old-0',null]}],fighters});
 return {w,dom,model:()=>w.testAdmin.snapshot(),saved:()=>saved};
}
function submit(w,name='New Fighter'){
 const form=w.document.querySelector('#add-fighter');form.elements.namedItem('name').value=name;
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
}
test('adding a fighter fills the first vacant ranking position and publishes it',async()=>{
 const {w,dom,model,saved}=setup();
 try{submit(w);const added=model().fighters.at(-1);assert.equal(added.name,'New Fighter');assert.equal(model().divisions[0].ranking[1],added.id);
 assert.equal(w.document.querySelector('#fighter-to-edit').value,added.id);
 await w.document.querySelector('#publish').onclick();assert.equal(saved().divisions[0].ranking[1],added.id);
 assert.match(w.document.querySelector('#save-state').textContent,/Все изменения сохранены/);
 }finally{dom.window.close()}
});
test('a full top ten explicitly defaults to outside ranking without evicting anyone',()=>{
 const {w,dom,model}=setup(true);
 try{const field=w.document.querySelector('#add-fighter [name="position"]');assert.ok(field,'position choice must be visible');assert.equal(field.value,'unranked');const before=[...model().divisions[0].ranking];submit(w);assert.deepEqual([...model().divisions[0].ranking],before);assert.match(w.document.querySelector('#message').textContent,/вне рейтинга/);}finally{dom.window.close()}
});
test('invalid fighter names show an error beside the form and keep its values',()=>{
 const {w,dom,model}=setup();
 try{submit(w,'   ');assert.equal(model().fighters.length,1);assert.ok(w.document.querySelector('#add-fighter-message')?.textContent.trim());assert.equal(w.document.querySelector('#add-fighter [name="name"]').value,'   ');}finally{dom.window.close()}
});
test('explicit occupied-place replacement asks confirmation and cancellation changes nothing',()=>{
 const {w,dom,model}=setup(true);
 try{const field=w.document.querySelector('#add-fighter [name="position"]');assert.ok(field);field.value='0';let prompted=false;w.confirm=()=>{prompted=true;return false};submit(w);assert.equal(prompted,true);assert.equal(model().fighters.length,10);assert.equal(model().divisions[0].ranking[0],'old-0');}finally{dom.window.close()}
});
test('confirmed replacement preserves the displaced fighter and normalizes country',()=>{
 const {w,dom,model}=setup(true);
 try{w.document.querySelector('#add-fighter [name="position"]').value='0';w.document.querySelector('#add-fighter [name="country"]').value='KZ';w.confirm=()=>true;submit(w);const added=model().fighters.at(-1);assert.equal(model().divisions[0].ranking[0],added.id);assert.ok(model().fighters.find(f=>f.id==='old-0'));assert.equal(added.code,'KAZ');assert.equal(added.countries[0],'KAZ');}finally{dom.window.close()}
});
test('adding a champion keeps all contender places unchanged',()=>{
 const {w,dom,model}=setup();
 try{w.document.querySelector('#add-fighter [name="position"]').value='champion';const before=[...model().divisions[0].ranking];submit(w);assert.equal(model().divisions[0].champion,model().fighters.at(-1).id);assert.deepEqual([...model().divisions[0].ranking].slice(0,before.length),before);}finally{dom.window.close()}
});
test('failed publish retains new fighter and unsaved status for retry',async()=>{
 const {w,dom,model}=setup();
 try{submit(w);const id=model().fighters.at(-1).id;w.testClient.from=()=>({update(){return this},eq(){return this},async select(){return {data:null,error:{message:'offline'}}}});await w.document.querySelector('#publish').onclick();assert.equal(model().divisions[0].ranking[1],id);assert.match(w.document.querySelector('#save-state').textContent,/несохранённые/);assert.match(w.document.querySelector('#message').textContent,/Не удалось сохранить/);assert.equal(w.document.querySelector('#publish').disabled,false);}finally{dom.window.close()}
});
