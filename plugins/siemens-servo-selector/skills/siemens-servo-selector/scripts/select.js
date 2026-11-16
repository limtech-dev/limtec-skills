#!/usr/bin/env node
/**
 * Siemens servo motor & drive selector — English CLI.
 *
 * The selection engine (`engine.js`) is byte-identical to the Chinese production
 * package, so the motors, drives, cable codes and order numbers returned here are
 * exactly the same. This file only changes the language of the report and the
 * currency (USD reference, converted from CNY at a fixed published rate).
 *
 * Usage:
 *   node select.js --kw=1.5 --rpm=3000 --brake=yes
 *   node select.js --torque=8-12 --rpm=2000-3000 --sys=S210 --enc=mt_abs --len=50
 *   node select.js --kw=15 --rpm=2000 --json
 *   node select.js --sys=S200CC --kw=0.4 --volt=220
 *
 * Options (all optional; omitted = unrestricted):
 *   --kw=1.5 | --kw=1-2         rated power kW (range with -)
 *   --torque=10 | --torque=8-12 rated torque N·m
 *   --rpm=3000 | --rpm=2000-3000 rated speed rpm
 *   --maxrpm=5000               required max speed rpm
 *   --brake=yes|no|any          holding brake (default any)
 *   --enc=any|rel|mt_abs|bat_abs|resolver   encoder type (default any)
 *   --shaft=any|key|plain       shaft end (default any)
 *   --volt=any|220|380          supply voltage (default any)
 *   --sys=auto|V90|S200|S200CC|S200C|S200B|S210|S120  drive system (S200CC = S200 Compact / 1FL1)
 *   --ctrl=pn|pulse             control interface (default pn)
 *   --len=10                    cable length m (default 10)
 *   --axes=single|multi         single / multi axis (multi = S120 only)
 *   --top=3                     number of candidates (default 3)
 *   --json                      machine-readable output
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HERE = __dirname;
const REF = path.join(HERE, '..', 'references');

/* ---------- 1. minimal DOM stubs (the browser engine touches document/window on load) ---------- */
function elStub(id) {
  return {
    id, value: '', innerHTML: '', textContent: '', checked: false, style: {}, dataset: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, removeEventListener() {}, appendChild() {}, removeChild() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    setAttribute() {}, getAttribute() { return null; }, focus() {}, click() {}, remove() {},
    insertAdjacentHTML() {}, scrollIntoView() {},
    getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; }
  };
}
const els = {};
global.document = {
  getElementById(id) { return els[id] || (els[id] = elStub(id)); },
  querySelector() { return null; }, querySelectorAll() { return []; },
  createElement(t) { return elStub(t); }, addEventListener() {},
  body: elStub('body'), head: elStub('head'), documentElement: elStub('html'), readyState: 'complete'
};
global.window = global;
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.dispatchEvent = () => {};
function defG(name, value) { try { Object.defineProperty(global, name, { value, configurable: true, writable: true }); } catch (e) { try { global[name] = value; } catch (e2) {} } }
defG('navigator', { userAgent: 'node', clipboard: { writeText() { return Promise.resolve(); } } });
global.location = { href: 'file:///', search: '', hash: '' };
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
global.sessionStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
global.alert = () => {};
global.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
global.XMLHttpRequest = function () {};
global.fetch = () => Promise.reject(new Error('offline'));

/* ---------- 2. data + engine ---------- */
global.DATA = JSON.parse(fs.readFileSync(path.join(REF, 'servo_db.json'), 'utf8'));
global.PRICES = JSON.parse(fs.readFileSync(path.join(REF, 'price_book_usd.json'), 'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(HERE, 'engine.js'), 'utf8'), { filename: 'engine.js' });

const { selBomItemsEn } = require('./bom_en.js');
const { orderExplainEn } = require('./order_en.js');
const T = require('./en_terms.js');

const RATE_META = JSON.parse(fs.readFileSync(path.join(REF, 'price_book_usd.meta.json'), 'utf8'));

/* ---------- 3. args ---------- */
function parseArgs(argv) {
  const a = {};
  for (const s of argv.slice(2)) {
    if (s === '--json') { a.json = true; continue; }
    if (s === '--help' || s === '-h') { a.help = true; continue; }
    const m = s.match(/^--([a-zA-Z]+)=(.*)$/);
    if (m) a[m[1]] = m[2];
  }
  return a;
}
function range(v) {
  if (v == null || v === '') return { lo: null, hi: null, mid: null, has: false };
  const p = String(v).split('-').map(x => parseFloat(x));
  const lo = isNaN(p[0]) ? null : p[0];
  const hi = p.length > 1 ? (isNaN(p[1]) ? null : p[1]) : null;
  return { lo, hi, mid: (lo != null && hi != null) ? (lo + hi) / 2 : null, has: lo != null || hi != null };
}
function buildQuery(a) {
  return {
    sys: a.sys || 'auto',
    pn: range(a.kw),
    tq: range(a.torque),
    nn: range(a.rpm),
    nx: range(a.maxrpm),
    brake: a.brake || 'any',
    enc: a.enc || 'any',
    shaft: a.shaft || 'any',
    env: a.env || 'any',
    volt: a.volt || 'any',
    ctrl: a.ctrl || 'pn',
    clen: String(a.len || 10),
    axes: a.axes || 'single'
  };
}

/* ---------- 4. candidates (identical rule set to the production tool) ---------- */
function candidates(q) {
  const em = [];
  const dkw = demandKW(q);
  const big = (dkw != null) && (dkw > PN_SWITCH);
  let list = DATA.motors.filter(m => {
    if (!sysOK(m, q)) return false;
    if (q.brake === 'yes' && !(m.brake && m.brake.avail)) return false;
    if (q.volt !== 'any' && !(m.voltage || []).includes(q.volt)) return false;
    if (!shaftMatch(m, q.shaft)) return false;
    if (q.ctrl === 'pulse' && m.system === 'S120' && q.axes === 'single') return false;
    if (q.ctrl === 'pulse' && m.system === 'S210') return false;
    if (q.pn.has && !inRange(m.pn, q.pn)) return false;
    const e = encMatch(m, q.enc); m._enc = e;
    if (!e.ok) return false;
    if (e.note && em.indexOf(e.note) < 0) em.push(e.note);
    return true;
  });
  list.forEach(m => {
    m._s = score(m, q);
    if (q.brake === 'no' && m.brake && m.brake.avail) m._s += 0.15;
    m._pur = prioRank(m);
    m._fit = (inRange(m.mn, q.tq) && inRange(m.nn, q.nn)) ? 0 : 1;
    m._sr = (!m._fit || big) ? seriesRank(m, big) : 0;
    m._quota = 0;
  });
  list.sort(candSort);
  const seen = {}, dedup = [];
  list.forEach(m => {
    const k = m.system + '|' + (m.base || m.model);
    if (seen[k]) return;
    seen[k] = m; dedup.push(m);
  });
  return { list: dedup, notes: em, big, dkw };
}

/* ---------- 5. one candidate → full BOM ---------- */
const stripTags = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function priceOfCode(no) {
  let pc;
  try { pc = priceCell(no); } catch (e) { return { usd: null, kind: 'none' }; }
  if (!pc || pc.price == null) return { usd: null, kind: pc && pc.cls === 'ref' ? 'ref' : 'none' };
  return {
    usd: pc.price, usd2: pc.p2, date: pc.date, term: pc.term,
    kind: pc.cls === 'ref' ? 'ref' : 'exact', refNo: pc.refNo || null
  };
}

function buildBom(m, q) {
  const items = [];
  const oe = orderExplainEn(m, q);
  for (const it of selBomItemsEn(m, q)) {
    const p = priceOfCode(it.no);
    items.push({
      name: it.name, spec: it.spec || '', no: it.no, qty: it.qty || 1, unit: it.unit || '',
      price: p.usd, priceKind: p.kind, price2: p.usd2 || null,
      refNo: p.refNo || null, term: p.term || '', date: p.date || ''
    });
  }
  return {
    model: m.model, base: m.base || m.model, system: m.system, family: m.family || '',
    pn: m.pn, mn: m.mn, m0: m.m0, mmax: m.mmax, nn: m.nn, nmax: nmaxEff(m), nmax_inv: m.nmax_inv,
    inertia: m.inertia, voltage: m.voltage, sh: m.sh, ip: m.ip, mass: m.mass,
    encoders: m.encoders, brake: m.brake, shaft: m.shaft,
    overload: (function () { try { return overloadOf(m); } catch (e) { return null; } })(),
    purchased: (function () { try { return !!purchInfo(m); } catch (e) { return false; } })(),
    order: oe.full, orderExplain: oe.explain, orderVerified: oe.verified,
    items,
    total: items.reduce((s, i) => s + (i.price != null ? i.price * i.qty : 0), 0),
    unknownPrice: items.filter(i => i.price == null).length
  };
}

/* ---------- 6. English output ---------- */
function usd(v) {
  if (v == null) return 'on request';
  return '$' + Math.round(v).toLocaleString('en-US');
}

/* "1 weeks" reads badly; "in stock" / "10-15 days" pass through untouched. */
function lt(s) {
  const t = String(s || '').trim();
  if (!t) return '—';
  const m = t.match(/^(\d+)\s+weeks?$/);
  if (m) return m[1] === '1' ? '1 week' : m[1] + ' weeks';
  return t;
}

const NOTE_EN = [
  ['1FL2 为机械绝对值', '1FL2 uses a mechanical absolute encoder (battery-free) — fine for absolute positioning; choose S200C if a true battery-backed encoder is mandatory.'],
  ['1FL6 提供', '1FL6 offers a 20-bit + 12-bit multi-turn absolute encoder (mechanical, battery-free).'],
  ['1FK2 的 AM22DQC', 'The 1FK2 AM22DQC is a mechanical multi-turn absolute encoder (22-bit + 12-bit, battery-free).'],
  ['该系列样本内无旋变', 'No resolver option in this series — a 24-bit absolute encoder is recommended instead (better accuracy and reliability).'],
  ['该系列以绝对值编码器为主', 'This series is absolute-encoder only; pick the incremental variant through the order suffix if needed.'],
  ['该系列提供单圈绝对值', 'This series offers single-turn absolute; multi-turn is available on adjacent ratings or via suffix M / L.'],
  ['编码器不完全匹配', 'Encoder does not match exactly — please verify.']
];
function noteEn(s) {
  for (const [k, v] of NOTE_EN) if (String(s).indexOf(k) >= 0) return v;
  return /[^\x00-\x7F]/.test(String(s)) ? 'Encoder note: not every series in the result offers the requested encoder — each row shows the encoder actually fitted; confirm before ordering.' : String(s);
}

function toMarkdown(res) {
  const out = [];
  const { list, notes, big, dkw } = res;
  if (!list.length) {
    out.push('No motor satisfies the hard constraints. Relax the drive system / voltage / encoder / brake requirement.');
    return out.join('\n');
  }
  if (big && dkw != null) out.push(`> Required power ≈ ${Math.round(dkw * 100) / 100} kW — above 7 kW, so S200 / V90 / S210 cannot cover it. Ordered 1FK7 / 1FT7 → 1PH8.\n`);
  res.boms.forEach((b, i) => {
    out.push(`### Recommendation ${i + 1} — ${b.base} (${b.system})`);
    out.push('');
    out.push(`Rated ${b.mn} N·m / ${b.nn} rpm / ${b.pn} kW · peak ${b.mmax} N·m · max speed ${b.nmax} rpm`
      + (b.inertia ? ` · rotor inertia ${T.inertia(b.inertia)}` : '')
      + ` · SH ${b.sh} · ${b.ip ? T.ip(b.ip) : ''} · ${b.voltage ? b.voltage.join('/') + ' V' : ''}`
      + ` · ${b.brake && b.brake.avail ? 'holding brake available' : 'no brake option'}`
      + (b.overload ? ` · overload ${b.overload} × MN` : '')
      + (b.purchased ? ' · price backed by a recorded transaction' : ''));
    out.push('');
    out.push('| # | Item | Order number | Qty | Unit price (USD ref.) | Lead time |');
    out.push('|---|---|---|---|---|---|');
    b.items.forEach((it, k) => {
      const p = it.price == null
        ? (it.priceKind === 'ref' ? 'verify for this exact model' : 'quote on request')
        : usd(it.price) + (it.priceKind === 'ref' ? ' (similar base)' : '');
      out.push(`| ${k + 1} | ${it.name}${it.spec ? ' — ' + it.spec : ''} | \`${it.no}\` | ${it.qty}${it.unit ? ' ' + it.unit : ''} | ${p} | ${lt(it.term)} |`);
    });
    out.push('');
    const tot = b.total > 0
      ? `**Reference total: ${usd(b.total)}**${b.unknownPrice ? ` (plus ${b.unknownPrice} item(s) on request, not included)` : ''}`
      : '**Total: every line has to be quoted by Siemens or a distributor**';
    out.push(tot);
    out.push('');
    if (b.orderExplain) {
      out.push('**How the order number is built**');
      out.push('');
      out.push('`' + b.order + '`');
      out.push('');
      out.push(b.orderExplain);
      out.push('');
    } else {
      out.push(`**Order number:** \`${b.order}\` (option bits fixed for this motor — order as-is after confirming the options)`);
      out.push('');
    }
  });
  if (notes.length) out.push('> Encoder notes: ' + notes.map(noteEn).join(' '));
  return out.join('\n');
}

function main() {
  const a = parseArgs(process.argv);
  if (a.help) {
    console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^\/\*\*?/, ''));
    return;
  }
  const q = buildQuery(a);
  const res = candidates(q);
  if (!res.list.length) {
    console.log(a.json
      ? JSON.stringify({ query: q, candidates: [], notes: ['no motor satisfies the hard constraints'] }, null, 2)
      : 'No motor satisfies the hard constraints. Relax the drive system / voltage / encoder / brake requirement.');
    return;
  }
  const top = Math.max(1, Math.min(10, parseInt(a.top || '3', 10)));
  res.boms = res.list.slice(0, top).map(m => buildBom(m, q));
  if (a.json) {
    console.log(JSON.stringify({
      query: q, big: res.big, demand_kw: res.dkw, notes: res.notes.map(noteEn),
      count: res.list.length,
      currency: 'USD', fx: { rate_cny_per_usd: RATE_META.rate_cny_per_usd, date: RATE_META.rate_date },
      candidates: res.boms
    }, null, 2));
  } else {
    console.log(toMarkdown(res));
  }
}

main();
