#!/usr/bin/env node
/**
 * MCP (Model Context Protocol) server — stdio transport, zero dependencies.
 *
 * For hosts that can talk to MCP but cannot run skill scripts (Claude Desktop,
 * ChatGPT desktop connectors, Cursor's MCP panel, custom agents).
 *
 * Tools:
 *   select_servo   — size a Siemens servo motor + drive + cables, full BOM
 *   lookup_price   — USD reference price for one or more order numbers
 *
 * It shells out to scripts/select.js so there is exactly one implementation of the
 * selection rules. Nothing is duplicated here.
 *
 * Register (Claude Desktop / Claude Code / Cursor):
 *   { "mcpServers": { "siemens-servo-selector":
 *       { "command": "node", "args": ["/abs/path/mcp/server.js"] } } }
 */
'use strict';
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const ROOT = path.join(__dirname, '..');
const SELECT = path.join(ROOT, 'scripts', 'select.js');
const REF = path.join(ROOT, 'references');
const VERSION = '1.0.3';

const TOOLS = [
  {
    name: 'select_servo',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    description:
      'Select a Siemens servo motor with its SINAMICS drive and cables for a given duty point, ' +
      'and return a ready-to-order bill of materials with complete order numbers, USD reference ' +
      'prices and a digit-by-digit explanation of the order numbers. Covers V90/1FL6, S200/1FL2, ' +
      'S200 Compact/1FL1, S210/1FK2 and S120/1FK7/1FT7/1PH8.',
    inputSchema: {
      type: 'object',
      properties: {
        kw: { type: 'string', description: 'rated power in kW, or a range like "1-2"' },
        torque: { type: 'string', description: 'rated torque N·m, or a range like "8-12"' },
        rpm: { type: 'string', description: 'rated speed rpm, or a range like "2000-3000"' },
        maxrpm: { type: 'string', description: 'required maximum speed rpm' },
        brake: { type: 'string', enum: ['yes', 'no', 'any'], description: 'holding brake' },
        enc: {
          type: 'string',
          enum: ['any', 'rel', 'mt_abs', 'bat_abs', 'resolver'],
          description: 'encoder type: rel = incremental, mt_abs = multi-turn absolute, bat_abs = battery absolute'
        },
        shaft: { type: 'string', enum: ['any', 'key', 'plain'], description: 'shaft end' },
        volt: { type: 'string', enum: ['any', '220', '380'], description: 'supply voltage' },
        sys: {
          type: 'string',
          enum: ['auto', 'V90', 'S200', 'S200CC', 'S200C', 'S200B', 'S210', 'S120'],
          description: 'drive system; S200CC = S200 Compact (1FL1)'
        },
        ctrl: { type: 'string', enum: ['pn', 'pulse'], description: 'control interface' },
        len: { type: 'string', description: 'cable length in metres (default 10, max 50 for OCC)' },
        axes: { type: 'string', enum: ['single', 'multi'], description: 'multi-axis only produces S120' },
        top: { type: 'number', description: 'number of candidates to return (1-10, default 3)' }
      }
    }
  },
  {
    name: 'lookup_price',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    description:
      'Look up the USD reference price and historical lead time for one or more Siemens order ' +
      'numbers. Returns "quote on request" when the number is not in the database — it never ' +
      'estimates a price from a different model.',
    inputSchema: {
      type: 'object',
      properties: {
        order_numbers: {
          type: 'array',
          items: { type: 'string' },
          description: 'order numbers (MLFB), e.g. ["1FK2206-4AF10-1MA0", "6SL5310-1BE13-5DF1"]'
        }
      },
      required: ['order_numbers']
    }
  }
];

let PRICES = null;
function prices() {
  if (!PRICES) PRICES = JSON.parse(fs.readFileSync(path.join(REF, 'price_book_usd.json'), 'utf8'));
  return PRICES;
}
const META = JSON.parse(fs.readFileSync(path.join(REF, 'price_book_usd.meta.json'), 'utf8'));

function normNo(s) { return String(s || '').toUpperCase().replace(/[\s．·.:：]/g, ''); }

function baseNo(k) {
  const seg = String(k || '').toUpperCase().split('-');
  if (seg.length < 2) return seg[0];
  if (/^1F/.test(seg[0])) return seg[0];
  return seg.slice(0, seg.length - 1).join('-');
}

function priceOf(no) {
  const P = prices();
  const k = normNo(no);
  const idx = {};
  for (const kk of Object.keys(P)) idx[normNo(kk)] = P[kk];
  if (idx[k] && idx[k].length) return { kind: 'exact', row: idx[k][0], no };
  const b = baseNo(k);
  if (!b || b === k) return { kind: 'none' };
  const lcp = (a, c) => { let i = 0; while (i < a.length && i < c.length && a[i] === c[i]) i++; return i; };
  const hits = Object.keys(idx).filter(kk => kk !== k && baseNo(kk) === b)
    .sort((a, c) => lcp(c, k) - lcp(a, k) || a.localeCompare(c));
  if (!hits.length) return { kind: 'none' };
  return { kind: 'ref', row: idx[hits[0]][0], no: hits[0] };
}

function runSelect(args) {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, [SELECT, ...args, '--json'], { timeout: 20000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(String(stderr || err.message).slice(0, 600)));
      try { resolve(JSON.parse(stdout)); } catch (e) { reject(new Error('bad JSON from select.js')); }
    });
  });
}

async function callTool(name, a) {
  if (name === 'select_servo') {
    const args = [];
    for (const k of ['kw', 'torque', 'rpm', 'maxrpm', 'brake', 'enc', 'shaft', 'volt', 'sys', 'ctrl', 'len', 'axes']) {
      if (a[k] != null && a[k] !== '') args.push(`--${k}=${a[k]}`);
    }
    args.push('--top=' + Math.max(1, Math.min(10, Number(a.top) || 3)));
    const res = await runSelect(args);
    return renderSelection(res);
  }
  if (name === 'lookup_price') {
    const list = Array.isArray(a.order_numbers) ? a.order_numbers : [];
    const lines = [
      'USD reference prices (indicative only — not an offer).',
      '',
      '| Order number | USD ref. | Price date | Lead time (historical) | Note |',
      '|---|---|---|---|---|'
    ];
    for (const no of list) {
      const p = priceOf(no);
      if (p.kind === 'none') {
        lines.push(`| ${no} | quote on request | — | — | no record for this model or its base number |`);
      } else if (p.kind === 'ref') {
        lines.push(`| ${no} | ${p.row.p.toLocaleString('en-US')} | ${p.row.date} | ${p.row.term || '—'} | reference only — record is for ${p.no}, a different option/length variant |`);
      } else {
        lines.push(`| ${no} | ${p.row.p.toLocaleString('en-US')} | ${p.row.date} | ${p.row.term || '—'} | — |`);
      }
    }
    return lines.join('\n');
  }
  throw new Error('unknown tool: ' + name);
}

function qText(q) {
  const r = x => (x.has ? (x.hi != null ? `${x.lo}-${x.hi}` : `${x.lo}+`) : null);
  const parts = [];
  if (q.sys && q.sys !== 'auto') parts.push('system ' + q.sys);
  if (r(q.pn)) parts.push('power ' + r(q.pn) + ' kW');
  if (r(q.tq)) parts.push('torque ' + r(q.tq) + ' N·m');
  if (r(q.nn)) parts.push('speed ' + r(q.nn) + ' rpm');
  if (r(q.nx)) parts.push('max speed ' + r(q.nx) + ' rpm');
  if (q.brake !== 'any') parts.push('brake ' + q.brake);
  if (q.enc !== 'any') parts.push('encoder ' + q.enc);
  if (q.shaft !== 'any') parts.push('shaft ' + q.shaft);
  if (q.volt !== 'any') parts.push(q.volt + ' V');
  if (q.axes === 'multi') parts.push('multi-axis');
  parts.push('cable ' + q.clen + ' m');
  return parts.join(' · ');
}

function renderSelection(res) {
  if (!res.candidates || !res.candidates.length) {
    return 'No motor satisfies the hard constraints. Relax the drive system / voltage / encoder / brake requirement.';
  }
  const out = [];
  out.push(`Query: ${qText(res.query)}`);
  out.push(`Candidates found: ${res.count} · currency USD`
    + ((res.fx && res.fx.rate_cny_per_usd) ? ` · fx 1 USD = ${res.fx.rate_cny_per_usd} CNY (${res.fx.date})` : ''));
  if (res.big) out.push(`> Demand ≈ ${res.demand_kw} kW — above 7 kW, so S200/V90/S210 cannot cover it.`);
  res.candidates.forEach((b, i) => {
    out.push('');
    out.push(`## ${i + 1}. ${b.base} (${b.system}) — rated ${b.mn} N·m / ${b.nn} rpm / ${b.pn} kW`);
    out.push('');
    out.push('| # | Item | Order number | Qty | USD ref. | Lead time |');
    out.push('|---|---|---|---|---|---|');
    b.items.forEach((it, k) => {
      const p = it.price == null
        ? (it.priceKind === 'ref' ? 'verify for this exact model' : 'quote on request')
        : '$' + Math.round(it.price).toLocaleString('en-US') + (it.priceKind === 'ref' ? ' (similar base)' : '');
      out.push(`| ${k + 1} | ${it.name} | \`${it.no}\` | ${it.qty}${it.unit ? ' ' + it.unit : ''} | ${p} | ${it.term || '—'} |`);
    });
    out.push('');
    out.push(`**Reference total: ${b.total > 0 ? '$' + Math.round(b.total).toLocaleString('en-US') : 'quote on request'}**`
      + (b.unknownPrice ? ` (plus ${b.unknownPrice} item(s) on request)` : ''));
    if (b.orderExplain) {
      out.push('');
      out.push('**How the order number is built**');
      out.push('');
      out.push('`' + b.order + '`');
      out.push('');
      out.push(b.orderExplain);
    } else {
      out.push('');
      out.push(`**Order number:** \`${b.order}\` (options fixed for this motor)`);
    }
  });
  out.push('');
  out.push('Prices are USD reference values converted from CNY tax-inclusive reference prices — ' +
    'indicative only, not an offer. Lead times are historical delivery intervals, not commitments. ' +
    'Vertical/gravity loads, ambient above 40 °C, altitude above 1000 m, explosion protection and ' +
    'multi-axis layouts need a human review.');
  return out.join('\n');
}

/* ---------------- JSON-RPC over stdio ---------------- */
function send(msg) { process.stdout.write(JSON.stringify(msg) + '\n'); }

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', async line => {
  line = line.trim();
  if (!line) return;
  let req;
  try { req = JSON.parse(line); } catch (e) { return; }
  const { id, method, params } = req;

  try {
    if (method === 'initialize') {
      send({
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: (params && params.protocolVersion) || '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'siemens-servo-selector', version: VERSION }
        }
      });
      return;
    }
    if (method === 'notifications/initialized' || method === 'initialized') return;
    if (method === 'tools/list') { send({ jsonrpc: '2.0', id, result: { tools: TOOLS } }); return; }
    if (method === 'tools/call') {
      const name = params && params.name;
      const args = (params && params.arguments) || {};
      const text = await callTool(name, args);
      send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }] } });
      return;
    }
    if (method === 'ping') { send({ jsonrpc: '2.0', id, result: {} }); return; }
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'method not found: ' + method } });
  } catch (e) {
    send({ jsonrpc: '2.0', id, error: { code: -32000, message: String(e.message || e) } });
  }
});
