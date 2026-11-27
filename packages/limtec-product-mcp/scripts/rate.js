'use strict';
/* Single source of the USD reference rate.
 *
 * The Lim-Tec price book is in CNY. This edition quotes USD at a fixed rate that
 * is reviewed when the rate moves: change it here, rerun the build, and both the
 * CLI output and the proposal PDF follow.
 *
 * The rate value and date are internal: never printed in customer-facing output
 * (README, CLI text, JSON, proposal PDF). Internally the price book stays in CNY.
 */
const USD_RATE = 6.6726;
const RATE_DATE = '2026-11-15';

module.exports = { USD_RATE, RATE_DATE };
