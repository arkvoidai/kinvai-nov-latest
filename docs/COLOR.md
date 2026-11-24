# Kinvai Colour System & WCAG 2.1 Contrast Audit ("Porcelain and Pop")

Light theme only. Flat layered surfaces, hairline borders, and disciplined collection tints. No gradients on surfaces, no neon, and `--brand` (`#FF5B1F`) never fills a large surface or sets body text.

## Core Tokens & Tonal Scales

| Token | Hex | Role |
| :--- | :--- | :--- |
| `--page` | `#F4F2EE` | Porcelain canvas |
| `--page-50` | `#FAF9F7` | Lifted whisper neutral |
| `--surface` | `#FFFFFF` | Raised tile and input surface |
| `--stone` | `#EDEAE5` | Soft grey tiles, chips, cocoa collection fallback |
| `--line` | `#E3DFD8` | 1px hairline borders |
| `--line-strong` | `#CEC8BE` | Emphasized borders and control outlines |
| `--ink` | `#111111` | Primary text, primary buttons, dark price bar, inverted footer |
| `--ink-2` | `#55524D` | Secondary body text |
| `--ink-3` | `#8A867F` | Captions and muted meta only (never body text) |
| `--brand` | `#FF5B1F` | Persimmon dot, focus ring, small graphical accents (never body text) |
| `--brand-deep` | `#C93A0A` | Brand-coloured text and inline links (WCAG AA on white) |
| `--peach` | `#FFD9C4` | Collection tint (`apricot` — Run the Shop) |
| `--butter` | `#FFEFA8` | Collection tint (`butter` — Make the Thing) |
| `--lilac` | `#DDD3FF` | Collection tint (`lilac` — Build the World) |
| `--rose` | `#FFD3DE` | Collection tint (`rose` — Ship the Interface) |
| `--success` | `#1E7A4F` | Positive semantic state (small accents + text) |
| `--warning` | `#B7791F` | Caution semantic state (paired with label/icon) |
| `--error` | `#C42B2B` | Destructive / error state (paired with label/icon) |

## WCAG 2.1 Contrast Verification Table

Calculated using exact sRGB relative luminance (`src/lib/contrast.ts`) and verified in automated unit tests (`src/lib/data/repository.test.ts`).

| Foreground | Background | Ratio | WCAG Grade | Permitted Usage |
| :--- | :--- | :---: | :---: | :--- |
| `--ink` `#111111` | `--surface` `#FFFFFF` | **18.88 : 1** | AAA | Body text, headlines, price tags, secondary buttons |
| `--ink` `#111111` | `--page` `#F4F2EE` | **16.89 : 1** | AAA | Page headlines, body copy on porcelain canvas |
| `--ink` `#111111` | `--stone` `#EDEAE5` | **15.74 : 1** | AAA | Text on chips, stone tiles, cocoa collection tiles |
| `--ink-2` `#55524D` | `--surface` `#FFFFFF` | **7.78 : 1** | AAA | Secondary descriptions, metadata on white tiles |
| `--ink-2` `#55524D` | `--page` `#F4F2EE` | **6.96 : 1** | AA | Secondary copy on porcelain page |
| `--ink-2` `#55524D` | `--stone` `#EDEAE5` | **6.48 : 1** | AA | Secondary copy on stone tiles |
| `--ink-3` `#8A867F` | `--surface` `#FFFFFF` | **3.62 : 1** | AA Large | Captions, placeholders, non-body decorative labels only |
| `--ink-3` `#8A867F` | `--page` `#F4F2EE` | **3.24 : 1** | AA Large | Captions only (never body text per Charter 7b) |
| `--brand-deep` `#C93A0A` | `--surface` `#FFFFFF` | **5.13 : 1** | AA | Brand-coloured text links and labels on white |
| `--brand-deep` `#C93A0A` | `--page` `#F4F2EE` | **4.59 : 1** | AA | Brand-coloured text links on porcelain page |
| `--brand` `#FF5B1F` | `--surface` `#FFFFFF` | **3.10 : 1** | AA Large / UI | Brand dot, focus ring (3:1 UI component pass), never body copy |
| `--page` `#F4F2EE` | `--ink` `#111111` | **16.89 : 1** | AAA | Inverted dark footer, primary buttons, dark price bar |
| `#FFFFFF` | `--ink` `#111111` | **18.88 : 1** | AAA | Primary button labels, active chip labels |
| `--ink` `#111111` | `--peach` `#FFD9C4` | **14.36 : 1** | AAA | Text & icons on apricot/peach collection tiles |
| `--ink` `#111111` | `--butter` `#FFEFA8` | **16.33 : 1** | AAA | Text & icons on butter collection tiles |
| `--ink` `#111111` | `--lilac` `#DDD3FF` | **13.34 : 1** | AAA | Text & icons on lilac collection tiles |
| `--ink` `#111111` | `--rose` `#FFD3DE` | **14.05 : 1** | AAA | Text & icons on rose collection tiles |
| `--success` `#1E7A4F` | `--surface` `#FFFFFF` | **5.31 : 1** | AA | Success feedback messages on white |
| `--error` `#C42B2B` | `--surface` `#FFFFFF` | **5.63 : 1** | AA | Error messages and validation feedback on white |
| `--warning` `#B7791F` | `--surface` `#FFFFFF` | **3.64 : 1** | AA Large | Warning icons + large labels; pair with `--ink` text inside `--warning-bg` |

## Enforcement Rules

1. Never set body copy in `--ink-3` or `--brand`. Use `--ink` or `--ink-2`.
2. Brand-coloured text always uses `--brand-deep` (`#C93A0A`), never `--brand` (`#FF5B1F`).
3. Collection accent mapping is strict: `apricot -> peach`, `butter -> butter`, `lilac -> lilac`, `rose -> rose`, `cocoa -> stone`.
4. Semantic states always pair colour with an icon or explicit label.
