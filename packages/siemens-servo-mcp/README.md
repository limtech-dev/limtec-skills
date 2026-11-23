# siemens-servo-mcp

MCP server for **Siemens servo motor + SINAMICS drive + cable** selection.
Give it a duty point, get a ready-to-order bill of materials with complete Siemens order
numbers, USD reference prices and a digit-by-digit order-number breakdown.

160 motors · 0.05–69 kW · V90/1FL6 · S200/1FL2 · S200 Compact/1FL1 · S210/1FK2 · S120/1FK7·1FT7·1PH8

Zero dependencies, Node.js 16+, stdio transport.

## Install

Anything that speaks MCP (Claude Desktop, Claude Code, Cursor, Windsurf, Cline, VS Code,
Gemini CLI, Codex) can launch it with:

```bash
npx -y siemens-servo-mcp
```

### Claude Code

```bash
claude mcp add siemens-servo -- npx -y siemens-servo-mcp
```

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "siemens-servo": { "command": "npx", "args": ["-y", "siemens-servo-mcp"] }
  }
}
```

### Cursor (`~/.cursor/mcp.json`) / Windsurf / Cline

```json
{
  "mcpServers": {
    "siemens-servo": { "command": "npx", "args": ["-y", "siemens-servo-mcp"] }
  }
}
```

### VS Code (`settings.json`)

```json
{
  "mcp.servers": {
    "siemens-servo": { "command": "npx", "args": ["-y", "siemens-servo-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `select_servo` | Size motor + drive + cables for a duty point; returns the BOM, prices and the order-number explanation |
| `lookup_price` | USD reference price + historical lead time for one or more order numbers |

### Example

Ask: *"1.5 kW, 3000 rpm, with holding brake — what do I order?"*

```json
{ "kw": "1.5", "rpm": "3000", "brake": "yes" }
```

Returns motor MLFB + matched drive + power/encoder/brake cable with length code, plus
reference prices and the meaning of every position in the order number.

## What the numbers mean

- **Order numbers** are real Siemens MLFB strings, resolved field by field (frame, winding,
  encoder, shaft end, brake, IP rating, cable length code).
- **Prices are USD reference values** converted from CNY tax-inclusive reference prices.
  Indicative only — not an offer. A formal quotation must come from Siemens or an authorised
  distributor. When a number is not on record the tool says *quote on request* instead of guessing.
- **Lead times** are historical intervals, not commitments.

## Needs a human look

Vertical / gravity loads, ambient above 40 °C, altitude above 1000 m, explosion protection,
and multi-axis layouts where torque sharing matters. The tool flags these but does not
replace an engineer.

## Data & licence

Motor, drive and cable data is compiled from Siemens catalogue data and engineering BOMs.
Published by Lim-Tec (Beijing) Transmission Equipment Co., Ltd. MIT licensed.
