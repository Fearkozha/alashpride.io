export function validate(data) {
  if (!data || !['preview', 'verified'].includes(data.status) || !Array.isArray(data.divisions) || !data.divisions.length || !Array.isArray(data.fighters)) throw Error('Некорректная база рейтинга.');
  const divisions = new Set(data.divisions.map(d => d.id));
  const fighters = new Map(data.fighters.map(f => [f.id, f]));
  if (divisions.size !== data.divisions.length || fighters.size !== data.fighters.length) throw Error('Идентификаторы не должны повторяться.');
  for (const f of data.fighters) {
    if (!/^[a-z0-9-]+$/.test(f.id) || typeof f.name !== 'string' || !f.name.trim() || !divisions.has(f.division) || (f.divisions && (!Array.isArray(f.divisions) || !f.divisions.includes(f.division) || new Set(f.divisions).size !== f.divisions.length || f.divisions.some(id => !divisions.has(id)))) || !Array.isArray(f.fights) || !Array.isArray(f.record) || f.record.length !== 3 || f.record.some(n => n !== null && (!Number.isSafeInteger(n) || n < 0)) || (f.leagueRecord !== undefined && (!Array.isArray(f.leagueRecord) || f.leagueRecord.length !== 3 || f.leagueRecord.some(n => n !== null && (!Number.isSafeInteger(n) || n < 0))))) throw Error('Проверь имя, категорию и рекорд бойца.');
  }
  for (const d of data.divisions) {
    if (!Array.isArray(d.ranking) || d.ranking.length > 10) throw Error('В категории может быть не больше десяти претендентов.');
    const selected = [d.champion, ...d.ranking].filter(Boolean);
    if (new Set(selected).size !== selected.length) throw Error('Боец не может занимать два места или быть одновременно чемпионом и претендентом.');
    if (selected.some(id => !fighters.has(id) || !(fighters.get(id).divisions || [fighters.get(id).division]).includes(d.id))) throw Error('Боец должен принадлежать выбранной весовой категории.');
  }
  return data;
}
export function swap(ranking, from, to) {
  const result = Array.from({length: 10}, (_, i) => ranking[i] || null);
  if (from >= 0 && from < 10 && to >= 0 && to < 10) [result[from], result[to]] = [result[to], result[from]];
  return result;
}
