// Builds outputs/Guia-roles-y-edificios.pdf from the live catalog (no prompts, hints or examples).
// Run from the repo root: npx tsx outputs/guia-roles/build.mts
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROLES, DISTRICTS, ALL_ROLES, RESERVED, buildingName, type District, type Role } from '../../lib/catalog';
import { MAX_PLAYERS } from '../../lib/types';

const root = resolve(import.meta.dirname, '../..'), here = resolve(import.meta.dirname);
const deck = join(root, 'outputs/presentacion-slidev/node_modules');
const file = (p: string) => pathToFileURL(p).href;
const ISLANDS = Object.keys(DISTRICTS) as District[];

/** What each island adds beyond the plots (from README «Monumentos» and the scene). */
const SIGHTS: Record<District, string> = {
  centro: 'Calle comercial con edificios de ciudad en el borde oeste y semáforos en los cruces.',
  tokio: 'Torii a la entrada de la plaza, puente rojo sobre un estanque, faroles y cerezos.',
  paris: 'Frutería y barbería de mercado en el borde oeste, macetas a la entrada de la plaza y árboles de bulevar.',
  granja: 'Campos de cultivo, silo y vallas de madera; vacas, cerdos, ovejas y gallinas pasean por la isla.',
  industrial: 'Fábrica, torre de refrigeración y chimenea en el borde oeste; silos y conos de obra en las aceras.',
};
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function roleRow(d: District, r: Role) {
  const role = ROLES[r], l1 = buildingName(d, r, 1), l2 = buildingName(d, r, 2);
  const note = r === RESERVED ? '<small>El nivel 2 se levanta a tamaño real en la manzana reservada; en la parcela queda el nivel 1 con borde dorado.</small>' : '';
  return `<tr><td class="role"><span class="ico">${role.icon}</span>${esc(role.label)}</td><td>${esc(l1)}</td><td class="arrow">→</td><td><b>${esc(l2)}</b>${note}</td></tr>`;
}

function islandPage(d: District, n: number) {
  const dist = DISTRICTS[d], hasPlant = dist.roles.includes(RESERVED);
  return `<section class="page island">
    <header><span class="kicker">Isla ${n} de ${ISLANDS.length}</span><h2>${esc(dist.label)}</h2><p class="lede">${esc(dist.description)} <b>${dist.roles.length} roles.</b></p></header>
    <div class="cols">
      <div>
        <h3>Qué se construye en cada parcela</h3>
        <table class="build"><thead><tr><th>Rol</th><th>Nivel 1</th><th></th><th>Nivel 2</th></tr></thead><tbody>${dist.roles.map(r => roleRow(d, r)).join('')}</tbody></table>
      </div>
      <div>
        <div class="shot"><img src="img/${d}.jpeg" alt="Isla ${esc(dist.label)} con edificios construidos"></div>
        <h3>Qué tiene la isla</h3>
        <ul class="sights">
          <li><b>Manzana reservada:</b> ${hasPlant ? `solar con conos hasta que el primer ${ROLES[RESERVED].label} mejora a nivel 2; entonces aparece la ${esc(buildingName(d, RESERVED, 2).toLowerCase())} a tamaño real.` : `bosque: esta isla no tiene ${ROLES[RESERVED].label}.`}</li>
          <li><b>Plaza con fuente:</b> la misión 1 la ilumina, trae el atardecer y llena las calles de coches.</li>
          <li><b>Tren:</b> la misión 2 lo pone en marcha por el norte de la isla.</li>
          <li><b>Monumentos y ambiente:</b> ${esc(SIGHTS[d])}</li>
        </ul>
      </div>
    </div>
  </section>`;
}

const overview = `<section class="page">
  <header><span class="kicker">Los ${ALL_ROLES.length} roles</span><h2>Cada rol, su reto y su edificio</h2><p class="lede">Nombre base de cada edificio. Algunas islas usan su propia versión (ver páginas siguientes).</p></header>
  <table class="roles"><thead><tr><th>Rol</th><th>Reto</th><th>Nivel 1 → nivel 2</th>${ISLANDS.map(d => `<th class="isl">${esc(DISTRICTS[d].label)}</th>`).join('')}</tr></thead>
  <tbody>${ALL_ROLES.map(r => `<tr><td class="role"><span class="ico">${ROLES[r].icon}</span>${esc(ROLES[r].label)}</td><td class="task">${esc(ROLES[r].challenge)}</td><td>${esc(ROLES[r].building)} → <b>${esc(ROLES[r].upgrade)}</b></td>${ISLANDS.map(d => `<td class="isl">${DISTRICTS[d].roles.includes(r) ? '<span class="yes">●</span>' : '<span class="no">·</span>'}</td>`).join('')}</tr>`).join('')}
  <tr class="total"><td colspan="3">Roles disponibles</td>${ISLANDS.map(d => `<td class="isl">${DISTRICTS[d].roles.length}</td>`).join('')}</tr></tbody></table>
</section>`;

const cover = `<section class="page cover">
  <div class="cover-text">
    <span class="kicker">Promptopia · Guía de la ciudad</span>
    <h1>Qué se construye<br><em>en cada isla</em></h1>
    <p class="lede">Roles, edificios por parcela y lo que ofrece cada una de las ${ISLANDS.length} islas.</p>
    <ul class="facts">
      <li><b>${MAX_PLAYERS}</b><span>parcelas, una por persona</span></li>
      <li><b>${ALL_ROLES.length}</b><span>roles, según la isla</span></li>
      <li><b>2</b><span>niveles de edificio</span></li>
    </ul>
    <ol class="rules">
      <li><b>Construir:</b> con 3 de los 4 criterios cumplidos, el edificio de nivel 1 cuesta 10 de tus 20 créditos.</li>
      <li><b>Mejorar:</b> con 4 de 4 y al menos una estrella, pasa a nivel 2 sin coste y la parcela gana un borde dorado.</li>
      <li><b>Isla:</b> se elige en el lobby, antes de que entre la primera persona, y define los roles disponibles.</li>
    </ol>
  </div>
  <div class="cover-shot"><img src="img/centro.jpeg" alt="Isla Centro con edificios construidos"></div>
</section>`;

const css = `
@page { size: A4 landscape; margin: 0; }
:root { --ink:#15261e; --forest:#123628; --cream:#f7f3ea; --paper:#fffdf8; --line:#e4dccb; --green:#2e6b4f; --teal:#3f949c; --coral:#e2674f; --gold:#e9b23c; --slate:#5b6b63;
  --serif:'Fraunces Variable', Georgia, serif; --sans:'Inter Variable', system-ui, sans-serif; }
* { box-sizing: border-box; }
body { margin:0; font-family:var(--sans); color:var(--ink); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.page { width:297mm; height:210mm; padding:14mm 16mm 16mm; background:var(--cream); position:relative; page-break-after:always; overflow:hidden; counter-increment:page; }
.page::after { content:'Promptopia · Noviembre 2026 · ' counter(page); position:absolute; bottom:7mm; right:16mm; font-size:8pt; color:var(--slate); letter-spacing:.04em; }
.kicker { font-size:8pt; letter-spacing:.18em; text-transform:uppercase; color:var(--green); font-weight:700; }
h1,h2,h3 { font-family:var(--serif); color:var(--forest); margin:0; }
h1 { font-size:40pt; line-height:1.05; margin:6mm 0 4mm; font-weight:600; letter-spacing:-.01em; }
h1 em { color:var(--teal); font-style:italic; }
h2 { font-size:24pt; margin:2mm 0 1.5mm; font-weight:600; }
h3 { font-size:12pt; margin:0 0 3mm; font-weight:600; }
.lede { margin:0 0 6mm; color:var(--slate); font-size:10.5pt; }
.lede b { color:var(--forest); }
.cover { display:grid; grid-template-columns:1fr 1.15fr; gap:12mm; align-items:center; background:var(--forest); color:var(--cream); }
.cover h1 { color:var(--cream); } .cover h1 em { color:var(--gold); } .cover .kicker { color:var(--gold); } .cover .lede { color:#cfe3d8; }
.cover::after { color:#9fbfae; }
.facts { list-style:none; padding:0; margin:0 0 7mm; display:flex; gap:9mm; }
.facts b { display:block; font-family:var(--serif); font-size:28pt; color:var(--gold); line-height:1; }
.facts span { font-size:8.5pt; color:#cfe3d8; }
.rules { margin:0; padding-left:5mm; font-size:9.5pt; line-height:1.55; color:#e8f0ea; }
.rules li { margin-bottom:2mm; } .rules b { color:var(--gold); }
.cover-shot, .shot { border-radius:4mm; overflow:hidden; box-shadow:0 3mm 8mm rgba(0,0,0,.25); }
.cover-shot { aspect-ratio:1440/560; transform:rotate(1.2deg); }
.shot { aspect-ratio:1440/598; margin-bottom:6mm; box-shadow:0 1.5mm 4mm rgba(18,54,40,.18); }
.cover-shot img, .shot img { width:100%; display:block; margin-top:-9.5%; }
table { width:100%; border-collapse:collapse; font-size:9pt; }
th { text-align:left; font-size:7.5pt; letter-spacing:.1em; text-transform:uppercase; color:var(--slate); font-weight:600; padding:0 2.5mm 2mm; border-bottom:1.5px solid var(--forest); }
td { padding:2mm 2.5mm; border-bottom:1px solid var(--line); vertical-align:middle; }
tbody tr:nth-child(odd) td { background:var(--paper); }
td.role { font-weight:600; white-space:nowrap; color:var(--forest); }
.ico { display:inline-block; width:6mm; }
td.task { color:var(--slate); }
td small { display:block; font-size:7.5pt; color:var(--slate); margin-top:.8mm; font-weight:400; }
.arrow { color:var(--coral); width:4mm; padding:0; text-align:center; }
.isl { text-align:center; width:19mm; }
.yes { color:var(--green); font-size:11pt; } .no { color:#c9c2b2; }
tr.total td { font-weight:700; color:var(--forest); background:transparent!important; border-bottom:none; border-top:1.5px solid var(--forest); }
.roles td { padding:1.7mm 2.5mm; }
.cols { display:grid; grid-template-columns:1fr 1.1fr; gap:10mm; }
.build td { padding:2.3mm 2.5mm; }
.sights { margin:0; padding-left:4.5mm; font-size:9pt; line-height:1.5; }
.sights li { margin-bottom:1.6mm; } .sights b { color:var(--forest); }
`;

const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Promptopia · Qué se construye en cada isla</title>
<link rel="stylesheet" href="${file(join(deck, '@fontsource-variable/fraunces/index.css'))}">
<link rel="stylesheet" href="${file(join(deck, '@fontsource-variable/fraunces/wght-italic.css'))}">
<link rel="stylesheet" href="${file(join(deck, '@fontsource-variable/inter/index.css'))}">
<style>${css}</style></head><body>${cover}${overview}${ISLANDS.map((d, i) => islandPage(d, i + 1)).join('')}</body></html>`;

const htmlPath = join(here, 'guia.html'), pdfPath = join(root, 'outputs/Guia-roles-y-edificios.pdf');
writeFileSync(htmlPath, html);
const { chromium } = await import(file(join(deck, 'playwright-chromium/index.mjs')));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(file(htmlPath), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: pdfPath, width: '297mm', height: '210mm', printBackground: true, preferCSSPageSize: true });
if (process.argv.includes('--png')) {
  await page.setViewportSize({ width: 1123, height: 794 });
  const pages = await page.$$('.page');
  for (const [i, el] of pages.entries()) await el.screenshot({ path: join(process.argv[process.argv.indexOf('--png') + 1], `p${i + 1}.png`) });
}
await browser.close();
console.log(pdfPath);
