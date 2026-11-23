#!/usr/bin/env node
/* Lim-Tec Selector — residue linter over a duty-point matrix.
 *
 * `select.js --lint` only inspects one built-in case per product line, which is
 * how the EHB / KV description strings and the no-match error branches kept
 * their Chinese fragments for so long: those paths are never executed by the demo.
 *
 * This script runs every series of every product line plus the failure branches
 * and fails if any output still contains a CJK character or a RMB symbol.
 *
 * Usage: node scripts/lint_matrix.js [--verbose]
 */
'use strict';
const path = require('path');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const SELECT = path.join(HERE, 'select.js');
const VERBOSE = process.argv.indexOf('--verbose') >= 0;
const CJK = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/;
/* ¥ and ￥ mean the price never went through the USD converter. */
const MONEY = /[¥￥]/;

const CASES = [
  /* screw jacks: six series x two duty points (light / heavy, short / long stroke) */
  ...[['SJA', 2, 500, 10], ['SJA', 20, 1200, 4],
    ['SJB', 2, 500, 10], ['SJB', 20, 1200, 4],
    ['KV', 2, 500, 10], ['KV', 10, 800, 5],
    ['EHB', 2, 500, 10], ['EHB', 15, 900, 4],
    ['SCA', 2, 500, 10], ['SCA', 20, 1000, 5],
    ['SCB', 2, 500, 10], ['SCB', 20, 1000, 5]]
    .map(([s, load, stroke, speed]) => ({
      name: 'screwjack ' + s + ' ' + load + 't/' + stroke + 'mm',
      args: ['--product=screwjack', '--set=series=' + s, '--set=load=' + load,
        '--set=load_unit=t', '--set=stroke_mm=' + stroke, '--set=speed_mm_s=' + speed],
    })),

  /* electric cylinders: four series */
  ...[['DMB', '0.5', 400, 200], ['DMB', '3', 800, 100],
    ['EMB', '0.5', 400, 200], ['EMB', '3', 800, 100],
    ['GTR', '0.2', 300, 150],
    ['FMR', '0.3', 400, 200], ['FMR', '2', 600, 100]]
    .map(([s, load, stroke, speed]) => ({
      name: 'cylinder ' + s + ' ' + load + 't/' + stroke + 'mm',
      args: ['--product=cylinder', '--set=series=' + s, '--set=load=' + load,
        '--set=load_unit=t', '--set=stroke_mm=' + stroke, '--set=speed_mm_s=' + speed],
    })),

  /* linear actuators: field names differ (speed / stroke, load unit t) */
  ...[['LAP', 5, 400, 20], ['LAP', 20, 800, 10],
    ['LBP', 5, 400, 20], ['LBP', 20, 800, 10],
    ['LAM', 1, 300, 20], ['LAM', 2, 500, 10],
    ['LBM', 3, 400, 20], ['LBM', 5, 500, 10]]
    .map(([s, load, stroke, speed]) => ({
      name: 'rod ' + s + ' ' + load + 't/' + stroke + 'mm',
      args: ['--product=rod', '--set=series=' + s, '--set=load=' + load,
        '--set=load_unit=t', '--set=stroke=' + stroke, '--set=speed=' + speed],
    })),

  /* failure branches: an unknown series and an impossible duty point both come
     from the engine's error strings, which used to be translated by a rule that
     never matched */
  { name: 'error unknown series', args: ['--product=screwjack', '--set=series=SJA5'] },
  { name: 'error out of range', args: ['--product=cylinder', '--set=series=GTR',
    '--set=load=2', '--set=load_unit=t', '--set=stroke_mm=400', '--set=speed_mm_s=200'] },
  { name: 'error rod out of range', args: ['--product=rod', '--set=series=LAM',
    '--set=load=8', '--set=load_unit=t', '--set=stroke=400', '--set=speed=20'] },
  { name: 'error missing load', args: ['--product=screwjack'] },
];

/* The markdown block is what a user sees, but `--quiet` suppresses it entirely,
   so run without it and additionally dump the JSON: every string the engine
   produced is then scan-able, including notes that never reach the table. */
const os = require('os');
const fs = require('fs');
let seq = 0;

function run(args) {
  const jsonPath = path.join(os.tmpdir(), 'limtec-lint-' + process.pid + '-' + (seq++) + '.json');
  let out = '';
  try {
    out = execFileSync('node', [SELECT].concat(args, '--json=' + jsonPath),
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    /* a non-zero exit still prints a result block; keep it for the scan */
    out = (e.stdout || '') + (e.stderr || '');
  }
  let obj = null;
  try {
    if (fs.existsSync(jsonPath)) {
      obj = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      fs.unlinkSync(jsonPath);
    }
  } catch (e) { /* ignore */ }
  return { md: out, obj: obj };
}

let bad = 0;
let priced = 0;
let quoted = 0;
for (const c of CASES) {
  const res = run(c.args);
  const out = res.md;
  /* the JSON echoes the user's own input values ("series": "SJA"), which stay in
     the engine's vocabulary on purpose - only the produced strings are checked */
  const echo = JSON.stringify(Object.assign({}, res.obj, { input: null, input_en: null }));

  /* How much of the matrix is actually quotable: a model that gets selected must
     carry a total. Counted from the JSON so the markdown formatting cannot skew it. */
  const q = res.obj && res.obj.quote ? res.obj.quote : null;
  const total = q ? Number(q.total_usd) || 0 : 0;
  const onReq = (out.match(/on request/gi) || []).length;
  if (total > 0) priced += 1;
  else if (res.obj && res.obj.model) quoted += 1;   /* selected but nothing priced */
  if (VERBOSE) console.log('    total USD ' + total + ', on request lines ' + onReq);

  const cjkLines = out.split('\n').filter((l) => CJK.test(l));
  if (res.obj && CJK.test(echo)) cjkLines.push('JSON: ' + echo.slice(0, 160));
  const moneyLines = out.split('\n').filter((l) => MONEY.test(l));
  if (cjkLines.length || moneyLines.length) {
    bad += 1;
    console.log('  ✗ ' + c.name + (cjkLines.length ? '  [CJK x' + cjkLines.length + ']' : '')
      + (moneyLines.length ? '  [RMB x' + moneyLines.length + ']' : ''));
    cjkLines.concat(moneyLines).slice(0, 3)
      .forEach((l) => console.log('      ' + l.trim().slice(0, 150)));
  } else if (VERBOSE) {
    console.log('  ✓ ' + c.name);
  }
}

console.log('\n' + CASES.length + ' duty points: '
  + (bad ? '✗ ' + bad + ' with residue' : '✓ no CJK and no RMB symbol anywhere')
  + ' | priced ' + priced + ', quoted on request only ' + quoted);
process.exit(bad ? 1 : 0);
