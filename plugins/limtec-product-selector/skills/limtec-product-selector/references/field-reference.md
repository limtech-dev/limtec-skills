# Field reference

All three product lines are driven by `--set key=value` pairs. Keys are identical to the online selector, so a project exported from the web tool can be re-run here unchanged.

`node scripts/select.js --product=<line> --list-fields` prints the live default set for that line - treat that output as authoritative, this file is the human-readable map.

## Shared fields

| Key | Meaning | Notes |
|---|---|---|
| `load` | Working load (push) | Unit follows `load_unit` |
| `load_pull` | Pull load | Only when the duty point pulls |
| `static_load` | Static / holding load | Used for the stability and static checks |
| `load_unit` | `kN`, `t`, `kg`, `N`, `kgf` | **Defaults differ per series** - see the warning below |
| `stroke_mm` (`rod`: `stroke`) | Travel | Rounded up to the standard step, the chosen step is reported |
| `speed_mm_s` (`rod`: `speed`) | Output speed | mm/s |
| `units` | Number of units driven together | Drives torque sharing and quantity |
| `layout` | Layout of a multi-unit group | `h`, `u`, `u2` (or the Chinese names) |
| `sync` | `mechanical` or `electrical` | Mechanical shares one motor through gearboxes |
| `drive` | `ac3`, `servo220`, `servo380`, `hand` | `hand` = no motor priced |
| `servo_brand` | Motor brand / platform, repeatable | e.g. `V90`, `S200`, `S210`, `S120`, `Delta`, `Inovance` |
| `guide` | `yes` / `no` - customer supplies guiding | Affects the stability check |
| `env` | `indoor`, `outdoor`, `cleanroom` | Derates the load |
| `cycles_per_day`, `hours_per_day`, `days_per_year` | Duty profile | Feeds the life calculation |
| `life_years` | Required life in years | Cylinder and jack lines |
| `special` | Special requirements, repeatable | e.g. `防爆`, `防腐`, `真空` |
| `accessories` | Accessory codes, repeatable | e.g. `AR` (anti-rotation) |

## Screw jacks (`screwjack`)

| Key | Meaning | Default |
|---|---|---|
| `series` | `SJA`, `SJB`, `KV`, `EHB`, `SCA`, `SCB`, `auto` | `SJA` |
| `motion` | `S` rotating screw / `N` translating nut | `S` |
| `kv_mode` | `KVL` foot mount / `KVK` trunnion (KV series) | `KVL` |
| `mounting` | `floor` (foot) / `trunnion` | floor |
| `precision_mm` | Repeatability requirement, `none` if not specified | `none` |
| `selflock` | `yes` / `no` - is self-locking required | `no` |
| `input_type` | `P1` single input shaft, `P2` double input shaft | `P1` |
| `shaft_dir` | `RH` / `LH` | `RH` |
| `joint` | `std` (flange end), `FM` external thread, … | `std` |
| `platform_L`, `platform_W` | Platform size for multi-jack synchronisation | - |

## Electric cylinders (`cylinder`)

| Key | Meaning | Default |
|---|---|---|
| `series` | `DMB`, `EMB`, `GTR`, `FMR` | `DMB` |
| `input_form` | `P10/P20`, `P15`, … belt or direct input | `P10/P20` |
| `install` | `FF` front flange, `FM` external thread, … | `FF` |
| `joint` | `FM`, `ROE`, … | `FM` |
| `encoder` | `incremental`, `absolute`, `resolver` | incremental |
| `ip` | Protection class | `IP65` |
| `gtr_drive`, `gtr_fb` | GTR integrated drive platform and feedback | - |

## Linear actuators (`rod`)

| Key | Meaning | Default |
|---|---|---|
| `series` | `LAP`, `LBP`, `LAM`, `LBM` | `LAP` |
| `install` | `P3` single motor flange, … | `P3` |
| `input_dir` | `RH` / `LH` | `RH` |
| `joint` | `ROE`, … | `ROE` |
| `limit_sw` | `STD` or `FCP` proximity switch | `STD` |
| `lam_*` | LAM build-up digits (voltage, ends, angle, limit switch, signal, plug, cable, IP) | see `--list-fields` |
| `lam2_*` | LAM options (feedback, bracket, controller, shell, IP, limit switch, screw) | see `--list-fields` |

## Warning: the load unit differs by series

`load_unit` defaults are **not** uniform: SJA/SJB and most cylinders default to `t`, LAP/LBP default to `t`, LAM defaults to `kg`. Passing 10 in tonnes where kN was meant (or the reverse) gives a model one frame size off, which is why the result always echoes the resolved unit back. Read `input_en.load_unit` in the JSON before you quote anything.
