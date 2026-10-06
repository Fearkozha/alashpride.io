import {URL, KEY, DOCUMENT_ID} from './config.js';
import {validate} from './rankings.js';
// Keep the bundled preview when the database cannot be reached; never cache edits locally.
fetch(`${URL}/rest/v1/site_content?id=eq.${DOCUMENT_ID}&kind=eq.ranking&published=eq.true&select=payload`, {
  headers: {apikey: KEY}, signal: AbortSignal.timeout(10000), cache: 'no-store'
}).then(response => {if (!response.ok) throw Error('Рейтинг временно недоступен'); return response.json();})
  .then(rows => {if (rows[0]) {Object.assign(window.ALASH_DATA, validate(rows[0].payload)); window.dispatchEvent(new Event('alash:rankings'));}})
  .catch(() => {window.ALASH_RANKING_ERROR = true; window.dispatchEvent(new Event('alash:rankings'));});
