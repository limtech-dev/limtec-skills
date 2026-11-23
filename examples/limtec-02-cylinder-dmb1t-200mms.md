# Example — DMB electric cylinder, 1 t, 400 mm stroke, 200 mm/s, V90 servo on 380 V, anti-rotation

Run from the repository root:

```bash
node plugins/limtec-product-selector/skills/limtec-product-selector/scripts/select.js --product=cylinder --set=series=DMB --set=load=1 --set=load_unit=t --set=stroke_mm=400 --set=speed_mm_s=200 --set=input_form=P10/P20 --set=install=FF --set=joint=FM --set=servo_brand=V90 --set=drive=servo380 --set=accessories=AR
```

Output, verbatim (nothing edited):

```markdown
## Lim-Tec selection - Electric Cylinders

**Selected model: DMB35**   Order code: `DMB35-10-400-FF-FM-P15-AR/GB-Siemens V90 (1FL6) 1FL6092 (1FL6092-1AC61)`

Specification: Body (DMB35, stroke 400 mm mapped to the 500 mm standard step)

Checks: Rated thrust OK | Max stroke OK | Stability OK | Life OK | Speed OK

Calculated: total_power_kW=3.27, motor_torque_Nm=15.61, effective_load_kN=9.81, life_km=528, stability_Lk_mm=766

### Bill of materials (public reference prices)

| # | Item | Qty | Unit price | Amount |
|---|---|---|---|---|
| 1 | Body (DMB35, stroke 400 mm mapped to the 500 mm standard step) | 1 | USD 1,727 | USD 1,727 |
| 2 | Mounting FF | 1 | USD 47 | USD 47 |
| 3 | Input form P10/P15/P20, parallel timing-belt drive | 1 | USD 101 | USD 101 |
| 4 | AC servo motor + drive<br>Siemens 1FL6092 (1FL6092-1AC61) / power 3.5 kW (kit price on request) | 1 | on request | - |
| 5 | Quotation required: accessory AR | 1 | on request | - |
| | **Total** | | | **USD 1,875** |

Priced on request: AC servo motor + drive; Quotation required: accessory AR

> Prices are public reference prices, tax included, shown in USD converted at 1 USD = 6.6726 CNY (rate of 2026-11-15), identical to the Lim-Tec online selector. They are indicative only - a binding quotation in USD is issued by Lim-Tec.
> 3D models and the online version: https://limtec-cad-models.app.workbuddy.host/?v=1030&sharecode=SOD467H7ZK
```

Prices are USD reference values, not offers.
