# Cargo Platform Ops Hub — UI Design Prompt for Lovable / Figma

## Project Overview

Cross-product platform operations hub for monitoring all clients across **InDataFlow** and **AutoEvolve**. Internal tool for platform admins to manage tenants, monitor activity, review inboxes, provision new tenants, and track billing.

## Navigation Structure (Sidebar)

```
Overview     → Dashboard
Tenants      → Tenants list
Monitoring   → Activity Feed, Inbox (WhatsApp + Email tabs)
Provisioning → New Tenant (form)
Billing      → Billing Overview
```

---

## 1. Color System

Do NOT change the existing color palette. Only use these exact values:

### Light Mode
| Token              | Hex        | Usage                          |
|--------------------|------------|--------------------------------|
| `--background`     | `#F7F9FB`  | Page background                |
| `--foreground`     | `#0B1C2D`  | Body text                      |
| `--card`           | `#ffffff`  | Card / surface background      |
| `--card-foreground`| `#0B1C2D`  | Card text                      |
| `--primary`        | `#0a1929`  | Primary buttons, strong accents|
| `--secondary`      | `#1a365d`  | Secondary elements             |
| `--muted`          | `#E5E9ED`  | Subtle backgrounds             |
| `--muted-foreground`| `#5A6B7D` | Secondary text, hints          |
| `--accent`         | `#C7A14A`  | Gold accent, highlight bg      |
| `--destructive`    | `#d4183d`  | Errors, danger                 |
| `--border`         | `rgba(11, 28, 45, 0.12)` | Borders              |
| `--sidebar`        | `#0a1929`  | Sidebar nav background         |
| `--sidebar-foreground`| `rgba(255,255,255,0.9)`| Sidebar text      |
| `--sidebar-accent` | `rgba(255,255,255,0.08)` | Sidebar hover bg   |
| Primary indicator  | `#5e6ad2`  | Active tab, filters, CTA       |
| Green              | `#22c55e`  | Success, WhatsApp, positive    |
| Amber              | `#f59e0b`  | Warning, near-cap              |
| Red                | `#ef4444`  | Danger, overage, destructive    |

### Dark Mode
| Token                 | Hex        |
|-----------------------|------------|
| `--background`        | `#0a0b0d`  |
| `--foreground`        | `#f7f8f8`  |
| `--card`              | `#111318`  |
| `--card-foreground`   | `#f7f8f8`  |
| `--muted`             | `#141516`  |
| `--muted-foreground`  | `#80848f`  |
| `--accent`            | `#5e6ad2`  |
| `--border`            | `#1c1d20`  |
| `--sidebar`           | `#0c0d11`  |

---

## 2. Typography Recommendations

**Font:** Inter (300/400/500/600 weights only)

### Proposed Type Scale (professional, accessible)

| Element                   | Size      | Weight  | Tracking   | Notes                          |
|---------------------------|-----------|---------|------------|--------------------------------|
| Page title (h1)           | `text-2xl` (24px) | Bold(700)  | `-0.02em`  | Top of every page       |
| Page subtitle             | `text-sm`  (14px) | Medium(500) | normal    | `text-muted-foreground` color |
| Section card heading      | `text-xl`  (20px) | Semibold(600) | `-0.01em` | Inside card sections |
| KPI / stat primary value  | `text-3xl` (30px) | Bold(700)  | `-0.02em` | Tabular-nums for alignment |
| Inline stat label         | `text-xs`  (12px) | Semibold(600) | `+0.05em` uppercase | Under values |
| Table header              | `text-xs`  (12px) | Semibold(600) | `+0.08em` uppercase | `text-muted-foreground` |
| Table cell                | `text-sm`  (14px) | Normal(400)/Medium(500) | normal | |
| Form label                | `text-sm`  (14px) | Semibold(600) | normal | Above input |
| Form input text           | `text-sm`  (14px) | Normal(400) | normal | |
| Button text               | `text-sm`  (14px) | Semibold(600) | normal | |
| Badge / tag text          | `text-xs`  (12px) | Semibold(600) | normal | Rounded pill |
| Meta / timestamp          | `text-xs`  (12px) | Medium(500) | normal | `text-muted-foreground` |
| Sidebar nav label         | `text-xs`  (12px) | Semibold(600) | `+0.08em` uppercase | Group headers |
| Sidebar nav item          | `text-sm`  (14px) | Normal(400) / Bold(600 active) | normal | |

### Key accessibility rules
- Minimum body text: 14px (`text-sm`)
- All numeric values use `tabular-nums` for consistent width alignment
- All uppercase labels use `tracking-wider` or `tracking-widest` for readability
- Line height: 1.5 for body, 1.3 for headings
- Contrast ratio: all text on backgrounds must pass WCAG AA

---

## 3. Page-by-Page Content Reference

### 3a. Dashboard Page
**Purpose:** High-level KPI overview

**Content layout (top to bottom):**
1. Page header: "Platform Overview" + subtitle "Real-time metrics across all products and tenants"
   - Right side: Large MRR number with "MRR" label underneath
2. KPI card row (5 cards, responsive grid: 1→2→3→5 columns):
   - Each card: icon (12x12 rounded bg at 12% opacity) + huge value (30px) + label (14px)
   - KPIs: Active Tenants (#5e6ad2), Total Cargo (#22c55e), WhatsApp Messages (#22c55e), OCR Documents (#f59e0b), AI Extractions (#ef4444)
3. Tier Breakdown card:
   - Grid of 3 tier cards (starter / growth / custom)
   - Each: tier name left, count + "tenants" label right
4. Bottom stat row (2 columns):
   - ARR card: label uppercase "ANNUAL RUN RATE", value
   - Current Month card: label "CURRENT MONTH", value

### 3b. Tenants Page
**Purpose:** List all tenants with usage tracking

1. Page header: "Tenants" + subtitle "{N} total · {M} active"
2. Right stat block: large total count + "TOTAL" label
3. Full-width responsive table with columns:
   - Company (icon + name + subdomain)
   - Tier (capitalized)
   - Cargo (usage bar with used/cap numbers)
   - WhatsApp (usage bar)
   - OCR (usage bar)
   - AI (usage bar)
   - Est. Bill (right-aligned)
   - Status (colored pill badge)
4. Usage bar visual: thin 8px rounded track, filled bar with green/amber/red at 70%/90% thresholds, label on right showing "used/cap"

### 3c. Activity Feed Page
**Purpose:** Real-time merged feed of WhatsApp + email events

1. Page header: "Activity Feed" + subtitle
2. Filter pills row: All | WhatsApp (count) | Email (count)
   - Active pill: filled #5e6ad2 background, white text
   - Inactive: muted text, hover accent bg
3. Event cards list:
   - Each: channel icon (8x8 rounded bg at 20% opacity) + channel badge (uppercase tiny, same color bg at 15%) + description (bold) + client name separator
   - Below: "From: {sender}" line with doc type
   - Right side: date (shrink, no wrap)
   - Channels: WhatsApp = #22c55e, Email = #5e6ad2
4. Status colors: pending=yellow, matched=green, dismissed=gray

### 3d. Inbox Page
**Purpose:** Review and assign incoming documents per channel

1. Page header: "Inbox" + subtitle
2. Tab bar (WhatsApp | Email) with underline active indicator (#5e6ad2)
3. Item cards list:
   - Status pill (yellow=pendin-g, green=matched, gray=dismissed)
   - Doc type tag + client name
   - Description line (bold, truncate)
   - From line + container number if matched
   - Action buttons:
     - "Assign" (ExternalLink icon) — only on pending items, triggers prompt for cargo ID
     - "Dismiss" (XCircle icon) — on pending/matched, hover turns red

### 3e. New Tenant Page
**Purpose:** Provision a tenant directly to active

1. Page header: "New Tenant" + subtitle
2. Form card (2-column grid on wider screens, single column on mobile):
   - Company Name * (full width)
   - Admin Email * (full width)
   - Product (dropdown: InDataFlow / AutoEvolve)
   - Pricing Tier (dropdown: Starter $250/mo / Growth $500/mo / Custom)
   - Country
   - Currency (default USD)
   - Phone (ops notification)
   - Manager Phone (WhatsApp notification for manager)
3. Submit button: full width, #5e6ad2, text "Create Tenant"
4. Success result card (after creation):
   - Green dot + "TENANT CREATED SUCCESSFULLY" header
   - Grid of 4 detail cards: Tenant ID, Subdomain, Admin, Product
   - Magic login link with external arrow icon

### 3f. Billing Page
**Purpose:** Revenue overview and per-tenant billing table

1. Page header: "Billing Overview" + subtitle
2. Right side: large MRR number + "MRR" label
3. 3 KPI stat cards row:
   - Monthly Recurring Revenue
   - Annual Run Rate
   - Estimated Total (current month)
4. Full-width table with columns:
   - Company, Tier, Cargo Used, Cargo Cap, Usage % (with thin bar), Est. Bill (right-aligned, bold)
   - Unlimited shown for custom tier

---

## 4. Key Design Principles

1. **Responsive** — all grids collapse: 5-col → 3-col → 2-col → 1-col
2. **Tables scroll horizontally** on mobile (`overflow-x-auto`)
3. **Consistent spacing** — sections `space-y-6`, cards `p-5`, grids `gap-4`
4. **Monochromatic backgrounds** for detail cards — use `--accent` at default opacity or `5e6ad215` for icon bg
5. **Tabular numbers** on all financial figures
6. **Uppercase tracking-wider labels** on stat subtitles for scannability
7. **No color changes** — use only the color values listed in section 1
8. **Professional, clean, dense** — this is an internal ops tool, not a marketing site
9. **Light and dark mode** both use the same component structure, only CSS variable values change

---

## 5. Example Data Values

```
MRR: $2,750
ARR: $33,000
Tenants: 4 total, 3 active
Cargo: 142
WhatsApp Messages: 3,400
OCR Docs: 520
AI Extractions: 180

Tiers:
  Starter: 1 tenant ($250/mo, 30 shipment cap)
  Growth: 1 tenant ($500/mo, 100 shipment cap)
  Custom: 2 tenants (unlimited)

Sample tenant rows:
  Acme Freight Ltd (growth, 42/100 cargo, $500 est)
  Global Shipping Co (starter, 28/30 cargo, $238 est)
  East Africa Logistics (custom, 310 cargo, unlimited)
  Transit Express (starter, 0/30 cargo, pending_payment, $250 est)

Currency: USD
```

---

## 6. Tech Stack Context

- **Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS v4 (with custom `theme.css` variables via `@theme inline`)
- **Icons:** Lucide React
- **Font:** Inter (Google Fonts)
- **No component library** — all components are hand-built using Tailwind utilities
- **No CSS-in-JS** — all styles via Tailwind classes or inline `style` props using CSS variable references

---

## 7. What Needs Design / Polish

1. **KPI card layout** — current cards are simple row with icon + value + label. Consider a more polished card with subtle shadow, better icon integration, or mini sparkline areas
2. **Usage bars** — thin 8px bars work but could be more visually informative (e.g., show multiple resource types in one row)
3. **Table design** — clean but could benefit from row hover states, sticky headers, or alternating row fills
4. **Form design** — fields are basic; consider input groups, icons inside inputs, or floating labels
5. **Empty states** — all pages currently show simple "Loading…" or "No data" text; could use illustration or skeleton loading
6. **Responsive breakpoints** — tables need a card-based view on very narrow screens
7. **Success / error states** — success result on NewTenant could be a modal or slide-in panel instead of inline
8. **Filter/tab styling** — Activity filters and Inbox tabs could use more distinct active states
9. **Timestamp display** — relative timestamps ("2 min ago") would be more useful than absolute dates in Activity/Inbox
10. **Sidebar** — account for collapsed/icon-only state on narrow viewports
