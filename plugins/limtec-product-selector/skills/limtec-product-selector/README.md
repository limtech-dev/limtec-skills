# Lim-Tec Selector (English edition)

Offline selection for three Lim-Tec product lines, driven by the same engine and price book as the Lim-Tec online selector:

| Product line | `--product` | Series |
|---|---|---|
| Screw jacks | `screwjack` | SJA, SJB, KV, EHB, SCA, SCB |
| Electric cylinders | `cylinder` | DMB, EMB, GTR, FMR |
| Linear actuators | `rod` | LAP, LBP, LAM, LBM |

Give it a duty point - load, stroke, speed, number of units, layout, synchronisation - and it returns the matched model, the complete order code, the engineering checks and a bill of materials with public reference prices.

## Quick start

```bash
node scripts/select.js --product=cylinder --set=series=DMB --set=load=1 --set=load_unit=t \
     --set=stroke_mm=400 --set=speed_mm_s=200
```

```
## Lim-Tec selection - Electric Cylinders

**Selected model: DMB35**   Order code: `DMB35-10-400-FF-FM-P15-AR/GB-Siemens V90 (1FL6) ...`

Checks: Rated thrust OK | Max stroke OK | Stability OK | Life OK | Speed OK
...
| | **Total** | | | **CNY 12,512** |
```

## Self-check

```bash
node scripts/select.js --demo        # expect SJA5 / DMB35 / LAP56-V2b and "demo: 3/3 passed"
node scripts/select.js ... --lint    # expect "no untranslated fragments"
```

The three demo totals are the anchor: **CNY 7,596 / 12,512 / 12,336**. If they move, either the price book changed or the wrapper diverged from the engine.

## What is inside

| Path | Content |
|---|---|
| `scripts/select.js` | CLI: argument parsing, product adapters, English rendering |
| `scripts/en_terms.js` | English language layer (option aliases, term dictionary, residue linter) |
| `data/*.js.gz` | Product data, catalogue and price books - byte-identical to the online platform |
| `engine/*.js.gz`, `products/*.js.gz` | Selection engine - byte-identical to the online platform |
| `scripts/source_manifest.json` | md5 of every engine / data file, for provenance checks |
| `references/` | Field reference and pricing policy |

The engine is never modified: English is produced by a separate layer, so a selection made here is the same selection the online platform makes.

## Scope and limits

- **No PDF proposal in this edition.** The watermarked PDF proposal stays in the Chinese edition and in Lim-Tec sales hands. This edition returns text and JSON.
- **No STEP models.** 3D models are downloaded from the online platform, not from the package.
- **CNY only.** Reference prices are in CNY, tax included; convert with the rate of the day and say so.
- Node.js 18+ required.

## License

Copyright (c) Lim-Tec (Beijing) Transmission Equipment Co., Ltd. All rights reserved. Provided to Lim-Tec customers and channel partners; not for reverse engineering or re-publication of the catalogue or price system.
