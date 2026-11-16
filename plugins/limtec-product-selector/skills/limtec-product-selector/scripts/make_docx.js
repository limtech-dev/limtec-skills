#!/usr/bin/env node
/*










*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');

const HERE = __dirname;
const ROOT = path.join(HERE, '..');

/**/
const argv = process.argv.slice(2);
const hasFlag = (n) => argv.indexOf('--' + n) >= 0;
function argVal(name) {
  const i = argv.indexOf('--' + name);
  if (i >= 0) return argv[i + 1];
  const p = '--' + name + '=';
  const j = argv.findIndex((a) => a.indexOf(p) === 0);
  return j >= 0 ? argv[j].slice(p.length) : null;
}
function setsOf() {
  const sets = [];
  for (let i = 0; i < argv.length; i++) if (argv[i] === '--set') sets.push(argv[i + 1]);
  for (const a of argv) {
    if (a.indexOf('--set=') === 0) sets.push(a.slice('--set='.length));
  }
  return sets;
}
const ARRAY_KEYS = new Set(['servo_brand', 'accessories', 'special', 'special_texts', 'brands']);
function coerce(v) { try { return JSON.parse(v); } catch (e) { return v; } }

/**/
/*
*/
function readScript(rel) {
  const abs = path.join(ROOT, rel);
  if (fs.existsSync(abs)) return fs.readFileSync(abs, 'utf8');
  if (fs.existsSync(abs + '.gz')) return zlib.gunzipSync(fs.readFileSync(abs + '.gz')).toString('utf8');
  throw new Error('缺少引擎文件：' + rel);
}

function loadScope() {
  const ctx = { console, TextEncoder, TextDecoder, Buffer, Blob, URL };
  ctx.globalThis = ctx;
  ctx.window = ctx;
  /*
*/
  const DOCX_DIR = path.join(ROOT, 'docx');
  ctx.__dirname = DOCX_DIR;
  ctx.__filename = path.join(DOCX_DIR, 'media.js');
  ctx.require = function (m) {
    if (m === 'fs' || m === 'path') return require(m);
    throw new Error('require("' + m + '") 不在技能白名单内');
  };
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
    /**/
    'docx/zip.js', 'docx/templates.js', 'docx/media.js', 'docx/docx-builder.js',
  ];
  for (const f of files) {
    vm.runInContext(readScript(f), ctx, { filename: f });
  }
  return ctx;
}

const PRODUCT_KEY = {
  screwjack: ['SJScrewJackProduct', 'SJ_DATA'],
  cylinder: ['SJCylinderProduct', 'SJ_CYL_DATA'],
  rod: ['SJRodProduct', 'SJ_ROD_DATA'],
};

const DEMOS = {
  screwjack: ['units=4', 'load=8', 'load_unit=kN', 'stroke_mm=700', 'speed_mm_s=6.25',
    'layout=H型布置', 'motion=S', 'guide=有', 'env=室内', 'sync=机械', 'drive=servo220'],
  cylinder: ['series=DMB', 'load=1', 'load_unit=t', 'stroke_mm=400', 'speed_mm_s=200',
    'input_form=P10/P20', 'install=FF', 'joint=FM', 'servo_brand=V90', 'drive=servo380', 'accessories=AR'],
  rod: ['series=LAP', 'load=10', 'load_unit=kN', 'speed=50', 'stroke=600', 'drive=ac3'],
};

function main() {
  const product = argVal('product');
  const outDocx = argVal('docx') || '选型方案书.docx';
  const outPdf = argVal('pdf');
  const outJson = argVal('json');
  if (!product || !PRODUCT_KEY[product]) {
    console.error('用法：node scripts/make_docx.js --product=screwjack|cylinder|rod [--set 键=值 ...] --docx=方案书.docx [--pdf=方案书.pdf] [--demo]');
    return 2;
  }
  const ctx = loadScope();
  const [PName, DName] = PRODUCT_KEY[product];
  const P = ctx[PName], data = ctx[DName];
  const inp = P.defaultInput();
  const sets = hasFlag('demo') ? DEMOS[product] : setsOf();
  for (const raw of sets) {
    const i = raw.indexOf('=');
    if (i < 0) throw new Error('参数格式应为 --set 键=值：' + raw);
    const k = raw.slice(0, i).trim(), v = coerce(raw.slice(i + 1).trim());
    inp[k] = (ARRAY_KEYS.has(k) && !Array.isArray(v)) ? [v] : v;
  }
  const out = P.autoSelect(inp, data);
  if (!out.chosen) {
    console.error('未能选出型号：' + ((out.unresolved || []).join('、') || out.error || ''));
    return 1;
  }
  const res = out.chosenResult, cal = out.cal;
  const spec = P.composeSpec(res, cal, data, {});
  const today = new Date();
  const dstr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  spec.fields.DOC_DATE = spec.fields.DOC_DATE || dstr;
  spec.zipDate = spec.zipDate || dstr;

  const LANG = argVal('lang') || 'en';          /* this edition defaults to English */
  ctx.SJDocx.build(spec).then((r) => {
    fs.writeFileSync(outDocx, Buffer.from(r.bytes));
    console.log('DOCX written: ' + outDocx + '  ' + r.bytes.length + ' bytes  (model ' + out.chosen.model + ')');
    if (outJson) fs.writeFileSync(outJson, JSON.stringify({ model: out.chosen.model, template: spec.template, fields: spec.fields }, null, 1));
    const { spawnSync } = require('child_process');
    if (LANG === 'en') {
      const tr = spawnSync('python3', [path.join(HERE, 'docx_en.py'), outDocx, outDocx], { stdio: 'inherit' });
      if (tr.status !== 0 && tr.status !== 2) process.exit(tr.status || 1);
    }
    if (outPdf) {
      const env = Object.assign({}, process.env);
      if (LANG === 'en') {
        env.LIMTEC_WATERMARK = 'Lim-Tec';
        env.LIMTEC_COPYRIGHT = 'Copyright (c) Lim-Tec (Beijing) Transmission Equipment Co., Ltd. All rights reserved.';
        env.LIMTEC_PDF_TITLE = 'Lim-Tec Selection Proposal';
        env.LIMTEC_PDF_AUTHOR = 'Lim-Tec (Beijing) Transmission Equipment Co., Ltd.';
      }
      const py = spawnSync('python3', [path.join(HERE, 'report.py'), outDocx, outPdf], { stdio: 'inherit', env: env });
      process.exit(py.status === 0 ? 0 : 1);
    }
    process.exit(0);
  }).catch((e) => { console.error('docx 生成失败：' + (e && e.message)); process.exit(1); });
}
try { main(); } catch (e) { console.error('生成失败：' + (e && e.message)); process.exit(1); }
