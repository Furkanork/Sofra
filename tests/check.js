#!/usr/bin/env node
/* Sofra checks. Run from the repo folder:  node tests/check.js
   Checks the recipe data, Turkish translations, interface text, pantry coverage,
   swap suggestions, drawings, diet labels and the offline file list. Exits 1 on any failure. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

// Load the data and helper scripts the way the browser does, into one shared window.
const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of ['recipes.js', 'recipes-tr.js', 'i18n.js', 'subs.js', 'pantry.js', 'diet.js', 'draw.js']) {
  vm.runInContext(read(f), ctx, { filename: f });
}
const W = ctx.window;
const R = W.SOFRA_RECIPES, TR = W.SOFRA_TR, I18N = W.SOFRA_I18N, SUBS = W.SOFRA_SUBS, PAN = W.SOFRA_PANTRY;
const { diet, OPT } = W.SofraDiet;
const { art } = W.SofraDraw;

const failures = [];
let checks = 0;
const check = (ok, msg) => { checks++; if (!ok) failures.push(msg); };
const section = name => process.stdout.write(`- ${name}\n`);

// ---------- recipes ----------
section(`recipes (${R.length})`);
const COURSES = ['breakfast', 'soups', 'meze', 'mains', 'pasta', 'bakes', 'desserts'];
const UNITS = ['', 'g', 'kg', 'ml', 'l', 'tsp', 'tbsp'];
const ids = new Set();
for (const r of R) {
  const at = `recipe ${r.id}`;
  check(typeof r.id === 'string' && /^[a-z0-9-]+$/.test(r.id), `${at}: id must be lowercase letters, digits and dashes`);
  check(!ids.has(r.id), `${at}: duplicate id`); ids.add(r.id);
  for (const k of ['name', 'origin', 'unit', 'level', 'tint']) check(typeof r[k] === 'string' && r[k], `${at}: missing ${k}`);
  check(COURSES.includes(r.course), `${at}: unknown course "${r.course}"`);
  for (const k of ['time', 'active', 'serves']) check(Number.isFinite(r[k]) && r[k] > 0, `${at}: ${k} must be a positive number`);
  check(r.active <= r.time, `${at}: hands-on time is longer than total time`);
  check(/^#[0-9a-f]{6}$/i.test(r.tint), `${at}: tint must be a #rrggbb colour`);
  check(Array.isArray(r.ing) && r.ing.some(i => typeof i !== 'string'), `${at}: needs ingredients`);
  check(Array.isArray(r.steps) && r.steps.length > 0 && r.steps.every(s => typeof s === 'string' && s.trim()), `${at}: needs steps`);
  for (const i of r.ing || []) {
    if (typeof i === 'string') { check(i.startsWith('#') && i.length > 1, `${at}: heading "${i}" must start with #`); continue; }
    check(Array.isArray(i) && i.length === 3, `${at}: ingredient must be [amount, unit, name]`);
    check(Number.isFinite(i[0]) && i[0] >= 0, `${at}: bad amount in "${i[2]}"`);
    check(UNITS.includes(i[1]), `${at}: unknown unit "${i[1]}" in "${i[2]}"`);
    check(typeof i[2] === 'string' && i[2].trim(), `${at}: empty ingredient name`);
  }
  const svg = art(r, true, null);
  check(/<g class="dish">.+<\/g>/s.test(svg), `${at}: drawing is empty (art type "${r.art && r.art.t}")`);
  check(!/NaN|undefined/.test(svg), `${at}: drawing contains NaN or undefined`);
}

// ---------- translations ----------
section('Turkish recipe translations');
let full = 0;
for (const r of R) {
  const x = TR[r.id];
  check(!!x, `translation ${r.id}: missing (needs at least a Turkish description)`);
  if (!x || !x.steps) continue;
  full++;
  check(x.steps.length === r.steps.length, `translation ${r.id}: ${x.steps.length} steps, English has ${r.steps.length}`);
  check(Array.isArray(x.ing) && x.ing.length === r.ing.length, `translation ${r.id}: ${(x.ing || []).length} ingredients, English has ${r.ing.length}`);
  if (Array.isArray(x.ing) && x.ing.length === r.ing.length) r.ing.forEach((i, k) => {
    check((typeof i === 'string') === String(x.ing[k]).startsWith('#'), `translation ${r.id}: heading mismatch at ingredient ${k + 1}`);
  });
  check(!!r.tip === !!x.tip, `translation ${r.id}: tip present in one language only`);
}
for (const id of Object.keys(TR)) check(ids.has(id), `translation ${id}: no recipe with this id`);
process.stdout.write(`  ${full} fully translated\n`);

// ---------- interface text ----------
section('Turkish interface text');
const app = read('app.js'), html = read('index.html');
const keys = new Set();
for (const m of app.matchAll(/\bt\('((?:[^'\\]|\\.)*)'/g)) keys.add(m[1]);
for (const m of html.matchAll(/data-t[pa]?="([^"]*)"/g)) keys.add(m[1].replace(/&amp;/g, '&'));
for (const m of app.matchAll(/\['(\w+)','([^']+)'\]/g)) keys.add(m[2]);           // COURSES, DAYS, DIETS labels
for (const r of R) { keys.add(r.origin); keys.add(r.level); }
['My kitchen', 'Home recipe', 'Grams & millilitres', 'US cups', 'Turkish su bardağı (200 ml)', 'Other'].forEach(k => keys.add(k));
const looksLikeLabel = k => /[A-Za-z]/.test(k) && !/^[a-z]+$/.test(k) && !/^#/.test(k);
for (const k of keys) if (looksLikeLabel(k)) check(I18N.tr[k] != null, `interface text missing Turkish: "${k}"`);

// ---------- pantry coverage ----------
section('pantry coverage');
const items = PAN.items.map(p => ({ k: p[0], re: new RegExp(p[4], 'i') }));
check(new Set(items.map(p => p.k)).size === items.length, 'pantry: duplicate item keys');
for (const r of R) for (const i of r.ing) {
  if (typeof i === 'string') continue;
  const n = i[2].toLowerCase();
  if (OPT.test(n)) continue;
  check(items.some(p => p.re.test(n)), `pantry: "${i[2]}" (${r.id}) matches no pantry item`);
}

// ---------- swaps ----------
section('swap suggestions');
const A = (m, u) => `${Math.round(100 * m)} ${u || 'g'}`;
SUBS.forEach(([re, fn], k) => {
  let out;
  try { out = fn(A); } catch (e) { check(false, `swap #${k} (${re}): throws ${e.message}`); return; }
  check(Array.isArray(out) && out.length > 0, `swap #${k} (${re}): returns no suggestions`);
  for (const s of out || []) check(typeof s === 'string' && !/NaN|undefined/.test(s), `swap #${k} (${re}): bad text "${s}"`);
});

// ---------- diet labels: known answers ----------
section('diet labels');
const expect = {
  'souvlaki': { veg: false }, 'borscht': { veg: false }, 'joojeh-kabab': { veg: false }, 'panna-cotta': { veg: false },
  'loukoumades': { vegan: false }, 'qutab': { vegan: false }, 'tiramisu': { vegan: false, gf: false },
  'hummus': { vegan: true, gf: true }, 'falafel': { vegan: true }, 'kuru-fasulye': { veg: true },
  'torta-caprese': { gf: true, veg: true }, 'pizza': { gf: false }, 'menemen': { gf: true }, 'baklava': { gf: false },
};
for (const [id, want] of Object.entries(expect)) {
  const r = R.find(x => x.id === id);
  check(!!r, `diet: test recipe ${id} not found`);
  if (!r) continue;
  const got = diet(r);
  for (const [k, v] of Object.entries(want)) check(got[k] === v, `diet: ${id} should have ${k}=${v}, got ${got[k]}`);
}

// ---------- offline file list ----------
section('offline files and versions');
const sw = read('sw.js');
const scripts = [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([\w.-]+\.(?:js|css))(?:\?v=(\d+))?"/g)];
const versions = new Set(scripts.map(m => m[2]));
for (const [, file] of scripts) check(sw.includes(`'${file}'`), `sw.js: ${file} is not in the offline list`);
check(versions.size === 1, `index.html: file links use different ?v= numbers (${[...versions].join(', ')})`);
const swVersion = (sw.match(/sofra-v(\d+)/) || [])[1];
check(swVersion === [...versions][0], `sw.js VERSION (v${swVersion}) and index.html ?v=${[...versions][0]} should match`);
for (const [, file] of scripts) check(fs.existsSync(path.join(root, file)), `index.html links ${file}, which does not exist`);

// ---------- result ----------
if (failures.length) {
  console.error(`\n${failures.length} of ${checks} checks failed:`);
  failures.forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
console.log(`\nAll ${checks} checks passed.`);
