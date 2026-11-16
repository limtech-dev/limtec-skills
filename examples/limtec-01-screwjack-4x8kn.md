# Example — 4 screw jacks, 8 kN each, 700 mm, 6.25 mm/s, H layout, mechanical sync, servo drive

Run from the repository root:

```bash
node plugins/limtec-product-selector/skills/limtec-product-selector/scripts/select.js --product=screwjack --set=units=4 --set=load=8 --set=load_unit=kN --set=stroke_mm=700 --set=speed_mm_s=6.25 --set=layout=h --set=motion=S --set=guide=yes --set=env=indoor --set=sync=mechanical --set=drive=servo220 --set=series=auto
```

Output, verbatim (nothing edited):

```markdown
## Lim-Tec selection - Screw Jacks

**Selected model: SJA5**   Order code: `SJA5-S-L1-700-FL-P2-AR/FCP`

Specification: rated push/pull force 5 kN; rated dynamic load 5 kN; screw type: trapezoidal screw; L1 step: ratio 1:16, travel per revolution 0.25 mm, max input power 0.15 kW; efficiency starting η=0.16, running η=0.25; joint: flange end FL; accessory: anti-rotation

Checks: Max input power OK | Speed OK | Input speed OK | Stability OK | Push/pull force OK | Duty cycle OK | Static load OK

Calculated: total_power_kW=0.48, motor_torque_Nm=1.5, motor_demand_kW=0.48, effective_load_kN=2, p_in_kW=0.05, env_coef=1

### Bill of materials (public reference prices)

| # | Item | Qty | Unit price | Amount |
|---|---|---|---|---|
| 1 | Lim-Tec trapezoidal screw jack SJA5-S-L1-700-FL-P2-AR/FCP (with proximity limit switch FCP, group stroke control)<br>rated push/pull force 5 kN; rated dynamic load 5 kN; screw type: trapezoidal screw; L1 step: ratio 1:16, travel per revolution 0.25 mm, max input power 0.15 kW; efficiency starting ... | 1 | on request | - |
| 2 | Lim-Tec trapezoidal screw jack SJA5-S-L1-700-FL-P2-AR (standard P2 double input shaft)<br>rated push/pull force 5 kN; rated dynamic load 5 kN; screw type: trapezoidal screw; L1 step: ratio 1:16, travel per revolution 0.25 mm, max input power 0.15 kW; efficiency starting ... | 3 | on request | - |
| 3 | Motor-integrated gearbox RSD090/2 (ratio 1:2, RS standard)<br>from motor rated torque 2.4Nm×gear ratio 2=5Nm (input speed 3000rpm), not exceeding catalogue page p141 permissible output torque, select frame size; upsized for integrated mountin ... | 1 | on request | - |
| 4 | Gearbox RSD065/1 (ratio 1:1)<br>half of the motor-side gearbox torque, approx. 2Nm select frame size (not exceeding catalogue page p141 permissible output torque; input speed 1500rpm) | 2 | on request | - |
| 5 | Drive shaft<br>Shaft length to be confirmed against the customer platform dimensions | 6 | on request | - |
| 6 | Coupling<br>2 per drive shaft (12 in total), matched to the jack worm input shaft and drive shaft | 12 | on request | - |
| 7 | AC servo motor + drive, 0.75 kW<br>Siemens V90 (1FL6) 1FL6042 (1FL6042-2AF21); power 0.75 kW; rated speed 3000 rpm; rated torque 2.4 N·m; frame 40 (shaft height); 220VAC; drive SINAMICS V90 6SL3210-5FB10-8UF0 (220V) ... | 1 | on request | - |
| 8 | AC servo motor + drive<br>Siemens V90 (1FL6) 1FL6042 (1FL6042-2AF21) / power 0.75 kW / rated speed 3000 rpm / drive SINAMICS V90 6SL3210-5FB10-8UF0 (220V); kit accessories: power/encoder cable (length to su ... | 1 | USD 1,138 | USD 1,138 |
| | **Total** | | | **USD 1,138** |

Priced on request: Lim-Tec trapezoidal screw jack SJA5-S-L1; Lim-Tec trapezoidal screw jack SJA5-S-L1; Motor-integrated gearbox RSD090/2 (ratio; Gearbox RSD065/1 (ratio 1:1); Drive shaft; Coupling; AC servo motor + drive, 0.75 kW

Layout drawing: 四台机械同步螺旋升降机H型布置.png

### Notes
- Brake recommendation: V1 the worm gear is not self-locking, the standard trapezoidal screw is not self-locking, a motor brake is recommended; a custom shorter lead can make the standard trapezoidal screw self-locking (custom leads must be confirmed with a Lim-Tec engineer)
- Brake recommendation: L1 the worm gear is self-locking, a motor brake is not required (add one if the customer wants redundancy)
- Brake recommendation: SJA100-1000 the standard trapezoidal screw is self-locking, V1/L1 self-locking in both L1 and V1, a motor brake is not required (add one if the customer wants redundancy)
- (12 more notes in the JSON output - same message, other candidate duty points)

> Prices are public reference prices, tax included, shown in USD converted at 1 USD = 6.6726 CNY (rate of 2026-11-15), identical to the Lim-Tec online selector. They are indicative only - a binding quotation in USD is issued by Lim-Tec.
> 3D models and the online version: https://limtec-cad-models.app.workbuddy.host/?v=1030&sharecode=SOD467H7ZK
```

Prices are USD reference values, not offers.
