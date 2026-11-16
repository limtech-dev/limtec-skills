# Siemens servo selector — Agent Skill

Size a Siemens servo drive train from a duty point and get a **ready-to-order bill of materials**:
motor + matched drive + power / encoder / brake cable, with full Siemens order numbers, USD
reference prices and a digit-by-digit explanation of every position in the order number.

- **160 motors**: V90 / 1FL6, S200 / 1FL2, S200 Compact / 1FL1, S210 / 1FK2, S120 / 1FK7 · 1FT7 · 1PH8
- **0.05 – 100 kW**, holding brake, absolute / resolver encoders, IP65 / IP67, 50 m cable runs
- **697 priced order numbers** (USD reference prices)
- Offline. No API key, no network call, no third-party dependencies — only Node.js 16+

## Install

### claude.ai / Claude desktop

1. Settings → Capabilities → turn on **Code execution and file creation**
2. Customize → Skills → **Add** → **Upload skill**
3. Pick `dist/siemens-servo-selector_en_v1.0.4.zip` — the ZIP root is the skill folder, which is what Claude expects
4. Turn the skill on, start a new chat, ask: *"1.5 kW 3000 rpm with holding brake, quote it"*

### Claude Code

```bash
# whole marketplace (recommended — gets updates with /plugin marketplace update)
/plugin marketplace add limtech-dev/siemens-servo-selector
/plugin install siemens-servo-selector@limtec

# or a single skill, no marketplace
git clone https://github.com/limtech-dev/siemens-servo-selector.git ~/.claude/skills/siemens-servo-selector
```

### Claude API

```bash
curl https://api.anthropic.com/v1/skills \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -F "display_title=Siemens servo selector" \
  -F "files[]=@dist/siemens-servo-selector_en_v1.0.4.zip"
```

Then pass the returned `skill_id` in the request's `container.skills` alongside the code
execution tool. Up to 20 skills per request, 30 MB per upload.

### Other agents

Codex CLI reads `plugins/siemens-servo-selector/skills/siemens-servo-selector` from `.agents/skills/` or `~/.agents/skills/`;
Gemini CLI, Cursor, Copilot and any Agent Skills host can use the same folder.
An MCP server is included at `mcp/server.js` for hosts that cannot run skill scripts.

## Try it without installing

```bash
node plugins/siemens-servo-selector/skills/siemens-servo-selector/scripts/select.js --kw=1.5 --rpm=3000 --brake=yes
node plugins/siemens-servo-selector/skills/siemens-servo-selector/scripts/select.js --torque=8-12 --rpm=2000-3000 --sys=S210 --enc=mt_abs --len=50
```

## What the output looks like

`examples/` holds three verbatim runs — no editing, no formatting tricks:

- `examples/01-1.5kw-3000rpm-brake.md` — 1.5 kW, 3000 rpm, holding brake
- `examples/02-s210-8-12nm-50m.md` — 8–12 N·m on S210 with a 50 m cable run
- `examples/03-15kw-2000rpm.md` — 15 kW (above 7 kW: 1FK7 / 1FT7 / 1PH8 on S120)

## Web version

English UI: `https://siemens-servo-selector.app.workbuddy.host/?sharecode=M75HT722U2&lang=en`
German UI: same link with `&lang=de`. Both open straight into the tool, no access code.
The `?sharecode=` parameter is mandatory — the host rejects the bare domain.

## Licence

Data and selection rules © Lim-Tec (Beijing) Transmission Equipment Co., Ltd.
Free to use for evaluation and quoting. See `LICENSE`. Prices are reference values, not offers.

<!-- LIMTEC-PRODUCT-SELECTOR:BEGIN -->
## Lim-Tec product selector — screw jacks, electric cylinders, linear actuators

The second skill in this marketplace covers Lim-Tec's own product lines. Give it load, stroke,
speed, unit count and layout and it returns the matched model, the **full order code**, the
engineering checks (thrust, speed, power, stability, life, duty cycle) and a **priced bill of
materials** in USD reference prices. Proposal PDF export (English, Word layout preserved) is built in.

- **Screw jacks** — SJA, SJB, KV, EHB, SCA, SCB; single units or mechanically linked H / U sets
- **Electric cylinders** — DMB, EMB, GTR, FMR; thrust to 100 kN, strokes to 2 m
- **Linear actuators** — LAP, LBP, LAM, LBM; dampers, gates, industrial doors
- Offline. Engine and price book are byte-identical to the Lim-Tec online selector
  (`scripts/source_manifest.json`). Node.js 18+.

### Install

```bash
# whole marketplace (recommended)
/plugin marketplace add limtech-dev/limtec-skills
/plugin install limtec-product-selector@limtec

# or a single skill
git clone https://github.com/limtech-dev/limtec-skills.git ~/.claude/skills/limtec-product-selector
```

For claude.ai / Claude Desktop: upload `dist/limtec-product-selector_en_v1.0.5.zip`
(Settings → Capabilities → Skills → Upload skill).

### Try it

```bash
node plugins/limtec-product-selector/skills/limtec-product-selector/scripts/select.js --demo
node plugins/limtec-product-selector/skills/limtec-product-selector/scripts/select.js \
  --product=cylinder --set=series=DMB --set=load=1 --set=load_unit=t \
  --set=stroke_mm=400 --set=speed_mm_s=200 --set=servo_brand=V90 --set=drive=servo380
```

Verbatim runs: `examples/limtec-01-*.md`, `limtec-02-*.md`, `limtec-03-*.md`.
Product pages: <https://limtech-dev.github.io/limtec-skills/limtec/>.
<!-- LIMTEC-PRODUCT-SELECTOR:END -->
