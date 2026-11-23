# limtec-product-mcp

MCP (Model Context Protocol) server for **Lim-Tec product selection**:
screw jacks (SJA / SJB / KV / EHB / SCA / SCB), servo electric cylinders
(DMB / EMB / GTR / FMR) and linear actuators (LAP / LBP / LAM / LBM).

Given a duty point (load, stroke, speed, unit count, layout), the
`select_limtec` tool returns the matched model, the full order code,
engineering checks (thrust, speed, power, stability, life, duty cycle) and
public reference prices in **CNY** with an official **USD** conversion at a
fixed published rate (rate and date included in every result — e.g.
`USD 1,227 at 1 USD = 6.6726 CNY, 2026-11-15`). The rate is reviewed by
Lim-Tec and updated with each release.

The selection engine is **byte-identical** to the Lim-Tec online selector —
this package is an offline MCP wrapper, not a re-implementation.

## Install

No install needed — run directly with npx:

```bash
npx limtec-product-mcp
```

Or add it to your MCP client configuration:

```json
{
  "mcpServers": {
    "limtec-product-mcp": {
      "command": "npx",
      "args": ["limtec-product-mcp"]
    }
  }
}
```

Works in Claude Code, Claude Desktop, Cursor, Codex CLI, Cline, Windsurf and
any MCP-compatible client.

## Tools

### `select_limtec`

| Parameter | Type | Description |
|---|---|---|
| `product` | `screwjack` \| `cylinder` \| `rod` | product line (required) |
| `sets` | string[] | parameters, items like `"key=value"`, e.g. `["series=DMB","load=1","load_unit=t","stroke_mm=400","speed_mm_s=200"]` |
| `list_fields` | boolean | if `true`, return all fields and defaults for the product line instead of selecting |

Note on units: LAP / LBP default to tonnes, LAM to kilograms.

Example call:

```json
{
  "product": "cylinder",
  "sets": ["series=DMB", "load=1", "load_unit=t", "stroke_mm=400", "speed_mm_s=200"]
}
```

## Requirements

Node.js 16 or newer. No network access, no API key, no third-party
dependencies.

## License

Data and selection rules © Lim-Tec (Beijing) Transmission Equipment Co., Ltd.
Freely usable for evaluation, engineering selection and quoting through MCP
clients; not for resale of the data set. See LICENSE.
