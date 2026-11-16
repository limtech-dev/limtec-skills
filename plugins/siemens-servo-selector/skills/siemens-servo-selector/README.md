# Siemens Servo Selector — Agent Skill

Pick a Siemens servo motor, its SINAMICS drive and the matching cables for a duty point,
and get back **orderable part numbers** with USD reference prices and a digit-by-digit
explanation of every order number.

An [Agent Skills](https://agentskills.io) package — one `SKILL.md` plus scripts and
reference data — that runs in Claude, Codex CLI, Gemini CLI, Cursor, VS Code / Copilot,
OpenClaw, or anything that speaks MCP.

```
$ node scripts/select.js --kw=1.5 --rpm=3000 --brake=yes --top=1

### Recommendation 1 — 1FL2105-4AF (S200)

Rated 6.6 N·m / 3000 rpm / 2.1 kW · peak 25.3 N·m · max speed 6000 rpm · SH 52 ·
IP65 · 380 V · holding brake available · overload 3.5 × MN

| # | Item                                    | Order number          | Qty | Unit price (USD ref.) | Lead time |
|---|-----------------------------------------|-----------------------|-----|-----------------------|-----------|
| 1 | Servo motor 1FL2105-4AF                 | 1FL2105-4AF11-1SB0    | 1   | $1,450 (similar base) | —         |
| 2 | SINAMICS S200 servo drive (PROFINET)    | 6SL5510-1BE12-5AF0    | 1   | $1,003                | —         |
| 3 | S200 combined cable (power + encoder)   | 6FX3502-7DD01-1BA0    | 1   | $116                  | 1 week    |

Reference total: $2,569
```

## What is inside

```
siemens-servo-selector/
├── SKILL.md                    the skill itself (what the agent reads first)
├── scripts/
│   ├── select.js               CLI entry point — the authoritative calculator
│   ├── engine.js               the selection engine (identical to our production tool)
│   ├── bom_en.js               English bill-of-materials wording
│   ├── order_en.js             English order-number digit breakdown
│   └── en_terms.js             English wording for data-set values
├── references/
│   ├── selection-rules.md      the rule set: series pairing, drive criteria, cable rules, limits
│   ├── order-codes.md          digit-by-digit order-number structure for every family
│   ├── motor-library.md        160 motors with torque, speed, current, brake, IP, mass
│   ├── drives-cables.md        drive rating tables and cable families
│   ├── prices-usd.md           697 priced order numbers, USD, with price date and lead time
│   ├── servo_db.json           raw motor database
│   └── price_book_usd.json     raw price records (USD)
├── mcp/server.js               MCP server exposing select_servo + lookup_price
└── .claude-plugin/             Claude Code plugin manifest
```

**Coverage:** 160 motors — V90 / 1FL6 (19), S200 / 1FL2 (35), S200 Compact / 1FL1 (5),
S210 / 1FK2 (30), S120 / 1FK7 · 1FT7 · 1PH8 (71). Power 0.05–100 kW+.

**No dependencies.** Node 16+ for the scripts, nothing else. No `npm install`.

## Install

### Claude Code (recommended — supports updates)

```bash
/plugin marketplace add <your-github-user>/siemens-servo-selector
/plugin install siemens-servo-selector@siemens-servo-selector
```

### Claude.ai / Claude Desktop

Customize → Skills → **Upload skill** → choose `siemens-servo-selector.zip`
(the zip's root is the `siemens-servo-selector/` folder — do not re-zip the contents).

### OpenAI Codex CLI

```bash
git clone <repo> ~/.codex/skills/siemens-servo-selector
```

### Gemini CLI

```bash
git clone <repo> ~/.gemini/skills/siemens-servo-selector
```

### Cursor / VS Code / Copilot / OpenClaw

Copy the folder into the host's skills directory (for example `.cursor/skills/`,
`.github/skills/`, `.openclaw/skills/`). The `SKILL.md` frontmatter is the only contract.

### MCP hosts (Claude Desktop, ChatGPT desktop, custom agents)

```json
{
  "mcpServers": {
    "siemens-servo-selector": {
      "command": "node",
      "args": ["/absolute/path/to/siemens-servo-selector/mcp/server.js"]
    }
  }
}
```

Tools: `select_servo` (duty point → full BOM) and `lookup_price` (order number → USD
reference price).

## Web version (same tool, no install)

The same database and the same engine also run as an English web app — results on the
left, a **Lim-Tec product selector panel on the right** (servo electric cylinders
DMB/EMB/GTR/FMR · screw jacks SJA/SJB/KV/EHB/SCA/SCB · electric linear actuators
LAP/LBP/LAM/LBM):

**https://siemens-servo-selector.app.workbuddy.host/?sharecode=M75HT722U2&lang=en**

`&lang=de` for German. No access code is needed on the EN/DE interfaces; only the
Chinese UI (`&lang=zh`) asks for one.

The panel link follows the interface language: from the English page the Lim-Tec selector
opens in English (that site runs Chinese / English / German / Russian / Spanish).

Use the web page when you want dimension drawings, speed-torque curves, a PDF quote sheet
or STEP models; use the CLI / MCP tools when you want the numbers inside an agent
workflow. Both return identical order numbers — there is one engine, not two.

The `?sharecode=` parameter is required by the hosting platform (the bare domain returns
"incomplete link"); `?lang=en` makes the page open in English instead of Chinese.

## Try it

```bash
node scripts/select.js --kw=1.5 --rpm=3000 --brake=yes     # 1.5 kW, 3000 rpm, with brake
node scripts/select.js --torque=8-12 --rpm=2000-3000 --sys=S210 --enc=mt_abs --len=50
node scripts/select.js --kw=15 --rpm=2000                  # above 7 kW → 1FK7/1FT7/1PH8
node scripts/select.js --sys=S200CC --kw=0.4 --volt=220    # S200 Compact (1FL1)
node scripts/select.js --kw=1.5 --rpm=3000 --json          # machine-readable
```

Run `node scripts/select.js --help` for every option.

## Prices

USD **reference** prices converted from tax-inclusive CNY reference prices at a fixed
published rate, rounded to whole USD. They come from
historical quotations and purchase records.

They are **indicative, not an offer**. Real prices move with exchange rate, copper price,
distributor discount, project volume and delivery terms. When a part has no record, the
answer is **"quote on request"** — never an estimate from a different rating. Lead times
are historical delivery intervals, not commitments.

## How the numbers stay correct

The selection engine (`scripts/engine.js`) is the *same file* used by our production
Chinese tool. The English package adds only wording (`bom_en.js`, `order_en.js`) and
currency conversion — it never re-implements a rule. A 20-case parity test asserts that
the English and Chinese skill return identical order numbers and quantities for the same
query; the order-number breakdown re-derives each digit and suppresses itself if it ever
disagrees with the engine.

## Limits

This is a **model-matching and order-number tool**. It does not replace a full drive-train
calculation (inertia match, acceleration torque, torsional stiffness, thermal duty).
Vertical / gravity-held loads, ambient above 40 °C, altitude above 1000 m, explosion
protection, cleanrooms, strong vibration and multi-axis layouts need a human review.

## License

Data and rules © Lim-Tec (Beijing) Transmission Equipment Co., Ltd.
Free to use for evaluation, quoting and integration; the data set may not be resold as a
standalone product. See [LICENSE](LICENSE).
