# Selection rules

The knowledge base behind the script. Read this when the user asks **why** a motor or
drive was chosen — never invent a rule that is not written here.

## 1. Series pairing

| Drive system | Motor series | Power range | Control interface | Axes |
|---|---|---|---|---|
| SINAMICS V90 | SIMOTICS S-1FL6 | 0.05–7.0 kW | PTI pulse train / PROFINET | single |
| SINAMICS S200 | SIMOTICS S-1FL2 | 0.05–7.0 kW | PROFINET (PTI on part of the range) | single |
| SINAMICS S200 Compact | SIMOTICS S-1FL1 | 0.1–0.4 kW (200 V) | PROFINET | single |
| SINAMICS S210 | SIMOTICS S-1FK2 | 0.05–7.0 kW | PROFINET / IRT only | single |
| SINAMICS S120 | 1FK7 / 1FT7 / 1PH8 | 0.4–100 kW+ | PROFINET / PROFIBUS | single or multi |

Recommendation priority used by this tool:

- demand **≤ 7 kW** → S200 → V90 → S210 → S120 (1FK7 / 1FT7) → 1PH8
- demand **> 7 kW** → 1FK7 / 1FT7 → 1PH8 (S200 / V90 / S210 cannot reach it and are
  pushed to the bottom automatically)

The priority reflects commercial reality (S200 is the current mainstream platform, V90
the volume workhorse, S210 the high-dynamics single-cable option, S120 the only path
above 7 kW or for multi-axis), not a technical ranking.

**S200 Compact (1FL1) is a separate line from 1FL2.** It only appears when the drive
system is set to `S200CC` or `auto`; it never mixes into S200 / S200C / S200B results.
Its drive family (`6SL5610-1GB10-…`) cannot be paired with an 1FL2 motor, and vice versa.

## 2. Drive pairing criteria

- **S210 + 1FK2 — current based.** Per the S210 operating instructions §3.5.3: the
  drive's maximum output current must be **≥ the motor's maximum current Imax**, and
  the smallest rating that satisfies it is chosen. Eight ratings:
  0.4 / 0.75 / 1.0 kW (FSA), 1.5 / 2.0 kW (FSB), 3.5 / 5.0 / 7.0 kW (FSC).
  Order number pattern `6SL5310-1BE1x-xDF1` for 380–480 V.
  Three voltage lines exist and must not be mixed:
  - 3AC 380–480 V → `1BE1x-xDF1`
  - 3AC 200–240 V → `1BE1x-xDF0` (same hardware, different voltage class, not an older version)
  - 1AC 230 V → `6SL5310-1BB10-{1,2,4,8}CF0` (0.8/3.1 A, 1.4/4.8 A, 2.4/8.7 A, 4.4/16 A)
- **V90 + 1FL6 — voltage class and power.** 220 V motors → `6SL3210-5FB1x`,
  380 V motors → `6SL3210-5FE1x`, smallest kW step that covers the motor.
- **S200 + 1FL2 — voltage class and power**, `6SL5510-…`, smallest suitable step.
- **S120** — single axis uses CU310-2 PN; multi-axis uses CU320-2 PN plus a line module
  and motor modules chosen by current.

Where our own order history has a matching drive in stock, that rating is preferred over
the theoretical minimum — it is a commercial decision (availability), not a technical one.
It never changes the safety margin: the preferred drive still covers the motor.

## 3. Cable rules

**Length code — one rule for every family.** The last block of the order number is
`1<decametre><metre>0`:

- decametre digit: `A=0 B=10 C=20 D=30 E=40 F=50`
- metre digit: `A=0 B=1 C=2 D=3 E=4 F=5 G=6 H=7 J=8 K=9` (letter **I is skipped**)

| Length | Code | Length | Code |
|---|---|---|---|
| 3 m | `1AD0` | 15 m | `1BF0` |
| 5 m | `1AF0` | 20 m | `1CA0` |
| 7 m | `1AH0` | 25 m | `1CF0` |
| 10 m | `1BA0` | 50 m | `1FA0` |

Families:

- **V90** — MOTION-CONNECT 300, `6FX3002-` + product digit + length code.
  Power: low inertia ≤1 kW → `5CK01`, low inertia 1.5–2 kW → `5CL02`,
  high inertia 0.4–7 kW → `5CL12`.
  Encoder: absolute `2DB1x / 2DB2x`, incremental `2CT1x / 2CT2x`.
  Brake: `5BL03 / 5BK02`. Standard lengths 3/5/7/10/15/20 m.
- **S200** — MOTION-CONNECT 350, `6FX3502-7CD01-<length>`: power and encoder in one cable.
- **S200 Compact** — power `6FX1002-5DN32-<length>` (brake cores already included),
  encoder `6FX1002-2XB12-<length>` or `2XB14-<length>` (with battery).
- **S210 + 1FK2 — OCC single cable** (power + encoder + brake in one), selected by shaft height:
  - SH20 → `6FX5002-8QN04` (M12)
  - SH30 / 40 / 48 / 52 → `6FX5002-8QN08` (M17, 0.75 mm²)
  - SH63 / 80 / 100 → `6FX5002-8QN11` (M23, 1.5 mm²); long runs or derating → `8QN21` (2.5 mm²)
  - **maximum 50 m**; the S210 built-in filter only guarantees C3 up to 25 m — above that,
    flag an EMC review instead of promising compliance.
- **S120** — power `6FX5002-5DG23-…`, DRIVE-CLiQ `6FX5002-2DC10-…` (long runs) or
  `6FX2002-1DC…` (short runs).

## 4. Motor data semantics (how to read the library)

- **pn** rated power, **mn** rated (continuous) torque, **mmax** maximum torque,
  **m0** standstill torque, **nn** rated speed.
- **nmax** is the mechanical limit; **nmax_inv** is the limit imposed by the drive.
  The usable maximum speed is the **lower of the two** — never quote the mechanical
  limit as the usable speed.
- **Imax** is the motor's maximum current and is the criterion for S210 drive pairing.
- **overload** = mmax / mn, expressed as a multiple of MN.
- Brake option is a spring-applied 24 V DC holding brake — a **holding** brake, not a
  service brake. For vertical loads that must be stopped dynamically, say so explicitly.

## 5. Price policy (state this every time)

- Prices are **USD reference prices**, converted from tax-inclusive CNY reference prices
  at a fixed published rate, rounded to whole USD.
- They come from historical quotations and purchase records, not from a price list.
- **Indicative only — not an offer.** Real prices move with exchange rate, copper price,
  distributor discount, project volume and delivery terms.
- When a part has no record, and no record for the same base number, the answer is
  **"quote on request"**. Never estimate from a different rating.
- Lead time fields are historical delivery intervals, not commitments.

## 6. Data confidence

| Source | Meaning |
|---|---|
| `official` | checked line by line against the official datasheet — safe to order |
| `official-base` | main parameters from the official datasheet of the base model; options per this model's order code |
| `catalog` | Siemens catalogue value — main parameters reliable, some option details need channel confirmation |
| `third-party` | verify manually before ordering |

## 7. Limits — what this tool does not do

1. It does **model matching and order-number assembly**. It does not replace a full
   drive-train calculation: inertia match, acceleration/deceleration torque, torsional
   stiffness, thermal duty cycle, bearing life.
2. These duty points always need a human review: vertical / gravity-held loads
   (brake plus safety assessment), altitude above 1000 m or ambient above 40 °C
   (derating), explosion protection, cleanroom, strong vibration, very long stroke,
   high radial or axial load on the shaft.
3. It does not promise lead time, stock, price or discount.
4. It does not disclose purchase history, supplier terms or cost structure. The shipped
   data set contains reference prices only — no customer names, no internal codes beyond
   the one brake-resistor reference.
