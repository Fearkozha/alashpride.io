export const fighterCountries = {KAZ:'Казахстан',KGZ:'Кыргызстан',UZB:'Узбекистан',RUS:'Россия',BRA:'Бразилия',AZE:'Азербайджан',GEO:'Грузия'};
const aliases={KZ:'KAZ',KG:'KGZ',UZ:'UZB',RU:'RUS',BR:'BRA',AZ:'AZE',GE:'GEO'};
export function selectedCountries(f){return [...new Set((Array.isArray(f.countries)?f.countries:String(f.code||'').split('/')).map(c=>aliases[c.trim()]||c.trim()).filter(c=>c&&c!=='—'))];}
export function setFighterCountries(f,codes,catalog=fighterCountries){
 const selected=[...new Set(codes.filter(Boolean))];
 if(selected.some(code=>!catalog[code]))throw Error('Выбери страну из списка.');
 f.countries=selected;f.code=selected.join(' / ')||'—';f.country=selected.map(c=>catalog[c]).join(' / ')||'Страна не указана';
}
