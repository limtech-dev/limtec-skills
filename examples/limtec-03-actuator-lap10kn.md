# Example — LAP linear actuator, 10 kN, 600 mm stroke, 50 mm/s, AC motor drive

Run from the repository root:

```bash
node plugins/limtec-product-selector/skills/limtec-product-selector/scripts/select.js --product=rod --set=series=LAP --set=load=10 --set=load_unit=kN --set=speed=50 --set=stroke=600 --set=drive=ac3
```

Output, verbatim (nothing edited):

```markdown
## Lim-Tec selection - Linear Actuators

**Selected model: LAP56-V2b**   Order code: `LAP56 V2 600 ROE FCP P3 RH AC3 1.5kW 1400rpm 380V 50Hz BRE`

Checks: Thrust OK | Stroke OK | Speed OK | Stability OK | Duty cycle OK | Life ?

Calculated: rated_kN=15, speed_mm_s=46, stability_Lk_mm=1400

### Bill of materials (public reference prices)

| # | Item | Qty | Unit price | Amount |
|---|---|---|---|---|
| 1 | Input form P3 (P3 single motor flange input) | 1 | USD 1,598 | USD 1,598 |
| 2 | Standard trapezoidal screw, 600 mm (6 x 100 mm) | 1 | USD 108 | USD 108 |
| 3 | Joint ROE | 1 | USD 0 | USD 0 |
| 4 | Limit switch FCP (proximity limit switch) | 1 | USD 142 | USD 142 |
| | **Total** | | | **USD 1,849** |

> Prices are public reference prices, tax included, quoted in USD (converted from the Lim-Tec list price at a rate reviewed by Lim-Tec), identical to the Lim-Tec online selector. They are indicative only - a binding quotation in USD is issued by Lim-Tec.
> 3D models and the online version: https://limtec-cad-models.app.workbuddy.host/?v=1030&sharecode=SOD467H7ZK
```

Prices are USD reference values, not offers.
