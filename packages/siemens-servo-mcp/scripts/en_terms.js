'use strict';
/**
 * English wording for values that live inside the data set (cooling method,
 * inertia class, IP rating, encoder description, lead-time strings).
 *
 * Anything the data set grows later that is not in these tables is run through a
 * small regex normaliser, and whatever still contains CJK is flagged with a
 * leading "[zh]" marker so a leaking label is visible instead of silently wrong.
 */

const COOLING = {
  '自然冷却': 'natural convection',
  '自冷却': 'self-ventilated',
  '强制风冷': 'forced air cooling',
  '强制通风': 'forced ventilation',
  '人工通风（强制风冷 DE→NDE）': 'forced ventilation (DE → NDE)',
  '水冷却': 'water cooling',
  '外部风冷': 'external air cooling'
};

const INERTIA = {
  '低惯量': 'low inertia',
  '标准惯量': 'standard inertia',
  '标准惯量（官方数据表）': 'standard inertia (official datasheet)',
  '中惯量': 'medium inertia',
  '高惯量': 'high inertia',
  '高动态 HD': 'high dynamic (HD)',
  '紧凑型 CT': 'compact (CT)',
  '（进口）': 'imported',
  'SH100/132': 'SH100/132'
};

const IP = {
  'IP65（带轴密封圈）': 'IP65 (with shaft sealing ring)',
  'IP64（可选 IP65，带轴密封圈）': 'IP64 (IP65 with shaft sealing ring optional)',
  'IP64/IP65': 'IP64 / IP65'
};

const ENC = {
  '增量 sin/cos 1Vpp': 'incremental sin/cos 1 Vpp',
  '增量 TTL 2500 ppr': 'incremental TTL 2500 ppr',
  '绝对值编码器 17 位单圈': 'absolute encoder, 17-bit single-turn',
  '绝对值编码器 21 位单圈': 'absolute encoder, 21-bit single-turn',
  '绝对值编码器 21 位单圈 + 12 位多圈': 'absolute encoder, 21-bit single-turn + 12-bit multi-turn',
  'EnDat 2048S/R 绝对值': 'EnDat 2048S/R absolute',
  'EnDat 2.2 绝对值': 'EnDat 2.2 absolute',
  '22 位单圈绝对值（AS22DQC）': '22-bit single-turn absolute (AS22DQC)',
  '22 位 + 12 位多圈绝对值（AM22DQC）': '22-bit + 12-bit multi-turn absolute (AM22DQC)',
  '22 位绝对值单圈 + 12 位多圈（AM22DQ，DRIVE-CLiQ）': '22-bit absolute single-turn + 12-bit multi-turn (AM22DQ, DRIVE-CLiQ)',
  '24 位 + 12 位多圈绝对值 (DRIVE-CLiQ)': '24-bit + 12-bit multi-turn absolute (DRIVE-CLiQ)',
  '24 位 + 12 位多圈绝对值 (DRIVE-CLiQ, AM24DQI)': '24-bit + 12-bit multi-turn absolute (DRIVE-CLiQ, AM24DQI)',
  '24 位绝对值 + 12 位多圈绝对值（AM24DQI，DRIVE-CLiQ）': '24-bit absolute + 12-bit multi-turn absolute (AM24DQI, DRIVE-CLiQ)',
  '绝对值编码器（DRIVE-CLiQ）': 'absolute encoder (DRIVE-CLiQ)',
  '型号：绝对值 24 位多圈（DRIVE-CLiQ）': 'type: absolute 24-bit multi-turn (DRIVE-CLiQ)',
  '21 位单圈绝对值': '21-bit single-turn absolute',
  '20 位 + 12 位多圈绝对值': '20-bit + 12-bit multi-turn absolute'
};

/* Generic fallback for values added after this file was written. */
function normalise(s) {
  let t = String(s);
  t = t.replace(/（/g, ' (').replace(/）/g, ')').replace(/，/g, ', ').replace(/：/g, ': ');
  t = t.replace(/(\d+)\s*位\s*单圈?/g, '$1-bit single-turn');
  t = t.replace(/(\d+)\s*位\s*\+\s*(\d+)\s*位\s*多圈/g, '$1-bit + $2-bit multi-turn');
  t = t.replace(/(\d+)\s*位\s*多圈/g, '$1-bit multi-turn');
  t = t.replace(/绝对值编码器/g, 'absolute encoder');
  t = t.replace(/绝对值/g, 'absolute');
  t = t.replace(/增量/g, 'incremental');
  t = t.replace(/带轴密封圈/g, 'with shaft sealing ring');
  t = t.replace(/带电池/g, 'with battery');
  t = t.replace(/可选/g, 'optional');
  t = t.replace(/型号:/g, 'type:');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function pick(table, v, fallback) {
  if (v == null || v === '') return fallback || '—';
  const s = String(v).trim();
  if (table[s] != null) return table[s];
  const n = normalise(s);
  return /[^\x00-\x7F]/.test(n) ? '[zh] ' + n : n;
}

module.exports = {
  cooling: v => pick(COOLING, v),
  inertia: v => pick(INERTIA, v),
  ip: v => pick(IP, v),
  enc: v => pick(ENC, v),
  normalise,
  hasCJK: s => /[^\x00-\x7F]/.test(String(s))
};
