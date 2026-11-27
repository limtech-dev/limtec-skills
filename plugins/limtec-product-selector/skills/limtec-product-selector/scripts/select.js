#!/usr/bin/env node
/* Lim-Tec Selector — English CLI.
 *
 * Same engine, same price book, same results as the Lim-Tec online platform
 * (byte-identical files, md5 in scripts/source_manifest.json). Only the
 * presentation and the accepted option vocabulary are English; see scripts/en_terms.js.
 *
 * Usage:
 *   node scripts/select.js --product=screwjack --set units=4 --set load=8 --set load_unit=kN \
 *        --set stroke_mm=700 --set speed_mm_s=6.25 --set layout=h [--json result.json]
 *   node scripts/select.js --product=cylinder --set series=DMB --set load=1 --set load_unit=t \
 *        --set stroke_mm=400 --set speed_mm_s=200
 *   node scripts/select.js --demo                # one built-in case per product line
 *   node scripts/select.js --list-fields --product=rod
 *   node scripts/select.js --product=screwjack ... --lint   # report untranslated fragments
 *
 * Product lines: screwjack = Screw Jacks, cylinder = Electric Cylinders, rod = Linear Actuators
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');
const { T, VI, residue, setRaw, asciiPunct } = require('./en_terms');

const HERE = __dirname;
const ROOT = path.join(HERE, '..');

/* ---------- 1. argument parsing ---------- */
const argv = process.argv.slice(2);
function argVal(name) {
  const i = argv.indexOf('--' + name);
  if (i >= 0) return argv[i + 1];
  const p = '--' + name + '=';
  const j = argv.findIndex((a) => a.indexOf(p) === 0);
  return j >= 0 ? argv[j].slice(p.length) : null;
}
const hasFlag = (n) => argv.indexOf('--' + n) >= 0;
const PRODUCT = argVal('product');
const JSON_OUT = argVal('json');
const QUIET = hasFlag('quiet');
const DEMO = hasFlag('demo');
const LINT = hasFlag('lint');
/* `--raw` dumps the engine strings before translation: use it to trace a new
   Chinese fragment back to the sentence that produced it. */
if (hasFlag('raw')) setRaw(true);

const PRODUCT_LABEL = { screwjack: 'Screw Jacks', cylinder: 'Electric Cylinders', rod: 'Linear Actuators' };
const WEB_LINK = 'https://limtec-cad-models.app.workbuddy.host/?v=1030&sharecode=SOD467H7ZK';
/* USD reference price = Lim-Tec list price / rate; the rate lives in scripts/rate.js
   and is never disclosed in customer-facing output. */
const { USD_RATE, RATE_DATE } = require('./rate');
const PRICE_NOTE = 'Prices are public reference prices, tax included, quoted in USD '
  + '(converted from the Lim-Tec list price at a rate reviewed by Lim-Tec). '
  + 'They are indicative only - a binding quotation in USD is issued by Lim-Tec.';

/* ---------- 2. load the engine in a shared scope (mirrors the browser script tags) ---------- */
function readScript(rel) {
  const abs = path.join(ROOT, rel);
  if (fs.existsSync(abs)) return fs.readFileSync(abs, 'utf8');
  if (fs.existsSync(abs + '.gz')) return zlib.gunzipSync(fs.readFileSync(abs + '.gz')).toString('utf8');
  throw new Error('missing engine file: ' + rel);
}

function loadScope() {
  const ctx = { console, TextEncoder, TextDecoder, Buffer, Blob };
  ctx.globalThis = ctx;
  ctx.window = ctx;              /* window and globalThis must be the same object */
  vm.createContext(ctx);
  const files = [
    'data/data-screwjack.js', 'data/catalog2026.js', 'data/cylinder-data.js',
    'data/rod-data.js', 'data/rod-drive.js', 'data/tech2026.js',
    'data/pricebook-cylinder.js', 'data/pricebook-domestic.js',
    'data/pricebook-limtec.js', 'data/pricebook-rod.js',
    'engine/core.js', 'engine/screwjack.js', 'engine/autoselect.js',
    'engine/cylinder.js', 'engine/rod.js',
    'products/screwjack.js', 'products/cylinder.js', 'products/rod.js',
    'assets/index.js',
  ];
  for (const f of files) vm.runInContext(readScript(f), ctx, { filename: f });
  return ctx;
}

/* ---------- 3. input merging (English values are mapped back to the engine's vocabulary) ---------- */
const ARRAY_KEYS = new Set(['servo_brand', 'accessories', 'special', 'special_texts', 'brands']);
function coerce(v) {
  try { return JSON.parse(v); } catch (e) { /* plain string */ }
  return v;
}
function applySets(inp, sets) {
  for (const raw of sets) {
    const i = raw.indexOf('=');
    if (i < 0) throw new Error('expected --set key=value, got: ' + raw);
    const k = raw.slice(0, i).trim();
    let v = coerce(raw.slice(i + 1).trim());
    if (!Array.isArray(v)) v = VI(k, v);
    inp[k] = (ARRAY_KEYS.has(k) && !Array.isArray(v)) ? [v] : v;
  }
  return inp;
}

/* ---------- 4. product adapters ---------- */
function num(v) { return (typeof v === 'number' && isFinite(v)) ? v : null; }

function checksList(res) {
  const c = res && res.checks;
  if (!c) return [];
  return Object.keys(c).map((k) => ({ name: T(k), ok: c[k] === true, val: c[k] }));
}

function calcSummary(res, keys) {
  const rows = [];
  (keys || []).forEach((k) => {
    const v = res ? res[k] : null;
    if (num(v) != null) rows.push([k, v]);
  });
  return rows;
}

function motorRowSJ(P, res, cal) {
  const m0 = (res.motor_recommend || [])[0];
  if (!m0 || cal.drive === 'hand') return null;
  const qty = (cal.sync === '电气') ? (Number(cal.units) || 1) : 1;
  const dualQ = (m0.kind === 'ac' && P.huDualShaft) ? !!P.huDualShaft(res, cal) : false;
  let kit = null;
  try {
    kit = (m0.kind === 'servo') ? P.motorDrivePriceOf(m0, cal)
        : (m0.kind === 'ac') ? P.acMotorPriceOf(m0, dualQ) : null;
  } catch (e) { kit = null; }
  const unit = (kit && kit.hasPrice && num(kit.unit) != null) ? kit.unit : null;
  const kind = (m0.kind === 'servo') ? 'AC servo motor + drive' : 'AC motor';
  return {
    desc: kind,
    spec: T(m0.brand || '') + ' ' + asciiPunct(m0.code) + ' | power ' + m0.power_kW
      + ' kW | rated speed ' + m0.rpm + ' rpm' + (kit && kit.kitTxt ? ' | ' + T(kit.kitTxt) : ''),
    qty, unit_price: unit,
  };
}

function failResult(product, out, e) {
  return {
    product, product_label: PRODUCT_LABEL[product], model: null,
    error: e ? ('Calculation error: ' + e.message) : T((out && out.error) || ''),
    best: out && out.bestEffort ? T(out.bestEffort.label) : null,
    unresolved: ((out && out.unresolved) || []).map(T), warnings: ((out && out.warnings) || []).map(T),
    input: (out && out.input) || {}, quote: { rows: [], total: null, total_usd: null, missing: [], currency: 'USD', rate: USD_RATE, rate_date: RATE_DATE },
    checks: [], calc: [], accessories: [],
  };
}

function renderScrewjack(ctx, sets) {
  const P = ctx.SJScrewJackProduct, data = ctx.SJ_DATA;
  const inp = applySets(P.defaultInput(), sets);
  const out = P.autoSelect(inp, data);
  const res = out.chosenResult, cal = out.cal;
  if (!out.chosen) return failResult('screwjack', out);
  const acc = P.buildAccessories(res, cal, data);
  const code = P.suggestCode(cal, res);
  const items = P.quoteItems(res, cal, data, acc, code);
  const rows = items.map((it) => ({ desc: T(it.desc), spec: T(it.spec || ''), qty: it.n || Number(it.qty) || 0 }));
  P.applyLimtecPrices(rows, res, cal, data);
  const mrow = motorRowSJ(P, res, cal);
  if (mrow) rows.push(mrow);
  let total = 0, any = false;
  rows.forEach((r) => { if (num(r.unit_price) != null) { any = true; total += r.unit_price * (r.qty || 0); } });
  return {
    product: 'screwjack', product_label: PRODUCT_LABEL.screwjack, input: inp,
    model: out.chosen.model, full_code: T(code),
    spec: T((rows[0] && rows[0].spec) || ''), checks: checksList(res),
    calc: calcSummary(res, ['total_power_kW', 'motor_torque_Nm', 'motor_demand_kW', 'effective_load_kN', 'p_in_kW', 'env_coef']),
    accessories: acc.map((a) => ({ desc: T(a.desc), qty: a.qty })),
    quote: {
      rows, total: any ? total : null, total_usd: any ? Math.round(total / USD_RATE) : null,
      currency: 'USD', rate: USD_RATE, rate_date: RATE_DATE,
      missing: rows.filter((r) => num(r.unit_price) == null).map((r) => String(r.desc).slice(0, 40)),
    },
    warnings: ((out.warnings) || []).map(T), layout_image: P.layoutImageFor(cal) || null,
  };
}

function renderCylinder(ctx, sets) {
  const P = ctx.SJCylinderProduct, data = ctx.SJ_CYL_DATA;
  const inp = applySets(P.defaultInput(), sets);
  const out = P.autoSelect(inp, data);
  const res = out.chosenResult, cal = out.cal;
  if (!out.chosen) return failResult('cylinder', out);
  const np = P.cylNetPriceOf(res, cal, data);
  const rows = (np.parts || []).map((p0) => ({ desc: T(p0.txt), spec: '', qty: 1, unit_price: num(p0.p) }));
  const m0 = (res.motor_recommend || [])[0];
  if (m0) {
    let kit = null;
    try { kit = P.motorDrivePriceOf(m0, cal); } catch (e) { kit = null; }
    if (kit && kit.hasPrice && num(kit.unit) != null) {
      rows.push({
        desc: 'AC servo motor + drive',
        spec: T(m0.brand || '') + ' ' + asciiPunct(m0.code) + ' | power ' + m0.power_kW + ' kW'
          + (kit.kitTxt ? ' | ' + T(kit.kitTxt) : ''),
        qty: 1, unit_price: kit.unit,
      });
    } else {
      rows.push({
        desc: 'AC servo motor + drive',
        spec: T(m0.brand || '') + ' ' + asciiPunct(m0.code) + ' | power ' + m0.power_kW + ' kW (kit price on request)',
        qty: 1, unit_price: null,
      });
    }
  }
  (np.missing || []).forEach((m1) => rows.push({ desc: 'Quotation required: ' + T(m1), spec: '', qty: 1, unit_price: null }));
  let total = 0, any = false;
  rows.forEach((r) => { if (num(r.unit_price) != null) { any = true; total += r.unit_price * (r.qty || 0); } });
  return {
    product: 'cylinder', product_label: PRODUCT_LABEL.cylinder, input: inp,
    model: out.chosen.model, full_code: T(P.suggestCode(cal, res) || out.chosen.model),
    spec: rows[0] ? rows[0].desc : '', checks: checksList(res),
    calc: calcSummary(res, ['total_power_kW', 'motor_torque_Nm', 'effective_load_kN', 'life_km', 'stability_Lk_mm']),
    accessories: [],
    quote: {
      rows, total: any ? total : null, total_usd: any ? Math.round(total / USD_RATE) : null,
      currency: 'USD', rate: USD_RATE, rate_date: RATE_DATE,
      missing: rows.filter((r) => num(r.unit_price) == null).map((r) => r.desc),
    },
    warnings: ((out.warnings) || []).map(T), layout_image: P.layoutImageFor(cal) || null,
  };
}

function renderRod(ctx, sets) {
  const P = ctx.SJRodProduct, data = ctx.SJ_ROD_DATA;
  const inp = applySets(P.defaultInput(), sets);
  const out = P.autoSelect(inp, data);
  const res = out.chosenResult, cal = out.cal;
  if (!out.chosen) return failResult('rod', out);
  const pr = P.rodPriceOf(cal, res);
  const rows = (pr.parts || []).map((p0) => ({ desc: T(p0.label), spec: '', qty: 1, unit_price: num(p0.amount) }));
  (pr.pend || []).forEach((t) => rows.push({ desc: 'Manual quotation required: ' + T(t), spec: '', qty: 1, unit_price: null }));
  if (res.motor && res.motor.power_kW != null) {
    rows.push({
      desc: 'Drive motor (recommended configuration)',
      spec: (res.motor.code || '') + ' | power ' + res.motor.power_kW + ' kW'
        + (res.motor.rpm ? ' | ' + res.motor.rpm + ' rpm' : ''),
      qty: 1, unit_price: null,
    });
  }
  let total = 0, any = false;
  rows.forEach((r) => { if (num(r.unit_price) != null) { any = true; total += r.unit_price * (r.qty || 0); } });
  return {
    product: 'rod', product_label: PRODUCT_LABEL.rod, input: inp,
    model: out.chosen.model, full_code: T(P.suggestCode(cal, res) || out.chosen.model),
    spec: '', checks: checksList(res),
    calc: calcSummary(res, ['motor_power_kW', 'motor_torque_Nm', 'rated_kN', 'speed_mm_s', 'life_km', 'stability_Lk_mm']),
    accessories: [],
    quote: {
      rows, total: any ? total : null, total_usd: any ? Math.round(total / USD_RATE) : null,
      currency: 'USD', rate: USD_RATE, rate_date: RATE_DATE,
      missing: rows.filter((r) => num(r.unit_price) == null).map((r) => r.desc),
    },
    warnings: ((out.warnings) || []).map(T), layout_image: P.layoutImageFor(cal) || null,
  };
}

const RENDER = { screwjack: renderScrewjack, cylinder: renderCylinder, rod: renderRod };


/* Echo of the resolved input in English (the raw `input` block keeps the engine's
   canonical values so that results stay reproducible run to run). */
function decorate(R0) {
  const ie = {};
  Object.keys(R0.input || {}).forEach((k) => {
    const v = R0.input[k];
    ie[k] = Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? T(x) : x))
      : (typeof v === 'string' ? T(v) : v);
  });
  R0.input_en = ie;
  return R0;
}

/* Paths that are intentionally left in their engine form. */
function lintable(R0) {
  return residue(R0).filter(([k]) => k.indexOf('.input') !== 0 && k !== '.layout_image');
}

/* ---------- 5. output ---------- */
function money(v) {
  if (typeof v !== 'number' || !isFinite(v)) return '-';
  return 'USD ' + Math.round(v / USD_RATE).toLocaleString('en-US');
}

/* The JSON artefact is customer-facing: every price is USD and no FX rate is disclosed.
   Internally the quote is held in list-price units so money() and the table stay consistent. */
function usdView(R0) {
  const q = R0.quote || { rows: [], total: null, missing: [] };
  const rows = (q.rows || []).map((r) => {
    const u = num(r.unit_price);
    const qty = r.qty || 0;
    return {
      desc: r.desc,
      spec: r.spec,
      qty: r.qty,
      unit_price: u == null ? null : Math.round(u / USD_RATE),
      amount: u == null ? null : Math.round(u * qty / USD_RATE),
    };
  });
  const priced = rows.filter((r) => r.amount != null);
  const out = Object.assign({}, R0, {
    quote: {
      currency: 'USD',
      rows,
      /* total is summed from the rounded row amounts so a customer can add the lines up */
      total: priced.length && q.total != null ? priced.reduce((a, r) => a + r.amount, 0) : null,
      missing: q.missing || [],
    },
  });
  delete out.usd_rate;
  delete out.usd_rate_date;
  return out;
}

function markdown(R0) {
  const L = [];
  L.push('## Lim-Tec selection - ' + R0.product_label);
  if (!R0.model) {
    L.push('');
    L.push('**No model could be matched.**' + (R0.error ? ' Reason: ' + R0.error : ''));
    if (R0.best) L.push('Closest candidate: ' + R0.best + ' (unmet: ' + (R0.unresolved || []).join('; ') + ')');
    L.push('');
    L.push('Widen the duty point or add the missing parameters and run again; field names are listed with `--list-fields`.');
    return L.join('\n');
  }
  L.push('');
  L.push('**Selected model: ' + R0.model + '**' + (R0.full_code ? ('   Order code: `' + R0.full_code + '`') : ''));
  if (R0.spec) { L.push(''); L.push('Specification: ' + String(R0.spec)); }
  if (R0.checks.length) {
    L.push('');
    L.push('Checks: ' + R0.checks.map((c) => c.name + (c.ok ? ' OK' : (c.val === false ? ' FAIL' : ' ?'))).join(' | '));
  }
  if (R0.calc.length) {
    L.push('');
    L.push('Calculated: ' + R0.calc.map(([k, v]) => k + '=' + v).join(', '));
  }
  L.push('');
  L.push('### Bill of materials (public reference prices)');
  L.push('');
  L.push('| # | Item | Qty | Unit price | Amount |');
  L.push('|---|---|---|---|---|');
  R0.quote.rows.forEach((r, i) => {
    const u = num(r.unit_price);
    L.push('| ' + (i + 1) + ' | ' + String(r.desc).replace(/\|/g, '/') + (r.spec ? '<br>' + String(r.spec).replace(/\|/g, '/').slice(0, 180) + (String(r.spec).length > 180 ? ' ...' : '') : '')
      + ' | ' + r.qty + ' | ' + (u != null ? money(u) : 'on request')
      + ' | ' + (u != null ? money(u * (r.qty || 0)) : '-') + ' |');
  });
  L.push('| | **Total** | | | **' + (R0.quote.total != null ? money(R0.quote.total) : 'on request') + '** |');
  if (R0.quote.missing.length) { L.push(''); L.push('Priced on request: ' + R0.quote.missing.join('; ')); }
  if (R0.layout_image) { L.push(''); L.push('Layout drawing: ' + R0.layout_image); }
  if (R0.warnings && R0.warnings.length) {
    L.push('');
    L.push('### Notes');
    const shown = R0.warnings.slice(0, 3);
    shown.forEach((w) => L.push('- ' + w));
    if (R0.warnings.length > shown.length) {
      L.push('- (' + (R0.warnings.length - shown.length) + ' more notes in the JSON output - same message, other candidate duty points)');
    }
  }
  L.push('');
  L.push('> ' + PRICE_NOTE);
  L.push('> 3D models and the online version: ' + WEB_LINK);
  return L.join('\n');
}

/* ---------- 6. demo ---------- */
const DEMOS = [
  { p: 'screwjack', sets: ['units=4', 'load=8', 'load_unit=kN', 'stroke_mm=700', 'speed_mm_s=6.25',
     'layout=h', 'motion=S', 'guide=yes', 'env=indoor', 'sync=mechanical', 'drive=servo220', 'series=auto'], expect: 'SJA5' },
  { p: 'cylinder', sets: ['series=DMB', 'load=1', 'load_unit=t', 'stroke_mm=400', 'speed_mm_s=200',
     'input_form=P10/P20', 'install=FF', 'joint=FM', 'servo_brand=V90', 'drive=servo380', 'accessories=AR'], expect: 'DMB35' },
  { p: 'rod', sets: ['series=LAP', 'load=10', 'load_unit=kN', 'speed=50', 'stroke=600', 'drive=ac3'], expect: 'LAP56' },
];

/* ---------- 7. main ---------- */
function main() {
  const ctx = loadScope();
  if (hasFlag('list-fields')) {
    const p = (argVal('product') || 'screwjack');
    const P0 = { screwjack: ctx.SJScrewJackProduct, cylinder: ctx.SJCylinderProduct, rod: ctx.SJRodProduct }[p];
    console.log(JSON.stringify(P0.defaultInput(), null, 1));
    return 0;
  }
  if (DEMO) {
    let pass = 0;
    const results = [];
    for (const d of DEMOS) {
      let R0;
      try { R0 = RENDER[d.p](ctx, d.sets); }
      catch (e) { R0 = failResult(d.p, null, e); }
      const ok = R0.model && String(R0.model).indexOf(d.expect) === 0;
      const total = R0.quote && R0.quote.total != null ? money(R0.quote.total) : 'on request';
      decorate(R0);
      results.push(R0);
      console.log((ok ? '  PASS ' : '  FAIL ') + d.p + ' -> ' + (R0.model || ('failed: ' + (R0.error || 'no match')))
        + (R0.model ? ('   total ' + total) : ''));
      if (R0.model) {
        const left = lintable(R0);
        if (left.length) {
          console.log('         untranslated: ' + left.map(([k, v]) => k + ' = ' + String(v).slice(0, 80)).join(' ; '));
        }
      }
      if (ok) pass++;
    }
    console.log('demo: ' + pass + '/3 passed');
    if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(results.map(usdView), null, 1));
    return pass === DEMOS.length ? 0 : 1;
  }
  if (!PRODUCT || !RENDER[PRODUCT]) {
    console.error('usage: node scripts/select.js --product=screwjack|cylinder|rod [--set key=value ...] [--json file]');
    console.error('       node scripts/select.js --demo');
    console.error('       node scripts/select.js --list-fields --product=rod');
    return 2;
  }
  const sets = [];
  for (const a of argv) {
    if (a.indexOf('--set=') === 0) sets.push(a.slice('--set='.length));
    else if (a.indexOf('--set ') === 0) sets.push(a.slice('--set '.length));
  }
  for (let i = 0; i < argv.length; i++) if (argv[i] === '--set') sets.push(argv[i + 1]);
  const R0 = decorate(RENDER[PRODUCT](ctx, sets));
  R0.generated_at = new Date().toISOString().slice(0, 10);
  R0.link = WEB_LINK;
  R0.price_note = PRICE_NOTE;
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(usdView(R0), null, 1));
  if (LINT) {
    const left = lintable(R0);
    console.log(left.length ? JSON.stringify(left, null, 1) : 'no untranslated fragments');
  }
  if (!QUIET) console.log(markdown(R0));
  return 0;
}
try { process.exit(main()); } catch (e) { console.error('selection failed: ' + (e && e.message)); process.exit(1); }
