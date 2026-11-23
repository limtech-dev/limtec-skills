# Changelog

## 1.0.8 — 2026-11-23

- **Sanitised release.** Every internal-review note, purchase-price derivation and
  sourcing annotation is removed from the bundled data (Chinese core v1.0.13 /
  English package v1.0.8). Selection results and order numbers are unchanged.
- Repository history reset: earlier commits are no longer reachable.
- MCP package data / engine layers re-synced with the sanitised core, so all three
  distribution channels (plugin, MCP package, ZIP) carry identical data.

## 1.0.2 — 2026-11-12

- English UI links in `SKILL.md` metadata; no access code on the EN/DE web version.
- Version numbers aligned across `SKILL.md`, `plugin.json` and `marketplace.json`
  (1.0.1 was still stamped in the manifests, which made hosts think an update had not arrived).
- Repackaged as a proper Claude Code marketplace: `plugins/<name>/skills/<name>/`.

## 1.0.1 — 2026-11-12

- Added the English web version as the primary entry point (right-hand panel links follow the UI language).
- `access_code` metadata corrected: only the Chinese UI asks for a pass code.

## 1.0.0 — 2026-11-12

- First English release. 160 motors, 697 priced order numbers, USD reference prices.
- Engine is byte-identical to the Chinese production skill; a 20-case parity test pins the order numbers.
