'use strict';
/* Single source of the USD reference rate.
 *
 * Rate period 2026-11: the twice-yearly review falls on 15 November; 15 Nov 2026 was a
 * Sunday, so the previous trading day 2026-11-13 applies. Source: CFETS central parity.
 * Next review: 2027-05-14 (15 May 2027 is a Saturday).
 *
 * The Lim-Tec price book stays in CNY; USD is derived by dividing by USD_RATE.
 * The rate value and date are internal: never printed in customer-facing output
 * (README, CLI text, JSON, proposal PDF).
 */
const USD_RATE = 6.7152;
const RATE_DATE = '2026-11-13';

module.exports = { USD_RATE, RATE_DATE };
