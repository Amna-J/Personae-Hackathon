# Personae — Desert Sage Design System

## Overview

The design system uses a **Desert Sage** palette with two operating modes:

| Mode | Usage | Data attribute |
|------|-------|----------------|
| **Linen** | Light marketing pages (home, blogs) | _(default)_ |
| **Earthen** | Dark app pages (analysis, chat, auth, results) | `data-theme="earthen"` |

`App.jsx` wraps every earthen route with `<div data-theme="earthen">` via the `E` helper component. The Navbar and Footer are outside that wrapper and always render in linen mode.

---

## Palette

### Core tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `--sage-deep` | `#3D4A3D` | Footer background |
| `--sage` | `#5C6B5C` | Secondary accents, avatar |
| `--sage-soft` | `#8A9A8A` | Eyebrow labels, earthen subtext |
| `--espresso` | `#4A3F35` | Primary dark background (earthen pages) |
| `--espresso-soft` | `#6B5D4F` | Linen body text, card backgrounds |
| `--taupe` | `#B8A88A` | Step numbers, connector lines, secondary labels |
| `--taupe-light` | `#D4C7AC` | Icon backgrounds, testimonial section bg |
| `--cream` | `#E8D5B7` | Earthen body text |
| `--canvas` | `#F5EDE0` | Page background (linen), Navbar, Auth right panel |
| `--terracotta-soft` | `#E5B5A0` | Emphasis, italic text, stats |
| `--terracotta` | `#D08770` | Primary CTA buttons, focus rings |
| `--terracotta-deep` | `#A8654F` | Button hover states |

### Semantic state tokens

| Token | Usage |
|-------|-------|
| `--state-success-accent` | Success borders/icons (`#7A8C5C`) |
| `--state-warning-accent` | Warning borders/icons — DisclaimerPanel (`#C9A05C`) |
| `--state-error-accent` | Error borders/icons (`#B86450`) |
| `--state-info-accent` | Info borders/icons (`#5C7A82`) |

### Body shape colors

| Shape | Hex |
|-------|-----|
| Hourglass | `#A86B5C` |
| Apple | `#7A8C5C` |
| Pear | `#C9A05C` |
| Rectangle | `#A89478` |
| Inverted Triangle | `#7A6B82` |
| Diamond | `#5C7A82` |

---

## Shadows

| Token | Usage |
|-------|-------|
| `--shadow-card` | Linen surface cards |
| `--shadow-modal` | Linen modals, elevated cards |
| `--shadow-dark-card` | Earthen surface cards |
| `--shadow-dark-modal` | Earthen modals, hover states |

**No glow effects.** All `box-shadow` values use clean elevation, never color-tinted glows.

---

## Mode-aware aliases

These CSS vars resolve differently per mode:

| Alias | Linen | Earthen |
|-------|-------|---------|
| `--bg-page` | `var(--canvas)` | `var(--espresso)` |
| `--bg-surface` | `#ffffff` | `var(--espresso-soft)` |
| `--text-primary` | `var(--espresso)` | `var(--canvas)` |
| `--text-secondary` | `var(--espresso-soft)` | `var(--cream)` |
| `--border-subtle` | `rgba(184,168,138,0.25)` | `rgba(184,168,138,0.2)` |

---

## Components

### Button variants

| Variant | Background | Text |
|---------|-----------|------|
| `primary` | `var(--terracotta)` | `var(--espresso)` |
| `secondary` | transparent | `var(--sage)` |
| `secondary-earthen` | transparent | `var(--cream)` |

### AnalysisCard themes

| Route | Tag | Color token |
|-------|-----|-------------|
| `/skin-tone` | Complexion | `--terracotta` |
| `/under-tone` | Color Theory | `--sage-soft` |
| `/body-type` | Silhouette | `--terracotta-soft` |
| `/face-shape` | Structure | `--taupe` |

---

## Rules

1. **No hardcoded hex values** in components — always use CSS custom properties.
2. **No glow effects** — `box-shadow` only for elevation, never color-tinted.
3. **WCAG AA contrast** on all text/background pairings.
4. **Navbar** always uses `var(--canvas)` background regardless of page mode.
5. **Footer** always uses `var(--sage-deep)` background regardless of page mode.
6. The `E` wrapper in `App.jsx` is the single source of mode assignment — do not add `data-theme="earthen"` inside individual page components.
