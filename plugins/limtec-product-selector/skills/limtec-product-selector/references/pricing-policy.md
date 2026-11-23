# Pricing policy

## What the numbers are

Prices come from the same price book the Lim-Tec online selector uses (`data/pricebook-*.js.gz`), which is derived from Lim-Tec transaction records and the 2026 standard quotation templates.

- Currency: **CNY**, tax included.
- Status: **public reference price**. It is the price a Lim-Tec channel partner can show a customer, not a Siemens-style list price and not a binding offer.
- A binding quotation is issued by Lim-Tec (Beijing) Transmission Equipment Co., Ltd. after the technical agreement is signed.

## How "on request" is produced

A line is reported as `on request` / `Quotation required` when:

1. The part exists in the catalogue but no price is recorded for that combination.
2. The part is a non-standard item (custom lead, special coating, explosion-proof execution).
3. The motor + drive combination has no kit price for the selected brand.

These lines are listed again under `quote.missing` in the JSON and under "Priced on request" in the text output. **Report them as they are - never interpolate, estimate or copy a neighbouring price.**

## Currency conversion

The engine returns CNY only. If a customer needs another currency, convert the printed total with the rate of the day and say so explicitly ("converted at x.xx on <date>, indicative"). Do not store or bake a conversion rate into this skill.

## Discounts

Volume, project and OEM discounts are commercial decisions and are not part of this skill. Never apply a discount factor to the reference price.
