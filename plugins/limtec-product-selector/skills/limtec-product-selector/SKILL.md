---
name: "limtec-product-selector"
description: "Lim-Tec product selector - screw jack selector; servo electric cylinder selector; linear actuator selector. Three product lines in one engine: screw jacks (SJA, SJB, KV, EHB, SCA, SCB), servo electric cylinders (DMB, EMB, GTR, FMR) and linear actuators (LAP, LBP, LAM, LBM). Give it load, stroke, speed, unit count and layout and it returns the matched model, the full order code, the engineering checks (thrust, speed, power, stability, life, duty cycle) and a bill of materials with USD reference prices. Use for screw jack selection, electric cylinder sizing, linear actuator sizing, jack layout, synchronisation, order-code build-up and Lim-Tec price lookup. Triggers: Lim-Tec, LimTec, screw jack, electric cylinder, servo cylinder, linear actuator, actuator, jack, SJA, SJB, KV, EHB, SCA, SCB, DMB, EMB, GTR, FMR, LAP, LBP, LAM, LBM, selection, order code, price."
license: "Proprietary - (c) Lim-Tec (Beijing) Transmission Equipment Co., Ltd. Internal use by Lim-Tec channels and customers only; not for reverse engineering the catalogue or price system."
compatibility: "Claude Code and Claude Desktop with bash and file read access; Node.js 18+ required to run the selection engine."
metadata:
  version: "1.0.8"
  display_name: "Lim-Tec product selector (screw jacks / servo electric cylinders / linear actuators)"
  edition: "English"
  author: "Lim-Tec (Beijing) Transmission Equipment Co., Ltd."
  homepage: "https://cn.lim-tec.com/"
  products: "electric cylinders, screw jacks, linear actuators"
  data_source: "byte-identical to the Lim-Tec online selector (md5 in scripts/source_manifest.json)"
allowed-tools: "Bash, Read"
---

# Lim-Tec selector (screw jacks, electric cylinders, linear actuators)

One command gives the model, the order code, the checks and a priced bill of materials. The engine and the price book are **byte-identical** to the Lim-Tec online selector (md5 list in `scripts/source_manifest.json`) - this skill is an offline wrapper, not a re-implementation.

## Product lines (`--product`)

| Product line | Value | Series |
|---|---|---|
| Screw jacks (machine screw / ball screw) | `screwjack` | SJA, SJB, KV, EHB, SCA, SCB |
| Electric cylinders (servo cylinders) | `cylinder` | DMB, EMB, GTR, FMR |
| Linear actuators (rod type) | `rod` | LAP, LBP, LAM, LBM |

## Usage

```bash
# 1) Selection with a readable result (USD reference prices)
node scripts/select.js --product=cylinder --set=series=DMB --set=load=1 --set=load_unit=t \
     --set=stroke_mm=400 --set=speed_mm_s=200

# 2) Structured output for further processing
node scripts/select.js --product=screwjack --set=units=4 --set=load=8 --set=load_unit=kN \
     --set=stroke_mm=700 --set=speed_mm_s=6.25 --set=layout=h --json=result.json --quiet

# 3) What can be set on this product line (keys and defaults)
node scripts/select.js --product=screwjack --list-fields

# 4) Self-check: three built-in cases, base models SJA5 / DMB35 / LAP56
node scripts/select.js --demo

# 5) Check that no untranslated fragment is left in the output (should print none)
node scripts/select.js --product=screwjack ... --lint

# 6) Same check across every series and the no-match branches (31 duty points)
node scripts/lint_matrix.js

# 7) Word proposal + watermarked PDF (English, USD)
node scripts/make_docx.js --product=screwjack --set=units=4 --set=load=8 --set=load_unit=kN \
     --set=stroke_mm=700 --set=speed_mm_s=6.25 --set=layout=h \
     --docx=proposal.docx --pdf=proposal.pdf
```

English and Chinese option values are both accepted (`layout=h` or `layout=H型布置`), so a duty point copied from a Chinese enquiry still runs.

## Rules that must be respected

1. **Load unit.** The default unit depends on the series: most jacks and cylinders use `kN` or `t`, LAP/LBP default to `t` (tonnes), LAM defaults to `kg`. Check `--list-fields` and **repeat the unit back to the user** before naming a model. 10 (tonnes) and 10 (kN) differ by an order of magnitude - this is the most common selection error.
2. **Prices are public reference prices in USD, tax included** - converted from the Lim-Tec price book at a rate reviewed by Lim-Tec (held in `scripts/rate.js` as `USD_RATE`). Never invent a price; report "on request" lines exactly as they are.
3. **3D models (STEP) are not distributed with this skill.** Point the user to the online platform: `https://limtec-cad-models.app.workbuddy.host/?v=1030&sharecode=SOD467H7ZK`
4. **PDF proposal.** `node scripts/make_docx.js ... --docx=proposal.docx --pdf=proposal.pdf` builds the Word proposal, turns it into English and renders a watermarked PDF (Lim-Tec watermark, copyright footer). Sell in USD; the proposal is a reference document, not a binding offer.
5. **When nothing matches**, report `best` (closest candidate) and `unresolved` (the conditions that failed) and suggest relaxing a parameter or contacting sales. Never guess a model.

## Typical requests

- "1 t, 400 mm stroke, 200 mm/s electric cylinder" -> `--product=cylinder --set=series=DMB --set=load=1 --set=load_unit=t --set=stroke_mm=400 --set=speed_mm_s=200` -> model + order code + reference price.
- "Four screw jacks lifting 8 t in sync, 700 mm stroke, 6.25 mm/s, H-layout" -> `--product=screwjack --set=units=4 --set=load=8 --set=load_unit=kN --set=stroke_mm=700 --set=speed_mm_s=6.25 --set=layout=h --set=sync=mechanical`.
- "10 kN actuator, 600 mm stroke, 50 mm/s" -> `--product=rod --set=series=LAP --set=load=10 --set=load_unit=kN --set=speed=50 --set=stroke=600`.

## References

- `references/field-reference.md` - every field, its unit and its accepted values
- `references/pricing-policy.md` - where prices come from and how "on request" is handled

## Copyright

Copyright (c) Lim-Tec (Beijing) Transmission Equipment Co., Ltd. All rights reserved.
This skill is provided to Lim-Tec customers and channel partners. It must not be used to copy, reverse engineer or re-publish the Lim-Tec catalogue or price system.
