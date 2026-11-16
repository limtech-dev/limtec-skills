# Order number (MLFB) structure

Every order number in this library follows the Siemens configurable-number convention:
a **base number** that fixes the frame, length and winding, followed by an **option block**
that fixes connector, encoder, shaft end, brake and protection.

Changing one option digit produces a *different motor*. That is why the skill never lets
the model assemble a number by hand — the script assembles it and prints the digit
breakdown so a buyer can check it.

## 1FL6 — V90 (SIMOTICS S-1FL6)

`1FL6` `022` `-` `2AF21` `-` `1MA1`

| Part | Meaning |
|---|---|
| `1FL6022` | frame / shaft height (022 = SH20, 036 = SH36, 052 = SH52, …) |
| `-2AF21` | inertia and winding block — fixed per rating |
| option block `-1 X X X` | connector, encoder, shaft+brake, protection (see below) |

Option block digits (positions 2–5 of the last segment):

| Digit | Position | Values |
|---|---|---|
| 1 | connector | `0` fixed straight connector, `1` cable-type connector, `2` adjustable right-angle connector |
| 2 | encoder | `A` incremental TTL 2500 ppr, `M` 21-bit single-turn absolute, `L` 20-bit + 12-bit multi-turn absolute |
| 3 | shaft / brake | `G` plain shaft, no brake · `H` plain shaft, with brake · `A` keyed shaft, no brake · `B` keyed shaft, with brake |
| 4 | protection | `1` IP65 with shaft sealing ring |

Example: `1FL6042-2AF21-1MH1` = low-inertia 0.75 kW, cable connector, 21-bit single-turn
absolute encoder, plain shaft **with brake**, IP65.

## 1FL2 — S200 (SIMOTICS S-1FL2)

`1FL2` `102-2AG` + `11` `-` `1` `M` `B` `0`

The option block is **7 digits with a hyphen in the middle**:
`<brake><protection>` `-` `<shaft><encoder><connector><version>`.

| Digit | Meaning | Values |
|---|---|---|
| 1 | brake | `0` without, `1` with spring-applied holding brake |
| 2 | protection | `0` IP54, `1` IP65 with shaft sealing ring |
| — | separator | hyphen (a 6-digit tail without the hyphen is **not** a valid order number) |
| 3 | shaft end | `0` plain shaft, `1` shaft with key |
| 4 | encoder | `H` 17-bit single-turn absolute, `S` 21-bit single-turn absolute, `M` 21-bit single-turn + 12-bit multi-turn absolute |
| 5 | connector system | `B` metal circular connector (default), `C` metal hybrid connector |
| 6 | version | `0` standard |

Example: `1FL2203-2AG11-1MC0` = 0.2 kW, brake, IP65, keyed shaft, 21-bit + 12-bit
multi-turn absolute encoder, hybrid connector, version 0.

This library assembles the connector digit as `B` (round connector, the standard
configuration). If the customer's existing harness uses the hybrid connector, change that
single digit to `C` — say so explicitly when you do it.

## 1FL1 — S200 Compact

Same option-block structure as 1FL2 (7 digits, hyphenated), but:

| Digit | Difference vs 1FL2 |
|---|---|
| protection | always `1` — 1FL1 is only offered as IP65 with shaft sealing ring |
| encoder | `H` 17-bit single-turn, `S` 21-bit single-turn, `A` 21-bit single-turn + 12-bit multi-turn **with battery** |
| connector | always `D` — metal circular connector |

Example: `1FL1102-4AG11-1AD0` = 0.4 kW S200 Compact, brake, IP65, keyed shaft,
21-bit + 12-bit multi-turn absolute encoder, connector D.

1FL1 drives and cables are **not interchangeable** with 1FL2:
drives `6SL5610-1GB10-{1,2,4,8}AF0`, power cable `6FX1002-5DN32-…`,
encoder `6FX1002-2XB12/2XB14-…`.

## 1FK2 — S210 (SIMOTICS S-1FK2)

`1FK2` `206-4AF` `10` `-` `1` `M` `A` `0`

16 characters total. The first block (`1FK2` + inertia digit + shaft height + structure
length + winding) is already fixed in the base number; the option block is the last
6 characters.

| Digit | Meaning | Values |
|---|---|---|
| inertia | 2nd character | `1` high dynamic (HD), `2` compact (CT) |
| brake | 1st of option block | `0` without, `1` with holding brake |
| protection | 2nd | `0` IP64, `1` IP65 with radial shaft sealing ring |
| — | separator | hyphen |
| shaft end | 3rd | `0` plain shaft, `1` shaft with key |
| encoder | 4th | `S` AS22DQC 22-bit single-turn absolute, `M` AM22DQC 22-bit + 12-bit multi-turn absolute |
| connection | 5th | `A` OCC single cable (pair with S210), `B` 2CC twin cable (pair with S120) |
| version | 6th | `0` standard |

**Winding letter fixes the voltage**: `B / C / F / H / K` = 400 V class, `G` = 230 V class
(1AC 230 V or 3AC 240 V, 3000 rpm screen).

Example: `1FK2206-4AF10-1MA0` = HD inertia, SH20, structure 6, winding 4AF, brake,
IP64, keyed shaft, AM22DQC multi-turn, OCC single cable.

**IP65 caveat for SH30 / SH40**: the radial shaft sealing ring shortens the usable shaft
end (SH30 goes from 14×30 to 14×21.5 mm) — re-check pulley and coupling fit.

## 1FT7 — S120

Positions 9–16 carry the options (per the 03/2024 configuration manual):

| Position | Meaning | Values |
|---|---|---|
| 9 | cooling | `A` / `W` / `S` |
| 10 | rated speed | `B` / `C` / `F` / `H` / `K` |
| 12 | flange | `0` / `5` / `1` / `4` |
| 13 | orientation | `1`–`4` |
| 14 | encoder | `C` AM24DQI (DRIVE-CLiQ) |
| 15 | shaft end | `A` plain, `B` with brake |
| 16 | protection | `0` IP64, `1` IP65, `2` IP67; `3`–`5` same but vibration-hardened (`R`) |

## 1FK7 / 1PH8 — S120

These are ordered as complete catalogue numbers (`1FK7032-2AK71-1AA0`,
`1PH8133-3FG02-2AA1-ZU60`); the option block is fixed per motor. A different brake,
encoder or shaft variant is a **different order number** — ask us to confirm before
switching options. `-Z` suffixes are order codes for special options and must be quoted
exactly as they appear.

## Drive order numbers

| Family | Pattern | Notes |
|---|---|---|
| V90, 220 V | `6SL3210-5FB1x-xUFx` | power digit encodes the kW step |
| V90, 380 V | `6SL3210-5FE1x-xUFx` | |
| S200 | `6SL5510-1BE1x-xAF0` (PROFINET) | `pti` variant differs in the last block |
| S200 Compact | `6SL5610-1GB10-{1,2,4,8}AF0` | 200 V only, 1FL1 only |
| S210, 380–480 V | `6SL5310-1BE1x-xDF1` | |
| S210, 200–240 V | `6SL5310-1BE1x-xDF0` | same hardware, different voltage class |
| S210, 1AC 230 V | `6SL5310-1BB10-{1,2,4,8}CF0` | 0.8/3.1 · 1.4/4.8 · 2.4/8.7 · 4.4/16 A |
| S120 CU | `6SL3040-1LA01-0AA0` (CU310-2 PN) / `6SL3040-1MA01-0AA0` (CU320-2 PN) | |
| S120 CF card | `6SL3054-0FC30-1BA0` (single) / `6SL3054-0FC31-1BA0` (multi) | license on card |

## Cable length code

Last block = `1<decametre><metre>0`:

- decametre `A=0 B=10 C=20 D=30 E=40 F=50`
- metre `A=0 B=1 C=2 D=3 E=4 F=5 G=6 H=7 J=8 K=9` (**I is skipped**)

`1BA0` = 10 m, `1CF0` = 25 m, `1FA0` = 50 m. There is no `1F0` and no `1FA`.
