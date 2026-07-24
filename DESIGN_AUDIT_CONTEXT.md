# DESIGN AUDIT CONTEXT

## 1. Project Snapshot

### Framework / Stack
- **Framework:** Angular 21 (standalone components, signals)
- **Rendering:** CSR with Angular SSR (`@angular/ssr` v21) — Express server
- **Language:** TypeScript 5.9
- **Package Manager:** npm 11.6
- **Build:** `@angular/build` v21 (Application builder, Vite/esbuild)

### Styling Approach
- **Primary:** SCSS (Angular component-scoped via `styleUrl`)
- **Secondary:** Tailwind CSS v4 (`styles.css` imports `tailwindcss`) — used sparingly
- **CDK/Material:** `@angular/material` v21 + `@angular/cdk` v21 (used for tabs, spinner, button in PDP only)
- **Icons:** `@lucide/angular` v1.26

### UI Component Library
- **100% custom** — no shadcn/MUI/Chakra/Ant Design
- Shared UI components at `src/app/shared/ui/` (14 components)
  - `badge`, `button`, `card`, `chip`, `confirmation-dialog`, `dropdown`, `empty-state`, `error-state`, `loader`, `pagination`, `product-card`, `product-section`, `search-input`, `skeleton`

### Folder Structure (UI-relevant)
```
src/
  scss/
    _tokens.scss          ← Legacy token file (118 CSS vars)
    _colors.scss          ← Color utility classes (.text-primary, .bg-page, etc.)
    _typography.scss      ← Typography mixins (@include heading-1, body-md, etc.)
    _spacing.scss         ← Spacing utility classes (.mt-4, .p-6, etc.)
    _mixins.scss          ← Breakpoint mixins + common patterns
    _layout.scss          ← Layout utility classes (.container, .flex-center, etc.)
    _section.scss         ← Section component utility classes
    _animations.scss      ← Keyframe animations
    _theme.scss           ← Theme transition rules
    _showcase.scss        ← Showcase card accent tokens
    _variables.scss       ← Legacy SCSS variables (old system)
    theme/
      _colors.tokens.scss     ← New color token set
      _spacing.tokens.scss    ← New spacing tokens
      _typography.tokens.scss ← New typography tokens
      _radius.tokens.scss     ← New radius tokens
      _elevation.tokens.scss  ← New elevation tokens
      _motion.tokens.scss     ← New motion tokens
      _breakpoints.tokens.scss← New breakpoint tokens
    themes/
      _light.scss         ← Light theme override (empty — defers to :root)
      _dark.scss          ← Dark theme override (full variable set)
      _luxury.scss        ← Luxury theme
      _electronics.scss   ← Electronics theme
      _fashion.scss       ← Fashion theme
  app/
    core/layout/            ← Header, footer, sidebar, page-container, layouts
    features/               ← account, admin, cart, checkout, errors, home, products, wishlist
    shared/ui/              ← 14 reusable components
    shared/patterns/        ← rating-stars
    shared/mock/            ← Mock product data
```

### Key Style Dependencies (package.json)
```json
"@angular/material": "^21.0.3",
"@angular/cdk": "^21.0.3",
"@lucide/angular": "^1.26.0",
"tailwindcss": "^4.3.3",
"@tailwindcss/postcss": "^4.3.3"
```

---

## 2. Color System Audit

### Where Colors Are Defined

| File | Type | Role |
|------|------|------|
| `src/scss/theme/_colors.tokens.scss` | CSS vars (`:root`) | **Primary color token file** — page bg, card bg, text, accent, borders, stars, shadows |
| `src/scss/_tokens.scss` | CSS vars (`:root`) | **Legacy alias tokens** — maps `--surface-page` to `--color-bg-page` via indirection, also defines radii, shadows, spacing, typography, z-index, transitions |
| `src/scss/themes/_dark.scss` | CSS vars (`[data-theme='dark']`) | Dark overrides for surfaces, text, borders, shadows, accent, semantic colors |
| `src/scss/themes/_luxury.scss` | CSS vars (`[data-theme='luxury']`) | Luxury overrides |
| `src/scss/themes/_electronics.scss` | CSS vars (`[data-theme='electronics']`) | Electronics overrides |
| `src/scss/themes/_fashion.scss` | CSS vars (`[data-theme='fashion']`) | Fashion overrides |
| `src/scss/_showcase.scss` | CSS vars (`:root`) | Showcase variant accent colors (blue, pink, orange, teal, purple) |
| `src/scss/_variables.scss` | SCSS variables (`$color-*`) | **Legacy SCSS variables** — used by hero, cart, clips-section, footer, auth-layout |

### Palette Definition Files (full content)

**`src/scss/theme/_colors.tokens.scss`:**
```scss
:root {
  --color-bg-page: #F3F4F8;
  --color-bg-card: #FFFFFF;
  --color-bg-muted: #EBEDF3;
  --color-bg-elevated: #F7F8FB;
  --color-bg-glass: rgba(255, 255, 255, 0.85);

  --color-text-primary: #12141C;
  --color-text-secondary: #676E80;
  --color-text-muted: #9AA0B2;
  --color-text-disabled: #C4C8D6;
  --color-text-inverse: #FFFFFF;
  --color-text-link: #4A63E8;

  --color-accent: #4A63E8;
  --color-accent-hover: #3A50D1;
  --color-accent-light: rgba(74, 99, 232, 0.08);
  --color-accent-strong: #3A50D1;

  --color-success: #0F9D6B;
  --color-success-light: rgba(15, 157, 107, 0.10);
  --color-warning: #F5A524;
  --color-warning-light: rgba(245, 165, 36, 0.12);
  --color-danger: #E8484A;
  --color-danger-light: rgba(232, 72, 74, 0.10);

  --color-primary: #12141C;
  --color-primary-hover: #1E2030;

  --color-border: #E6E8F0;
  --color-border-light: #EEF0F6;
  --color-border-focus: #4A63E8;

  --color-overlay: rgba(18, 20, 28, 0.5);
  --color-wishlist: #E8484A;

  --color-star: #F5A524;
  --color-star-empty: #E3E5EE;

  --shadow-card: 0 1px 2px rgba(20, 24, 40, 0.04), 0 8px 24px -8px rgba(20, 24, 40, 0.10);
  --shadow-card-hover: 0 1px 2px rgba(20, 24, 40, 0.06), 0 20px 40px -12px rgba(20, 24, 40, 0.16), 0 0 0 1px rgba(74, 99, 232, 0.08);
}
```

**`src/scss/_tokens.scss` (legacy alias layer):**
```scss
:root {
  --color-primary:       #12141C;
  --color-accent:        #4A63E8;
  --bg-page:              var(--surface-page);
  --bg-surface:           var(--surface-card);
  --surface-page:        #F3F4F8;
  --surface-card:        #FFFFFF;
  --text-primary:        #12141C;
  --text-secondary:      #676E80;
  --border-color:        #E6E8F0;
  // ... also defines radius, shadow, spacing, typography, z-index, transition tokens
}
```

**`src/scss/themes/_dark.scss` (full dark override, 61 lines):**
```scss
[data-theme='dark'] {
  color-scheme: dark;
  --surface-page:        #0A0E17;
  --surface-card:        #121828;
  --text-primary:        #F1F3F9;
  --text-secondary:      #8D96AC;
  --border-color:        #232B40;
  --color-accent:        #6C8CFF;
  --color-success:       #3DD9A4;
  --color-danger:        #F87171;
  --color-star:          #FFC24B;
  --color-star-empty:    #2E3550;
  // + shadows, light variants, etc.
}
```

**`src/scss/_variables.scss` (legacy SCSS variables — separate system):**
```scss
$color-primary: #1a1a2e;
$color-accent: #ff6f61;
$color-teal: #009688;
$color-blue-dark: #0d1b3e;
$color-blue-mid: #1a2d5a;
$color-text-strong: #0f172a;
$color-text-body: #1a1a2e;
$color-text-muted: #64748b;
$color-text-light: #94a3b8;
$color-bg-page: #ffffff;
$color-bg-light: #f5f6fa;
$color-border: #e5e7eb;
// ...
```

### Hardcoded Colors in Components

**Total hardcoded hex occurrences in `src/app/`: 292 instances across 31 files**
**Total unique hex codes: ~87 distinct values**

**Worst-offending files:**

| File | Count | Notable hardcoded values |
|------|-------|--------------------------|
| `product-details.page.ts` | ~50+ | `#1a1a2e` x17, `#e5e7eb` x9, `#ff6f61` x6, `#64748b` x6, `#475569` x6, `#94a3b8` x4 |
| `products.page.scss` | ~40+ | `#3B82F6` x23, `#F1F5F9` x15, `#111827` x14, `#9CA3AF` x11, `#0F172A` x6, plus `#F5384F`, `#FFD873`, `#FF7A59` |
| `header.component.scss` | ~20+ | `#fff` x11, `rgba(255,255,255,...)` x19 |
| `cart.page.scss` | ~15+ | `$color-text-strong` x13, `$color-text-muted` x12, `$color-accent` x7 (SCSS vars, not CSS tokens) |
| `footer.component.scss` | ~10+ | `rgba(255,255,255,0.8)`, `#fff` x6 |
| `login.page.scss` | ~6 | `#16213e`, `#0f3460`, `#ef4444` |
| `product-card.component.scss` | ~14 | `#FF7A59`, `#F0483E`, `#F5384F`, `#FFD873`, `#F0B429`, `#3A2A00`, `#E8484A`, `#06281F` |
| `wishlist.page.ts` | 1 | `#fff` |
| `not-found.page.ts` | 1 | `#fff` |

**Breakdown by file type:**
- `.scss` files in `src/app/`: 67 hex occurrences
- `.ts` files (inline `styles:[]`): 51 hex occurrences
- `.html` files: 10 hex occurrences (SVG fill attributes only)

**Most repeated hardcoded values across components:**
| Value | Count | Used for |
|-------|-------|----------|
| `#fff` / `#FFFFFF` | 78 | Text on dark backgrounds |
| `#1a1a2e` | 17 | PDP headings, borders, buttons |
| `#e5e7eb` | 15 | PDP borders, dividers |
| `#ff6f61` | 7 | PDP accent, ads accent |
| `#64748b` | 6 | PDP breadcrumb, descriptions |
| `#475569` | 6 | PDP description, tab content |
| `#ef4444` | 6 | Login/register validation errors |
| `#94a3b8` | 5 | PDP SKU, original price |

**Additionally:** 100 `rgba()` occurrences in 17 files under `src/app/`, mostly `rgba(0,0,0,...)` for shadows and `rgba(255,255,255,...)` for opacity overlays in header and hero.

### Scale Analysis
- **No defined scale** (like `primary-50` → `primary-900`). Every color is a flat one-off value.
- The `_colors.tokens.scss` defines ~30 flat variables, the legacy `_tokens.scss` defines another ~40 flat variables.
- Duplicate/near-duplicate: `$color-text-strong: #0f172a` in `_variables.scss` vs `--color-text-primary: #12141C` in tokens — similar but not identical dark tones.

---

## 3. Theming Architecture Audit

### Theme Provider / Context
- **No React-style context provider.** Theming is done via CSS custom properties on `:root` + `[data-theme]` attribute override.
- A global `*` rule in `_theme.scss` applies `transition: background-color var(--transition-base), border-color ...` to all elements for smooth theme switching.
- Import order in `styles.scss` governs cascade: `:root` tokens → `[data-theme='dark']` overrides (and luxury, electronics, fashion).

```scss
// styles.scss import order
@use 'scss/tokens';           // :root CSS vars
@use 'scss/theme/colors.tokens';  // :root CSS vars
@use 'scss/themes/light';     // empty
@use 'scss/themes/dark';       // [data-theme='dark']
@use 'scss/themes/luxury';      // [data-theme='luxury']
@use 'scss/themes/electronics'; // [data-theme='electronics']
@use 'scss/themes/fashion';     // [data-theme='fashion']
```

### Theme Switching Mechanism
- **Service:** `src/app/core/layout/layout.service.ts`
- **Storage:** `localStorage` key `'ecommerce.theme'`
- **Detection:** `window.matchMedia('(prefers-color-scheme: dark)')` on init
- **Switching:** `toggleTheme()` cycles through 5 presets: `light → dark → luxury → electronics → fashion`
- **Application:** Sets `document.documentElement.setAttribute('data-theme', theme)` and persists to `localStorage`
- **Init:** `App.ngOnInit()` calls `layout.initTheme()`

```typescript
// layout.service.ts — theme switching
setTheme(theme: ThemePreset): void {
  this._theme.set(theme);
  if (this.isBrowser) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme =
      theme === 'dark' || theme === 'electronics' ? 'dark' : 'light';
    localStorage.setItem('ecommerce.theme', theme);
  }
}
```

- **Theme toggle button** exists in the PLP toolbar (`<button class="plp-toolbar__theme" ...>` calling `cycleTheme()`)
- **No OS-level `prefers-color-scheme` listener** after init — theme is one-shot on load.

### Tokenization Coverage

| Property | Tokenized? | Details |
|----------|-----------|---------|
| Colors | ✅ Yes | CSS vars in `_colors.tokens.scss` + `_tokens.scss` but many components still hardcode |
| Spacing | ✅ Yes | Both `--space-*` (numeric) and `--space-xs` → `--space-6xl` (semantic) |
| Border radius | ✅ Yes | `--radius-*` in `_radius.tokens.scss` + legacy `--border-radius-*` in `_tokens.scss` |
| Shadows | ✅ Yes | `--shadow-*` in `_elevation.tokens.scss` + legacy in `_tokens.scss` |
| Typography | ✅ Yes | Sizes, weights, line-heights, tracking in `_typography.tokens.scss` + legacy in `_tokens.scss` |
| Motion | ✅ Yes | Durations, easings, compound motions in `_motion.tokens.scss` |
| Breakpoints | ✅ Yes | SCSS vars `$bp-*` + CSS vars `--bp-*` in `_breakpoints.tokens.scss` + `_mixins.scss` |
| Z-index | ✅ Partial | Legacy `_tokens.scss` only |

### How Components Consume Theme Values

**Good pattern — product card using CSS vars (`product-card.component.scss`):**
```scss
.pc {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;      // ← hardcoded 16px instead of --radius-xl
  box-shadow: var(--shadow-card);
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
              box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-card-hover);
  }
}
.pc__badge--sale { background: #F5384F; }  // ← hardcoded
.pc__wishlist { box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15); }  // ← hardcoded shadow
.pc__cta { background: var(--color-accent); color: #fff; }  // ← #fff hardcoded
```

**Good pattern — button component using tokens (`button.component.scss`):**
```scss
:host.app-btn--primary {
  background: var(--color-accent);
  color: #fff;               // ← #fff not tokenized
  &:hover:not(:disabled) { background: var(--color-accent-hover); }
}
:host.app-btn--outline {
  color: var(--color-accent);
  border-color: var(--color-accent);
}
```

**Bad pattern — PDP with 841-line inline `styles:[]` full of hardcoded hex (`product-details.page.ts`):**
```typescript
styles: [`
  .breadcrumb { color: #64748b; }
  .breadcrumb a:hover { color: #ff6f61; }
  .info h1 { color: #1a1a2e; }
  .stars { color: #f59e0b; }
  .current-price { color: #1a1a2e; font-size: 32px; }
  .original-price { color: #94a3b8; }
  .size-btn { border: 1px solid #e5e7eb; color: #1a1a2e; }
  .size-btn.active { border-color: #1a1a2e; }
  .qty-btn:disabled { color: #cbd5e1; }
  .stock-status svg.in-stock { color: #10b981; }
  .stock-status .out-of-stock { color: #ef4444; }
  .badge.bestseller { background: var(--color-danger); color: #fff; }
  // ... ~50+ hardcoded colors
`]
```

**Mixed pattern — cart page using legacy SCSS vars (`cart.page.scss`):**
```scss
@use '../../../scss/variables' as *;
.cart-title { color: $color-text-strong; }   // SCSS var, not CSS token
.empty-icon { color: $color-text-light; }
.btn-primary { background: $color-primary; color: #fff; &:hover { background: $color-accent; } }
.checkout-btn { background: var(--color-primary); color: #fff; }  // CSS token
```

### `!important` Usage
**1 occurrence total** across all SCSS files:
- `src/app/core/layout/sidebar/sidebar.component.scss:42` — `width: var(--sidebar-width) !important;`

### Inline Styles / Tailwind Arbitrary Values
- **Zero** `style={{ color: ... }}` or `style={{ background: ... }}` in `.ts` files
- **Zero** Tailwind arbitrary values (`bg-[#...]`, `text-[#...]`)
- **Zero** inline `style="color: ..."` HTML attributes
- **Some** Angular property bindings: `[style.background]="banner.gradient"`, `[style]="mediaGradient()"` (which returns a string with hardcoded hex pairs)

---

## 4. Design Token Inventory

### Typography

**Font Families:**
- Primary: `'Space Grotesk', 'Inter', system-ui, -apple-system, sans-serif` (set in `styles.scss`)
- Mono: `'JetBrains Mono', 'Fira Code', monospace` (defined in tokens, not actively used)
- Font families are **not tokenized as CSS vars** in `_typography.tokens.scss` (no `--font-display` or `--font-body` variable)

**Font Sizes — Tokenized (both CSS vars + legacy):**
```
--text-xs: 0.75rem   --text-sm: 0.875rem  --text-base/--text-md: 1rem
--text-lg: 1.125rem  --text-xl: 1.25rem   --text-2xl: 1.5rem
--text-3xl: 1.875rem --text-4xl: 2.25rem  --text-5xl: 3rem
```

**Font Weights — Tokenized:**
```
--weight-normal: 400  --weight-medium: 500  --weight-semibold: 600
--weight-bold: 700    --weight-extrabold: 800  --weight-black: 900
```
(Also `--font-weight-*` in legacy `_tokens.scss`)

**Line Heights — Tokenized:**
```
--leading-tight: 1.25  --leading-snug: 1.375  --leading-normal: 1.5  --leading-relaxed: 1.625
```
(Also `--line-height-*` in legacy `_tokens.scss`)

**Typography mixins exist** in `_typography.scss` (`@mixin heading-1`, `@mixin body-md`, etc.) but only `hero-section` and `clips-section` use the `$font-primary` SCSS variable — no component uses the typography mixins.

### Spacing

Two parallel spacing scales:

| Semantic (`_spacing.tokens.scss`) | Numeric (`_tokens.scss`) |
|------------------------------------|---------------------------|
| `--space-xs: 4px` | `--space-1: 4px` |
| `--space-sm: 8px` | `--space-2: 8px` |
| `--space-md: 16px` | `--space-4: 16px` |
| `--space-lg: 24px` | `--space-6: 24px` |
| `--space-xl: 32px` | `--space-8: 32px` |
| `--space-2xl: 40px` | `--space-10: 40px` |
| `--space-3xl: 48px` | `--space-12: 48px` |
| `--space-4xl: 64px` | `--space-16: 64px` |
| `--space-5xl: 80px` | `--space-20: 80px` |
| `--space-6xl: 96px` | `--space-24: 96px` |

**Ad-hoc semantic spacing** in `_spacing.tokens.scss`: `--section-spacing: 80px`, `--card-spacing: 32px`, `--card-padding: 24px`, `--grid-gap: 32px`

**Usage:** Most components use arbitrary pixel values (e.g., `padding: 16px`, `gap: 8px`) rather than spacing tokens. The product card is particularly guilty — all values are hardcoded px.

### Border Radius

Two parallel systems (values overlapping):
- `_radius.tokens.scss`: `--radius-none: 0`, `--radius-xs: 4px`, `--radius-sm: 6px`, `--radius-md: 8px`, `--radius-lg: 12px`, `--radius-xl: 16px`, `--radius-2xl: 20px`, `--radius-3xl: 24px`, `--radius-full: 9999px`
- `_tokens.scss`: `--border-radius-xs: 4px`, `--border-radius-sm: 8px`, `--border-radius-md: 12px`, `--border-radius-lg: 16px`, `--border-radius-xl: 20px`, `--border-radius-2xl: 24px`, `--border-radius-pill: 9999px`

**Note:** Values differ between the two! e.g. `--radius-sm: 6px` vs `--border-radius-sm: 8px`, `--radius-md: 8px` vs `--border-radius-md: 12px`. Both systems are active in `:root`, causing potential confusion.

### Shadows / Elevation

Two parallel systems:
- `_elevation.tokens.scss`: `--shadow-xs` through `--shadow-2xl`, plus `--shadow-card`, `--shadow-card-hover`, `--shadow-focus`
- `_tokens.scss`: `--shadow-xs` through `--shadow-xl`, plus `--shadow-focus`

Values differ — `_elevation.tokens.scss` uses `rgba(17, 24, 39, ...)` (gray-900), `_tokens.scss` uses `rgba(20, 24, 40, ...)` (different base color).

### Breakpoints

Defined in two places:
- `_mixins.scss` (SCSS vars): `$bp-xs: 480px`, `$bp-sm: 640px`, `$bp-md: 768px`, `$bp-lg: 1024px`, `$bp-xl: 1280px`, `$bp-2xl: 1440px`
- `_breakpoints.tokens.scss` (CSS vars + SCSS vars) — same values

**Usage:** Components use `@media (max-width: 768px)` and `@media (max-width: 1024px)` as magic numbers extensively (header, footer, cart, product-card, product-details, PLP).

### Z-index
Defined only in legacy `_tokens.scss`: `--z-base: 0` through `--z-tooltip: 700`. Not consistently used — some components use hardcoded `z-index: 3`, `z-index: 2`, etc.

---

## 5. Component Consistency Sample

### Core Ecommerce Components

| Component | Filepath | Uses Tokens? | Notes |
|-----------|----------|-------------|-------|
| **ProductCard** | `shared/ui/product-card/` | Mixed | CSS vars for bg/border/shadow, hardcoded px for spacing/radius, hardcoded badge colors, shadow values hardcoded |
| **Button** | `shared/ui/button/` | Mostly | CSS vars for bg/color/border, `#fff` hardcoded, variants centralized |
| **Card** | `shared/ui/card/` | ✅ Good | All bg/border/shadow/radius via CSS vars |
| **Badge** | `shared/ui/badge/` | ✅ Good | All CSS vars — but not used (product card now self-renders badges) |
| **Chip** | `shared/ui/chip/` | ✅ Good | All CSS vars |
| **Pagination** | `shared/ui/pagination/` | ✅ Good | All CSS vars except `#fff` on active page btn |
| **Header** | `core/layout/header/` | ❌ Bad | `#fff` x11, `rgba(255,255,255,...)` x19, hardcoded responsive breakpoints |
| **Footer** | `core/layout/footer/` | ❌ Bad | `#fff` x6, `rgba(255,255,255,...)` x10, hardcoded breakpoints |
| **Cart Page** | `features/cart/` | ❌ Bad | Uses legacy `$color-*` SCSS variables extensively |
| **PDP** | `features/products/product-details.page.ts` | ❌ Worst | 50+ hardcoded hex values in 841-line inline `styles:[]` |
| **PLP** | `features/products/products.page.ts + .scss` | ❌ Bad | 40+ hardcoded hex values, legacy SCSS vars, hardcoded skeleton colors |
| **Login/Register** | `features/account/` | ❌ Bad | Hardcoded gradient hex values, validation colors |
| **Hero Section** | `features/home/hero-section/` | ❌ Bad | Uses legacy `$color-*` SCSS vars, hardcoded `#fff` |
| **Wishlist Page** | `features/wishlist/wishlist.page.ts` | ✅ Good | Clean, uses CSS vars throughout |
| **Error Pages** | `features/errors/` | ✅ Good | Clean, uses CSS vars throughout |

### Variant Centralization

- **Button:** 4 variants (primary, secondary, ghost, outline, danger) + 3 sizes + disabled + loading — **centralized** in `button.component.scss`
- **Badge:** 5 variants (default, accent, success, warning, danger) — **centralized** in `badge.component.scss`
- **Chip:** 5 variants (default, accent, success, warning, danger) + selected — **centralized**
- **Card:** 4 variants (default, elevated, outlined, glass) + hoverable — **centralized**
- **Product Card:** 2 variants (grid, showcase) + horizontal list — **centralized** directly in component

---

## 6. Accessibility & Contrast Signals

### Contrast Issues Visible in Code

1. **Header:** `color: rgba(255,255,255,0.85)` on `background: var(--color-primary)` (dark navy `#12141C`) — white text at 85% opacity on dark bg is acceptable but `0.7`, `0.6`, `0.5` opacity values degrade contrast
2. **Footer:** `color: rgba(255,255,255,0.8)` on `background: var(--color-primary)` — similar opacity issue
3. **Footer tagline:** `color: rgba(255,255,255,0.55)` — **likely below WCAG AA (3:1)** for 14px text
4. **Category nav links:** `color: rgba(255,255,255,0.78)` on `background: var(--color-primary-light)` — borderline
5. **Hero section:** `color: rgba(255,255,255,0.7)` on gradient background — questionable
6. **Login/register:** validation errors use `#ef4444` — adequate but not tokenized
7. **PLP skeleton/shimmer:** `#F1F5F9` on `#fff` bg — very low contrast, intentional (loading state)
8. **Disabled button:** `opacity: 0.5` — common pattern but not separately tokenized

### Focus, Hover, and Disabled States

**Tokenized patterns:**
- Focus ring: `--shadow-focus` token exists and is used in button, search-input
- Hover: `--color-accent-hover`, `--color-primary-hover` tokens exist
- Disabled: Button has `opacity: 0.5` + `cursor: not-allowed` pattern

**Per-component patterns (not tokenized):**
- Header search: `box-shadow: 0 0 0 3px rgba(255, 111, 97, 0.2)` — hardcoded color, references legacy `$color-accent`
- Cart quantity: `box-shadow: 0 0 0 2px rgba($color-primary, 0.08)` — uses SCSS var
- Product card hover: `transform: translateY(-5px)` — hardcoded
- Dropdown items: `background: var(--bg-surface-secondary)` — tokenized hover

**`focus-visible` usage:** Button component uses `&:focus-visible { box-shadow: var(--shadow-focus); }`. Most other components do not define focus-visible styles.

---

## 7. Screenshots / Visual Reference

### Available Routes

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/` | `HomePage` | Hero, categories, clips, featured products |
| `/products` | `ProductsPage` | PLP with filters, grid/list view, sort, pagination |
| `/products/:id` | `ProductDetailsPage` | PDP with gallery, options, tabs |
| `/cart` | `CartPage` | Cart items, quantity, order summary |
| `/checkout` | `CheckoutPage` | Checkout form |
| `/orders` | `OrdersPage` | Order history |
| `/wishlist` | `WishlistPage` | Empty wishlist |
| `/account` | `ProfilePage` | User profile |
| `/login` | `LoginPage` | Sign-in form |
| `/register` | `RegisterPage` | Registration form |
| `/admin` | `AdminDashboardPage` | Admin dashboard |
| `/admin/products` | `AdminProductsPage` | Admin product management |
| `/403` | `ForbiddenPage` | Forbidden error |
| `/500` | `ServerErrorPage` | Server error |
| `/**` | `NotFoundPage` | 404 |

### Light/Dark Mode Support Status

| Feature | Status | Details |
|---------|--------|---------|
| Light mode | ✅ Full | Default, works everywhere |
| Dark mode | ✅ Partial | Surfaces/text/accent/borders tokenized. **Known broken:** PDP (50+ hardcoded hex), cart page (SCSS vars not updated for dark), hero section (SCSS vars hardcoded), clips section (SCSS vars), auth pages (gradients hardcoded), PLP (40+ hardcoded hex) |
| Luxury theme | 🟡 Partial | `_luxury.scss` defines 25 vars but many components won't pick them up due to hardcoded values |
| Electronics theme | 🟡 Partial | Same issue |
| Fashion theme | 🟡 Partial | Same issue |
| OS preference detection | ✅ Yes | Init reads `prefers-color-scheme: dark` |
| Persistence | ✅ Yes | localStorage key `'ecommerce.theme'` |
| Smooth transition | ✅ Yes | Global `transition` rule on `*` |

---

### Summary of Key Issues (Factual, No Editorializing)

1. **Two parallel token systems exist** — `_tokens.scss` (legacy, naming: `--border-radius-*`, `--text-*`, `--space-*`) and `theme/` directory (new, naming: `--radius-*`, `--text-*`, `--space-*`). Both are loaded into `:root` simultaneously. Values differ for the same concept (e.g., `--radius-sm: 6px` vs `--border-radius-sm: 8px`).

2. **Two parallel SCSS variable systems exist** — `_variables.scss` (legacy SCSS `$color-*`) and CSS custom properties. Components use both inconsistently.

3. **292 hardcoded hex colors** remain in `src/app/`, with major concentration in product-details (50+), PLP (40+), header (20+).

4. **product-details.page.ts** has 841 lines of CSS in an inline `styles: []` array — the single most problematic file for theming.

5. **Components use hardcoded pixel values** for spacing, radius, and shadow rather than tokens.

6. **No font family CSS variables** exist — `--font-display` and `--font-body` are absent. The font is hardcoded in `styles.scss:body`.

7. **5 themes are defined** but only dark mode works partially. The 3 niche themes (luxury, electronics, fashion) are incomplete because most components ignore tokens.

8. **Only 1 `!important`** in the entire SCSS codebase. **Zero** Tailwind arbitrary values. **Zero** inline `style="color:..."` in HTML.
