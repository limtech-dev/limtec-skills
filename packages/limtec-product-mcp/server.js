#!/usr/bin/env node
/**
 * Lim-Tec product selection MCP server (stdio, zero-dependency Node).
 *
 * Tools:
 *   select_limtec — screw jack / servo electric cylinder / linear actuator
 *                   selection from a duty point: matched model, full order
 *                   code, engineering checks and CNY reference price (tax-
 *                   included public list price), byte-identical to the
 *                   Lim-Tec online selector engine.
 *
 * The engine is the single source of truth: this wrapper only shells out to
 * scripts/select.js (same code path as the Lim-Tec online platform).
 */
'use strict';
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const ROOT = __dirname;
const SELECT = path.join(ROOT, 'scripts', 'select.js');

const TOOLS = [
  {
    name: 'select_limtec',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    description: 'Lim-Tec product selection for screw jacks (SJA/SJB/KV/EHB/SCA/SCB), servo electric cylinders (DMB/EMB/GTR/FMR) and linear actuators (LAP/LBP/LAM/LBM). Given load, stroke, speed and duty parameters it returns the matched model, full order code, engineering checks (thrust, speed, power, stability, life) and public reference prices in CNY with an official USD conversion at a fixed published rate (rate date included). Engine is byte-identical to the Lim-Tec online selector. Note load units: LAP/LBP default to tonnes, LAM to kg. Call with list_fields=true first if a field name is unclear.',
    inputSchema: {
      type: 'object',
      properties: {
        product: { type: 'string', enum: ['screwjack', 'cylinder', 'rod'], description: 'product line: screwjack | cylinder (servo electric cylinder) | rod (linear actuator)' },
        sets: { type: 'array', items: { type: 'string' }, description: 'parameter list, items like "key=value" (e.g. ["series=DMB","load=1","load_unit=t","stroke_mm=400","speed_mm_s=200"])' },
        list_fields: { type: 'boolean', description: 'if true, only return all fields and defaults for the product line, ignoring sets' }
      },
      required: ['product']
    }
  }
];

function run(cmd, args, input) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: ROOT });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (code) => resolve({ code, out, err }));
    if (input !== undefined) p.stdin.write(input);
    p.stdin.end();
  });
}

async function callTool(name, a) {
  if (name === 'select_limtec') {
    const argv = [SELECT];
    if (a.list_fields) { argv.push('--product=' + a.product, '--list-fields'); }
    else {
      argv.push('--product=' + a.product);
      (a.sets || []).forEach((s) => argv.push('--set=' + s));
      argv.push('--json=' + path.join(os.tmpdir(), 'limtec_select_result.json'), '--quiet');
    }
    const r = await run('node', argv);
    if (a.list_fields) return { type: 'text', text: r.out || r.err };
    if (r.code !== 0) return { type: 'text', text: 'selection failed: ' + r.err };
    return { type: 'text', text: fs.readFileSync(path.join(os.tmpdir(), 'limtec_select_result.json'), 'utf8') };
  }
  throw new Error('unknown tool: ' + name);
}

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    handle(line).catch((e) => send({ jsonrpc: '2.0', id: null, error: { code: -32603, message: String(e && e.message) } }));
  }
});
async function handle(line) {
  let msg;
  try { msg = JSON.parse(line); } catch (e) { return; }
  const { id, method, params } = msg;
  if (method === 'initialize') {
    return send({
      jsonrpc: '2.0', id, result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'limtec-product-selector', version: '1.0.5' }
      }
    });
  }
  if (method === 'notifications/initialized') return;
  if (method === 'tools/list') return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
  if (method === 'tools/call') {
    try {
      const res = await callTool(params.name, params.arguments || {});
      send({ jsonrpc: '2.0', id, result: { content: [res] } });
    } catch (e) {
      send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: 'error: ' + e.message }], isError: true } });
    }
    return;
  }
  if (method === 'ping') return send({ jsonrpc: '2.0', id, result: {} });
  if (id !== undefined) send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found: ' + method } });
}
function send(o) { process.stdout.write(JSON.stringify(o) + '\n'); }
