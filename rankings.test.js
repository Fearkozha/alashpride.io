import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validate,swap} from './rankings.js';
const fixture=()=>({status:'preview',divisions:[{id:'70',champion:'champ',ranking:['first',null,'third']},{id:'66',champion:null,ranking:[]}],fighters:[['champ','70'],['first','70'],['third','70'],['other','66']].map(([id,division])=>({id,division,name:id,record:[1,0,0],fights:[]}))});
test('keeps explicit vacant positions when moving fighters',()=>{assert.deepEqual(swap(['first',null,'third'],0,1).slice(0,3),[null,'first','third']);});
test('champion cannot also occupy a contender position',()=>{const d=fixture();d.divisions[0].ranking[0]='champ';assert.throws(()=>validate(d),/два места/);});
test('duplicate contenders are rejected',()=>{const d=fixture();d.divisions[0].ranking[1]='first';assert.throws(()=>validate(d),/два места/);});
test('a fighter from another weight cannot be assigned',()=>{const d=fixture();d.divisions[0].ranking[0]='other';assert.throws(()=>validate(d),/весовой/);});
test('unknown fighter IDs and more than ten contenders are rejected',()=>{const d=fixture();d.divisions[0].ranking=['missing'];assert.throws(()=>validate(d));d.divisions[0].ranking=Array(11).fill(null);assert.throws(()=>validate(d));});
test('negative records and an unrecognized status are rejected',()=>{const d=fixture();d.fighters[0].record[1]=-1;assert.throws(()=>validate(d));d.fighters[0].record[1]=0;d.status='official';assert.throws(()=>validate(d));});
test('vacancies and unranked fighters are valid',()=>{assert.equal(validate(fixture()).divisions[0].ranking[1],null);});
test('unknown records and a fighter in two categories are valid',()=>{const d=fixture();d.fighters[1].record=[null,null,null];d.fighters[1].divisions=['70','66'];d.divisions[1].ranking=['first'];assert.doesNotThrow(()=>validate(d));});
test('a multi-weight profile cannot name an unknown category',()=>{const d=fixture();d.fighters[1].divisions=['70','999'];assert.throws(()=>validate(d));});

test('league record is optional for old data and validates separate results',()=>{const d=fixture();assert.doesNotThrow(()=>validate(d));d.fighters[0].leagueRecord=[null,2,0];assert.doesNotThrow(()=>validate(d));d.fighters[0].leagueRecord=[1,-1,0];assert.throws(()=>validate(d),/рекорд/);d.fighters[0].leagueRecord=[1,2];assert.throws(()=>validate(d),/рекорд/);});
