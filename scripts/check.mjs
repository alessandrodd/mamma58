import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const js = await readFile(new URL('../app.js', import.meta.url), 'utf8');

const checks = [
  ['viewport mobile', html.includes('viewport-fit=cover')],
  ['foglio di stile', html.includes('styles.css') && css.length > 1000],
  ['sei sfide', (js.match(/id:'/g) || []).length >= 6],
  ['quattro regali', (js.match(/\['(?:cornice|maglia|camomilla|viaggio)'/g) || []).length === 4],
  ['scelta di due regali', js.includes('state.gifts.length===2')],
  ['modalità debug', js.includes("get('debug')==='58'")],
  ['salvataggio locale', js.includes('localStorage')]
];
for (const [name, ok] of checks) {
  if (!ok) throw new Error(`Controllo fallito: ${name}`);
  console.log(`✓ ${name}`);
}
