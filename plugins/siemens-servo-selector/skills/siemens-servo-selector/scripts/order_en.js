'use strict';
/**
 * English order-number explanation.
 *
 * The number itself is ALWAYS taken from `engine.js` (orderNo().full) — this file
 * only produces the English digit-by-digit breakdown. Each digit is recomputed with
 * the same formulas as the engine and then compared with the real number; if they
 * ever disagree the breakdown is suppressed and only the plain number is shown.
 * That way a future rule change in engine.js can never produce a wrong explanation.
 */

const CONN_V90 = {
  '0': 'fixed straight connector',
  '1': 'cable-type connector',
  '2': 'adjustable right-angle connector'
};
const ENC_V90 = {
  A: 'incremental TTL 2500 ppr',
  M: '21-bit single-turn absolute',
  L: '20-bit + 12-bit multi-turn absolute'
};
const SHAFT_V90 = {
  G: 'plain shaft, no brake',
  H: 'plain shaft, with brake',
  A: 'keyed shaft, no brake',
  B: 'keyed shaft, with brake'
};
const ENC_1FK2 = {
  S: 'AS22DQC — 22-bit single-turn absolute',
  M: 'AM22DQC — 22-bit + 12-bit multi-turn absolute'
};

function digits(n, labels, out) {
  for (let i = 0; i < n.length; i++) {
    const c = n[i];
    if (c === '-') { continue; }
    const lab = labels[i];
    if (!lab) continue;
    out.push(Array.isArray(lab) ? (lab[0] + ' `' + c + '` = ' + (lab[1][c] || '—')) : (lab + ' `' + c + '`'));
  }
}

/**
 * @returns {{full:string, explain:string, verified:boolean}}
 */
function orderExplainEn(m, q) {
  let full = null;
  try {
    const r = orderNo(m, q);
    full = r && r.full ? r.full : null;
  } catch (e) { full = null; }
  full = full || m.order_no || m.base || m.model;

  const base = m.base || m.model;
  const tail = (base && full.indexOf(base) === 0) ? full.slice(base.length) : '';
  const out = [];

  try {
    if (m.system === 'V90') {
      const sb = (q.shaft === 'plain' ? '光轴' : '滑键') + (q.brake === 'yes' ? '带抱闸' : '无抱闸');
      const sm = m.suffix_map['轴/抱闸'] || {};
      const codeSB = sm[sb] || 'A';
      const EM = m.suffix_map['编码器'] || {};
      let encKey;
      if (q.enc === 'rel') encKey = '增量 TTL 2500 ppr';
      else if (q.enc === 'mt_abs') encKey = '20 位 + 12 位多圈绝对值';
      else encKey = ['20 位 + 12 位多圈绝对值', '21 位单圈绝对值', '增量 TTL 2500 ppr'].find(k => EM[k]) || Object.keys(EM)[0];
      const codeE = EM[encKey] || 'A';
      const recomputed = m.base + m.order_suffix.replace('{编码器}', codeE).replace('{轴}', codeSB);
      if (recomputed !== full) return { full, explain: '', verified: false };
      out.push('`' + base + '` + `' + tail + '`');
      digits(tail.slice(1), [
        ['Connector', CONN_V90],
        ['Encoder', ENC_V90],
        ['Shaft / brake', SHAFT_V90],
        ['Protection', { '1': 'IP65 with shaft sealing ring' }]
      ], out);
      out.push('The option bits can be changed to match on-site wiring — digit 1 (connector) is the one customers change most often.');
    } else if (m.system === 'S200' || m.system === 'S210') {
      const is1FL1 = (m.family === '1FL1');
      const b = q.brake === 'yes' ? '1' : '0';
      let ip;
      if (is1FL1) ip = '1';
      else if (m.system === 'S210') ip = (q.env === 'ip65') ? '1' : '0';
      else ip = (String(m.ip || '').indexOf('IP65') >= 0) ? '1' : '0';
      if (m.system !== 'S210' && !is1FL1) {
        if (q.env === 'ip65') ip = '1';
        else if (q.env === 'ip64') ip = '0';
      }
      const sh = (q.shaft === 'plain') ? '0' : '1';

      if (m.system === 'S210') {
        let e = 'M';
        if (q.enc !== 'mt_abs') e = 'S';
        const recomputed = m.base + b + ip + '-' + sh + e + 'A0';
        if (recomputed !== full) return { full, explain: '', verified: false };
        out.push('`' + base + '` + `' + tail + '`');
        digits(tail, [
          ['Brake', { '0': 'without holding brake', '1': 'with holding brake' }],
          ['Protection', { '0': 'IP64', '1': 'IP65 with radial shaft sealing ring' }],
          ['', {}],
          ['Shaft end', { '0': 'plain shaft (no keyway)', '1': 'shaft with keyway' }],
          ['Encoder', ENC_1FK2],
          ['Connection', { 'A': 'OCC single cable (for S210)', 'B': '2CC twin cable (for S120)' }],
          ['Version', { '0': 'standard' }]
        ], out);
        out.push('For an S120 twin-cable (2CC) setup with the same motor, change the connection digit A → B.');
        if ((m.sh || 0) <= 40 && ip === '1') {
          out.push('On SH30/SH40, selecting IP65 shortens the usable shaft end (SH30: 14×30 → 14×21.5 mm) — re-check pulley/coupling fit.');
        }
      } else {
        const oc = m.option_code || {};
        let eKey;
        if (q.enc === 'mt_abs') eKey = '绝对值编码器 21 位单圈 + 12 位多圈';
        else if (q.enc === 'rel') eKey = '绝对值编码器 17 位单圈';
        else eKey = '绝对值编码器 21 位单圈';
        const e = ((oc['编码器'] || {})[eKey]) || 'S';
        const conn = is1FL1 ? 'D' : 'B';
        const recomputed = m.base + b + ip + '-' + sh + e + conn + '0';
        if (recomputed !== full) return { full, explain: '', verified: false };
        out.push('`' + base + '` + `' + tail + '`');
        digits(tail, [
          ['Brake', { '0': 'without holding brake', '1': 'with holding brake' }],
          ['Protection', is1FL1 ? { '1': 'IP65 with shaft sealing ring' } : { '0': 'IP54', '1': 'IP65 with shaft sealing ring' }],
          ['', {}],
          ['Shaft end', { '0': 'plain shaft', '1': 'shaft with key' }],
          ['Encoder', { S: '21-bit single-turn absolute', M: '21-bit single-turn + 12-bit multi-turn absolute', H: '17-bit single-turn absolute' }],
          ['Connector system', { B: 'metal circular connector', C: 'metal circular connector', D: 'metal circular connector (fixed D on 1FL1)' }],
          ['Version', { '0': 'standard' }]
        ], out);
        out.push('The last block is 7 digits as "brake + protection" — "shaft + encoder + connector + version". A 6-digit tail (no hyphen) is not a real order number and cannot be found in the Siemens mall.');
      }
    } else {
      out.push('Complete catalogue order number for the 1FK7 / 1FT7 / 1PH8 motor — the option bits are fixed per motor, so this number can be ordered as-is.'
        + (q.brake === 'yes' ? ' A brake version uses a different order number — ask us to confirm before ordering.' : ''));
    }
  } catch (e) {
    return { full, explain: '', verified: false };
  }

  return { full, explain: out.join('\n'), verified: true };
}

module.exports = { orderExplainEn };
