'use strict';
/**
 * English BOM text layer.
 *
 * This file contains **only English wording** — every order number, drive pick,
 * cable code and fallback chain is taken from `engine.js` (the untouched Chinese
 * engine, byte-identical to the CN package). Keeping the arithmetic in one place
 * and the wording in another is what guarantees that the EN and CN skills return
 * exactly the same order numbers for the same query.
 *
 * Parity is verified by `_dev/parity.js` (order numbers must match 1:1).
 */

const fn = v => (v == null || v === '') ? '—' : v;
const K = v => (v == null ? 0 : v);
const T = require('./en_terms.js');

function voltTxt(m) {
  const v = (m.voltage || []);
  return v.length ? v.join('/') + ' V' : '—';
}

function selBomItemsEn(m, q) {
  const cl = q.clen || 10;
  const pn = m.pn || 0;
  const it = [];

  /* ---- 1. motor ---- */
  const motorSpec = 'Rated ' + m.mn + ' N·m / ' + m.nn + ' rpm / ' + m.pn + ' kW'
    + (m.m0 != null ? (', standstill torque m₀ = ' + m.m0 + ' N·m') : '')
    + '; ' + (q.volt && q.volt !== 'any' ? q.volt + ' V, ' : '')
    + T.cooling(m.cooling)
    + '; SH ' + m.sh + '; ' + T.enc(((m.encoders || []).slice(-1)[0]) || '')
    + (m.brake && m.brake.avail ? ('; holding brake' + (m.brake.torque ? (' ' + m.brake.torque + ' N·m') : '')) : '')
    + '; ' + (m.mass ? ('mass ' + m.mass + ' kg') : '');

  let mno = m.order_no || null;
  /* 1FK2 / S210 must be assembled from the live options — brake, IP rating, shaft end
     and encoder all change the order number, so the catalogue's "typical" number is wrong
     as soon as the customer deselects the brake. */
  if (!mno || m.system === 'S210') {
    try { mno = orderNo(m, q).full; } catch (e) { mno = mno || null; }
  }
  it.push({ name: 'Servo motor ' + (m.base || m.model), spec: motorSpec, no: (mno || m.base || m.model), qty: 1 });

  /* ---- 2. drive + cables ---- */
  if (m.system === 'V90') {
    /* Drive must match the motor's voltage class: 220 V motors → 5FB1x, 380 V → 5FE1x,
       smallest kW step that covers the motor. */
    const dv = driveV90(m, q);
    const no = dv ? ((q.ctrl === 'pulse') ? dv.order_pulse : dv.order_pn)
      : (pn <= 0.5 ? '6SL3210-5FB10-2UF2' : pn <= 1 ? '6SL3210-5FB10-4UF1' : '6SL3210-5FB11-0UF1');
    it.push({
      name: 'SINAMICS V90 servo drive (' + (q.ctrl === 'pulse' ? 'PTI pulse train' : 'PROFINET') + ')',
      spec: 'For ' + m.pn + ' kW / ' + ((m.voltage || []).join('/')) + ' V motors'
        + (dv ? (', frame size ' + (dv.frame || '—') + ' (' + dv.pn + ' kW)') : '')
        + ', PROFINET, built-in EPOS positioning',
      no: no, qty: 1
    });
    it.push({ name: 'Power cable (MOTION-CONNECT 300)', spec: 'V90 power cable, ' + cl + ' m, motor-side connector, shielded', no: V90PW(m, q), qty: 1, unit: 'pcs' });
    it.push({ name: 'Encoder cable (MOTION-CONNECT 300)', spec: 'V90 encoder cable, ' + cl + ' m', no: V90ENC(m, q), qty: 1, unit: 'pcs' });
    if (m.brake && m.brake.avail && q.brake !== 'no') {
      it.push({ name: 'Brake cable (MOTION-CONNECT 300)', spec: 'V90 brake cable, ' + cl + ' m', no: V90BK(m, q), qty: 1, unit: 'pcs' });
    }

  } else if (m.system === 'S200') {
    const dv = driveS200(m, q);
    const no = dv ? ((q.ctrl === 'pulse') ? dv.order_pulse : dv.order_pn)
      : (pn <= 0.75 ? '6SL5510-1BE10-2AF0' : '6SL5510-1BB10-2AF0');
    it.push({
      name: 'SINAMICS S200 servo drive (PROFINET)',
      spec: 'For ' + m.pn + ' kW / ' + ((m.voltage || []).join('/')) + ' V'
        + (dv ? (', frame size ' + (dv.frame || '—')) : '')
        + ', PROFINET, built-in STO',
      no: no, qty: 1
    });
    if (m.family === '1FL1') {
      /* S200 Compact (1FL1): one power cable with brake cores + one encoder cable. */
      const lb1 = lenBlock(cl) || '1BA0';
      const P = (typeof PRICES !== 'undefined') ? PRICES : {};
      const pick = (a) => { for (const c of a) { if (P[c]) return c; } return a[0]; };
      const pw = pick(['6FX1002-5DN32-' + lb1]);
      const bat = (q.enc === 'mt_abs' || q.enc === 'bat_abs' || q.enc === 'any');
      const ec = pick(bat ? ['6FX1002-2XB14-' + lb1, '6FX1002-2XB12-' + lb1]
        : ['6FX1002-2XB12-' + lb1, '6FX1002-2XB14-' + lb1]);
      it.push({ name: 'S200 Compact power cable (brake cores included)', spec: 'MOTION-CONNECT 100, ' + cl + ' m, non-drive end, brake cores included', no: pw, qty: 1, unit: 'pcs' });
      it.push({
        name: 'S200 Compact encoder cable' + (bat ? ' (with battery)' : ''),
        spec: 'MOTION-CONNECT 100, ' + cl + ' m' + (bat ? ', for 21-bit single-turn + 12-bit multi-turn (battery)' : ''),
        no: ec, qty: 1, unit: 'pcs'
      });
    } else {
      const lb2 = lenBlock(cl);
      const twoNo = (function () {
        const P = (typeof PRICES !== 'undefined') ? PRICES : {};
        for (const c of ['6FX3502-7CD01-' + lb2, '6FX3502-7DN01-' + lb2, '6FX3502-7DD01-' + lb2]) { if (P[c]) return c; }
        return '6FX3502-7CD01-' + lb2;
      })();
      it.push({ name: 'S200 combined cable (one connector, power + encoder)', spec: 'Fixed installation ' + cl + ' m, 1 million bending cycles, brake control included, non-shaft-end outlet', no: twoNo, qty: 1, unit: 'pcs' });
    }

  } else if (m.system === 'S210') {
    /* S210 is PROFINET only (built-in STO + EPOS). Drive is picked by current:
       drive I_max ≥ motor Imax, smallest step. */
    const dv = driveS210(m, q);
    const no = dv ? dv.order : null;
    const v0 = ((m.voltage || [])[0] || '380');
    it.push({
      name: 'SINAMICS S210 servo drive (PROFINET)',
      spec: 'For ' + m.pn + ' kW / ' + ((m.voltage || []).join('/')) + ' V motor'
        + (dv ? (', frame ' + dv.frame + ', ' + dv.i_rated + ' A rated / ' + dv.i_max + ' A max (motor Imax ' + fn(m.imax) + ' A)') : '')
        + (dv && dv.legacy && v0 === '230' ? ('; on a 3AC 200…240 V supply use ' + dv.legacy + ' instead') : '')
        + ', PROFINET/IRT, built-in STO and EPOS, One Button Tuning',
      no: (no || '6SL5310-1BE13-5DF1'), qty: 1
    });
    const lb3 = lenBlock(cl);
    const O = ((DATA.cables || {}).S210_occ) || {};
    const occKey = ((m.sh || 0) >= 63) ? 'M23' : (((m.sh || 0) <= 20) ? 'M12' : 'M17');
    const o = (O[occKey] || {});
    const occNo = (o.product500 || '6FX5002-8QN11') + '-' + (lb3 || '1BA0');
    it.push({
      name: 'OCC single cable (power + encoder + brake in one)',
      spec: '1FK2 ⟷ S210, ' + (q.clen || 10) + ' m, ' + occKey + ' connector, '
        + fn(o.cross) + '; replaces power, encoder and brake cables',
      no: occNo, qty: 1, unit: 'pcs'
    });

  } else {
    const multi = (q.axes === 'multi');
    it.push({
      name: 'S120 Control Unit ' + (multi ? 'CU320-2 PN (multi-axis)' : 'CU310-2 PN (single-axis)'),
      spec: multi ? 'Multi-axis control unit, PROFINET, up to 6 motor modules' : 'Single-axis control unit, PROFINET, integrated power unit interface',
      no: (multi ? '6SL3040-1MA01-0AA0' : '6SL3040-1LA01-0AA0'), qty: 1
    });
    it.push({
      name: 'S120 CF card' + (multi ? ' (incl. performance extension)' : ''),
      spec: multi ? 'Performance extension and license included (license stored on the card)' : 'Performance extension and license included (V5.2 SP3)',
      no: (multi ? '6SL3054-0FC31-1BA0' : '6SL3054-0FC30-1BA0'), qty: 1
    });
    it.push({ name: 'Basic Operator Panel BOP20', spec: 'Parameter display and manual commissioning', no: '6SL3055-0AA00-4BA0', qty: 1 });
    it.push({ name: '24 V auxiliary supply SITOP PSU200M', spec: '120/230 V AC in, 24 V DC / 5 A out', no: '6EP1333-3BA10', qty: 1 });
    it.push({ name: 'Braking resistor', spec: 'Sized to motor power (internal reference code — ask us to map it to your motor)', no: 'JJY.023424020001', qty: 1 });
    it.push({ name: 'Power cable with brake cores (MOTION-CONNECT 500)', spec: '6FX5002-5DG23 series, ' + cl + ' m, brake cores and cable end kit included', no: '6FX5002-5DG23-2AA0', qty: 1, unit: 'pcs' });
    it.push({ name: 'DRIVE-CLiQ signal cable', spec: '6FX5002-2DC10 series, ' + cl + ' m, 24 V included', no: '6FX5002-2DC10-2AA0', qty: 1, unit: 'pcs' });
  }

  return it;
}

module.exports = { selBomItemsEn, voltTxt, K };
