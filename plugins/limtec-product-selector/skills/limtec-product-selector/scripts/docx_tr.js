#!/usr/bin/env node
/*







*/
'use strict';
const fs = require('fs');
const { HAS_CJK } = require('./en_terms');
const { tr: docxTr } = require('./docx_terms');
const { USD_RATE } = require('./rate');

/*
*/
function dropChineseHalf(s) {
  const m = /^[\s\u3000\u4e00-\u9fff()、，。：:·\-]+([0-9]{0,2}[\s\u3000]*[A-Za-z][A-Za-z0-9 &/.,()'’\-]*)$/.exec(s);
  if (m) return m[1].replace(/\u3000/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}

/* The proposal is quoted in USD in this edition. Only amounts the engine prints
   with a currency mark are converted - "CNY 30 million" of registered capital
   must stay CNY, otherwise the company profile tells a different story. */
function currency(s) {
  return s
    .replace(/\(RMB\)/g, '(USD)')
    .replace(/（元）/g, '(USD)')
    .replace(/[¥￥]\s?([\d,]+(?:\.\d+)?)/g, (_m, n) => {
      const v = Number(String(n).replace(/,/g, ''));
      return isFinite(v) ? '$' + Math.round(v / USD_RATE).toLocaleString('en-US') : _m;
    });
}

/*
*/
const PRE = new Map([
  ['单价 (RMB)', 'Unit price (USD)'],
  ['总价 (RMB)', 'Amount (USD)'],
  ['单价 (USD)', 'Unit price (USD)'],
  ['总价 (USD)', 'Amount (USD)'],
]);

/* Western punctuation and single spacing, applied to every cell. */
function punct(s) {
  return String(s)
    .replace(/（/g, '(').replace(/）/g, ')')
    .replace(/，/g, ', ').replace(/；/g, '; ')
    .replace(/：/g, ': ').replace(/、/g, ', ')
    .replace(/。/g, '. ').replace(/　/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,;:.])/g, '$1')
    .replace(/^\s+|\s+$/g, '');
}

function tr(s) {
  if (typeof s !== 'string' || !s.trim()) return s;
  const key = s.replace(/\u3000/g, ' ').trim();
  if (PRE.has(key)) return PRE.get(key);
  let out = dropChineseHalf(s);
  if (HAS_CJK.test(out)) out = docxTr(out);
  return punct(currency(out));
}

const inPath = process.argv[2];
const outPath = process.argv[3];
const arr = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const res = arr.map(tr);
fs.writeFileSync(outPath, JSON.stringify(res, null, 0), 'utf8');
const left = res.filter((s) => HAS_CJK.test(s));
if (left.length) {
  console.error('仍有中文残留 ' + left.length + ' 处：');
  left.slice(0, 40).forEach((s) => console.error('  ' + s));
  process.exit(3);
}
process.exit(0);
