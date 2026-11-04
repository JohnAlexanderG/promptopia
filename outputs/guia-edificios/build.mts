// Builds outputs/Catalogo-de-edificios.pdf: a studio image of every building per role, level and island.
// Run from the repo root: npx tsx outputs/guia-edificios/build.mts
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROLES, DISTRICTS, ALL_ROLES, RESERVED, PATCHES, modelFor, buildingName, type District, type Role } from '../../lib/catalog';

const root = resolve(import.meta.dirname, '../..'), here = resolve(import.meta.dirname), img = join(here, 'img');
const deck = join(root, 'outputs/presentacion-slidev/node_modules'), file = (p: string) => pathToFileURL(p).href;
const ISLANDS = Object.keys(DISTRICTS) as District[];
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Group islands that build the same pair of models under the same names.
type Level = { model: string; name: string };
type Variant = { islands: District[]; levels: [Level, Level] };
const variants = new Map<Role, Variant[]>(ALL_ROLES.map(r => {
  const list: Variant[] = [];
  for (const d of ISLANDS) {
    if (!DISTRICTS[d].roles.includes(r)) continue;
    const levels = [1, 2].map(t => ({ model: modelFor(d, r, t), name: buildingName(d, r, t) })) as [Level, Level];
    const same = list.find(v => JSON.stringify(v.levels) === JSON.stringify(levels));
    if (same) same.islands.push(d); else list.push({ islands: [d], levels });
  }
  return [r, list];
}));
const models = [...new Set([...variants.values()].flat().flatMap(v => v.levels.map(l => l.model)))];

// 1. Render every model through render.html on a tiny static server (GLB + three from the repo).
const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary' };
const server = createServer(async (req, res) => {
  const path = join(root, decodeURIComponent(new URL(req.url!, 'http://x').pathname));
  if (!path.startsWith(root) || !existsSync(path)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(await readFile(path));
});
await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
const port = (server.address() as { port: number }).port;
const { chromium } = await import(file(join(deck, 'playwright-chromium/index.mjs')));
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
await mkdir(img, { recursive: true });
const sizes = new Map<string, { height: number; width: number }>();
{
  const page = await browser.newPage();
  page.on('pageerror', (e: Error) => console.error('render:', e.message));
  await page.goto(`http://127.0.0.1:${port}/outputs/guia-edificios/render.html`);
  await page.waitForFunction(() => (window as any).ready);
  for (const id of models) {
    const out = await page.evaluate(([m, p]: [string, number]) => (window as any).renderModel(m, p), [id, PATCHES[id] ?? 1]);
    await writeFile(join(img, `${id}.png`), Buffer.from(out.png.split(',')[1], 'base64'));
    sizes.set(id, { height: out.height, width: out.width });
    console.log('rendered', id, out.height);
  }
  await page.close();
}
server.close();

// 2. Lay out the catalogue.
const note = (r: Role, level: number, v: Variant) => {
  if (r === RESERVED && level === 2) return 'Se levanta a tamaño real en la manzana reservada de la isla.';
  if (level === 2 && v.levels[0].model === v.levels[1].model) return 'Mismo edificio; la parcela gana el borde dorado del nivel 2.';
  if (PATCHES[v.levels[level - 1].model]) return `Un campo de ${PATCHES[v.levels[level - 1].model]} × ${PATCHES[v.levels[level - 1].model]} parcelas de cultivo.`;
  return '';
};
const card = (r: Role, v: Variant, level: 1 | 2) => {
  const l = v.levels[level - 1], s = sizes.get(l.model)!;
  return `<figure class="card${level === 2 ? ' up' : ''}"><span class="lvl">Nivel ${level}</span><div class="pic"><img src="img/${l.model}.png" alt="${esc(l.name)}"></div>
    <figcaption><b>${esc(l.name)}</b><span>${s.height < 1 ? "a ras de suelo" : `≈ ${Math.round(s.height)} m de alto`} · ${Math.round(s.width)} m de ancho</span>${note(r, level, v) ? `<small>${note(r, level, v)}</small>` : ''}</figcaption></figure>`;
};
const rolePage = (r: Role, n: number) => {
  const list = variants.get(r)!, role = ROLES[r];
  return `<section class="page role n${Math.min(list.length, 5)}">
    <header><span class="kicker">Rol ${n} de ${ALL_ROLES.length}</span><h2><span class="ico">${role.icon}</span>${esc(role.label)}</h2>
      <p class="lede">${esc(role.challenge)} ${list.length > 1 ? `<b>${list.length} versiones según la isla.</b>` : '<b>El mismo edificio en todas sus islas.</b>'}</p></header>
    <div class="variants">${list.map(v => `<div class="variant"><div class="islands">${v.islands.map(d => `<span>${esc(DISTRICTS[d].label)}</span>`).join('')}</div>
      <div class="pair">${card(r, v, 1)}<div class="to">→</div>${card(r, v, 2)}</div></div>`).join('')}</div>
  </section>`;
};
const cover = `<section class="page cover"><div>
  <span class="kicker">Promptopia · Catálogo de edificios</span>
  <h1>Cada construcción,<br><em>nivel a nivel</em></h1>
  <p class="lede">Lo que levanta cada rol en su parcela: el edificio de nivel 1 al construir y el de nivel 2 al mejorar, con las versiones propias de cada isla.</p>
  <ul class="facts"><li><b>${ALL_ROLES.length}</b><span>roles</span></li><li><b>${models.length}</b><span>edificios distintos</span></li><li><b>${ISLANDS.length}</b><span>islas</span></li></ul>
  <p class="how"><b>Nivel 1:</b> 3 de 4 criterios y 10 créditos. <b>Nivel 2:</b> 4 de 4 con al menos una estrella, sin coste.</p></div>
  <div class="cover-grid">${['industrial_wearhouse_02', 'industrial_power_plant', 'city_joes_java', 'french_bistro', 'japanese_house_01', 'japanese_bilboard_building_01'].map(m => `<img src="img/${m}.png">`).join('')}</div>
</section>`;

const css = `
@page { size: A4 landscape; margin: 0; }
:root { --ink:#15261e; --forest:#123628; --cream:#f7f3ea; --paper:#fffdf8; --line:#e4dccb; --green:#2e6b4f; --teal:#3f949c; --coral:#e2674f; --gold:#e9b23c; --slate:#5b6b63;
  --serif:'Fraunces Variable', Georgia, serif; --sans:'Inter Variable', system-ui, sans-serif; }
* { box-sizing:border-box; }
body { margin:0; font-family:var(--sans); color:var(--ink); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.page { width:297mm; height:210mm; padding:12mm 15mm 14mm; background:var(--cream); position:relative; page-break-after:always; overflow:hidden; counter-increment:page; display:flex; flex-direction:column; }
.page::after { content:'Promptopia · Noviembre 2026 · ' counter(page); position:absolute; bottom:6mm; right:15mm; font-size:8pt; color:var(--slate); }
.kicker { font-size:8pt; letter-spacing:.18em; text-transform:uppercase; color:var(--green); font-weight:700; }
h1,h2 { font-family:var(--serif); color:var(--forest); margin:0; font-weight:600; }
h1 { font-size:38pt; line-height:1.05; margin:6mm 0 4mm; } h1 em { font-style:italic; color:var(--gold); }
h2 { font-size:22pt; margin:1.5mm 0 1mm; display:flex; align-items:center; gap:3mm; }
.ico { font-size:18pt; }
.lede { margin:0 0 4mm; color:var(--slate); font-size:10pt; } .lede b { color:var(--forest); }
.cover { flex-direction:row; align-items:center; gap:12mm; background:var(--forest); }
.cover > div:first-child { flex:1; } .cover h1 { color:var(--cream); } .cover .kicker { color:var(--gold); } .cover .lede { color:#cfe3d8; font-size:11pt; }
.cover::after { color:#9fbfae; }
.facts { list-style:none; padding:0; margin:0 0 6mm; display:flex; gap:9mm; }
.facts b { display:block; font-family:var(--serif); font-size:28pt; color:var(--gold); line-height:1; } .facts span { font-size:8.5pt; color:#cfe3d8; }
.how { color:#e8f0ea; font-size:9.5pt; line-height:1.6; } .how b { color:var(--gold); }
.cover-grid { flex:1.25; display:grid; grid-template-columns:repeat(3,1fr); gap:4mm; }
.cover-grid img { width:100%; background:#f7f3ea; border-radius:3mm; }
.variants { flex:1; display:grid; gap:4mm; min-height:0; }
.n1 .variants { grid-template-columns:1fr; } .n2 .variants { grid-template-columns:1fr; grid-template-rows:1fr 1fr; }
.n3 .variants, .n4 .variants { grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; }
.n5 .variants { grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr; }
.variant { background:var(--paper); border:1px solid var(--line); border-radius:3mm; padding:3mm 4mm; display:flex; flex-direction:column; min-height:0; }
.islands { display:flex; gap:1.5mm; flex-wrap:wrap; margin-bottom:2mm; }
.islands span { font-size:7pt; letter-spacing:.08em; text-transform:uppercase; font-weight:700; color:var(--green); background:#e7efe3; padding:1mm 2mm; border-radius:5mm; }
.pair { flex:1; display:flex; align-items:stretch; gap:2mm; min-height:0; }
.to { align-self:center; color:var(--coral); font-size:16pt; }
.card { flex:1; margin:0; display:flex; flex-direction:column; min-height:0; position:relative; }
.pic { flex:1; min-height:0; display:flex; align-items:center; justify-content:center; background:linear-gradient(#e6f4f6,#f4f8ee); border-radius:2mm; overflow:hidden; }
.pic img { max-width:100%; max-height:100%; object-fit:contain; }
.up .pic { box-shadow:inset 0 0 0 1.2mm var(--gold); }
.lvl { position:absolute; top:1.5mm; left:1.5mm; font-size:6.5pt; font-weight:700; letter-spacing:.1em; text-transform:uppercase; background:var(--forest); color:var(--cream); padding:.8mm 2mm; border-radius:5mm; z-index:1; }
.up .lvl { background:var(--gold); color:var(--forest); }
figcaption { padding-top:1.8mm; font-size:8pt; color:var(--slate); line-height:1.35; }
figcaption b { display:block; font-size:10pt; color:var(--forest); }
figcaption small { display:block; font-size:7.3pt; color:var(--coral); }
.n5 figcaption b, .n4 figcaption b, .n3 figcaption b { font-size:8.8pt; }
`;
const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Promptopia · Catálogo de edificios</title>
<link rel="stylesheet" href="${file(join(deck, '@fontsource-variable/fraunces/index.css'))}">
<link rel="stylesheet" href="${file(join(deck, '@fontsource-variable/fraunces/wght-italic.css'))}">
<link rel="stylesheet" href="${file(join(deck, '@fontsource-variable/inter/index.css'))}">
<style>${css}</style></head><body>${cover}${ALL_ROLES.map((r, i) => rolePage(r, i + 1)).join('')}</body></html>`;
const htmlPath = join(here, 'catalogo.html'), pdfPath = join(root, 'outputs/Catalogo-de-edificios.pdf');
await writeFile(htmlPath, html);
const page = await browser.newPage();
await page.goto(file(htmlPath), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: pdfPath, width: '297mm', height: '210mm', printBackground: true, preferCSSPageSize: true });
const pngDir = process.argv.includes('--png') ? process.argv[process.argv.indexOf('--png') + 1] : null;
if (pngDir) {
  await page.setViewportSize({ width: 1123, height: 794 });
  for (const [i, el] of (await page.$$('.page')).entries()) await el.screenshot({ path: join(pngDir, `c${i + 1}.png`) });
}
await browser.close();
console.log(pdfPath);
