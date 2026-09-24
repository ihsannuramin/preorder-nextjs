# POHub — Feature & Architecture Reference

> Living reference for the team. Generated 2026-09-19 from a full read of the codebase (branch `features/phase-2`, HEAD `d07b403`), updated same-day after resolving all §9 known issues (see **Changelog**). The old `PRD.md`/`DESIGN.md` at repo root no longer exist; a stale leftover git worktree that held outdated copies (`.kilo/worktrees/hypnotic-holiday/`) has been removed — use this file instead.

POHub is a Next.js 15 (App Router) SaaS for Indonesian home businesses (UMKM rumahan) to manage pre-orders: Linktree-style public store + product catalog + pre-order campaigns + HPP (cost-of-goods) calculator + production planning. Mobile-first, Bahasa Indonesia UI.

**Stack**: TypeScript, Tailwind + shadcn/ui (Radix), Prisma + Supabase (Postgres/Auth/Storage), Zustand, react-hook-form + zod, Recharts, framer-motion, `xlsx` for Excel export. Mutations are almost entirely **Next.js Server Actions** (`src/actions/*.ts`), not REST API routes — only 8 real `route.ts` handlers exist (auth callback, upload, 3 export endpoints, campaign/group-order lookups).

---

## 1. Data model (`prisma/schema.prisma`)

| Model | Purpose | Key fields |
|---|---|---|
| `User` | 1:1 with Supabase auth user | `supabaseId`, `email`, `businessName` |
| `Store` | Public storefront config | `slug`, `whatsapp`, `instagram`, `socialLinks` (Json, 10 platforms), `googleMapsUrl`, `showGoogleMaps`, `logoUrl` |
| `Product` | Catalog item | `images String[]`, `category` enum (12 incl. non-food), `costMode` RECIPE\|MANUAL, `manualCostPrice`, `basePrice`, `status` DRAFT\|PUBLISHED\|ARCHIVED |
| `AdditionalCost` | Extra per-product cost line (packaging, labor, etc.) | `label`, `amount` |
| `Ingredient` | Raw material | `unit`, `purchaseQty/Price`, `currentStock`, `averageCost`, `minimumStock` |
| `StockMovement` | Audit trail of stock changes | `type` PURCHASE\|DEDUCTION\|ADJUSTMENT, `reason`, `quantityChange`, `resultingStock` |
| `RecipeItem` | Product↔Ingredient join (the recipe) | `quantity` |
| `Campaign` | Pre-order period | `openDate/closeDate`, `status` DRAFT→OPEN→CLOSED→PRODUCTION→COMPLETED\|CANCELLED |
| `CampaignProduct` | Campaign↔Product join | |
| `Order` | Individual customer order | `orderNumber` (`PO-YYYY-NNNN`), `status` PENDING_PAYMENT→PAYMENT_REVIEW→PAID→PRODUCTION→READY→COMPLETED\|CANCELLED, `paymentProofUrl` |
| `OrderItem` | Line item, price/HPP **snapshotted** at order time | |
| `ProductionSheet` / `ProductionSheetItem` | Generated ingredient-needs sheet per campaign | |
| `ProductionRecord` | Actual production run | `quantity`, `totalCost`, `status` |
| `GroupOrder` / `GroupMemberOrder` / `GroupMemberOrderItem` | Group/arisan-style shared PO session | `sessionCode` |

No `Variant`/`ProductVariant` model exists — see dead code note below.

---

## 2. Routes

Route groups: `(auth)` = unauthenticated shell, `(dashboard)` = authenticated shell (sidebar + mobile bottom-nav).

- **Auth** (`(auth)/`): `masuk` (login + Google OAuth), `daftar` (register), `lupa-password`, `reset-password`
- **Dashboard home** (`(dashboard)/dashboard`): KPI cards, revenue/HPP/profit summary, recent orders
- **Store settings** (`(dashboard)/toko`): profile photo, slug, description, WA (+62), 10-platform social links, offline-store toggle → Google Maps URL + public show/hide
- **Products** (`(dashboard)/produk`): list, `baru` (2-step wizard incl. RECIPE vs MANUAL cost-mode choice), `[id]` (tabbed: Overview/Resep/HPP/Produksi — Resep+Produksi hidden for MANUAL mode), `[id]/resep`
- **Ingredients** (`(dashboard)/bahan-baku`): list, `baru` (supports batch create), `[id]` (detail + last-20 stock movements), `[id]/pembelian` (purchase → weighted-avg cost), `[id]/penyesuaian` (stock adjustment, reason-coded, blocks negative stock)
- **Campaigns / Periode PO** (`(dashboard)/periode-po`): list, `baru`, `[id]` (status-lifecycle actions), `[id]/produksi` (generate/reset production sheet, start production)
- **Orders / Pesanan** (`(dashboard)/pesanan`): list (filter by status/campaign/search), `[id]` (payment verification, signed-URL proof viewer, WA deep-link templates), `grup`, `grup/[id]`
- **Public store**: `src/app/[slug]` (ISR `revalidate=60`) — logo, WA button, social icons, conditional Maps link, open campaigns, published products
- **Order form (no-auth)**: `[slug]/pesan/[campaignId]` (+ `/sukses`), group variant `.../grup`, `.../grup/[sessionCode]`, `.../grup/[sessionCode]/ringkasan`, `.../grup/[sessionCode]/sukses`
- **Order tracking (no-auth)**: `/lacak/[orderId]`
- **Profit dashboard** (`(dashboard)/keuntungan`)
- **Reports** (`(dashboard)/laporan`) → 3 export API routes
- **Standalone HPP Calculator** (`(dashboard)/kalkulator-hpp`) — client-only, no persistence, **not auth-protected** by middleware

**Dead route directories (no `page.tsx`)**: `produk/[id]/edit`, `bahan-baku/[id]/sesuaikan`, `(dashboard)/inventori`.

---

## 3. Key reusable components

| Component | Purpose |
|---|---|
| `shared/currency-input.tsx` | Rp-prefixed, thousand-separated input — standardized across all money fields |
| `shared/currency-display.tsx` | Read-only formatted Rp display |
| `shared/multi-image-upload.tsx` | Up to 5 product photos, grid + "Sampul" cover badge, Supabase Storage bucket `product-images` |
| `shared/image-upload.tsx` | Single-image variant (store logo) |
| `shared/payment-proof-upload.tsx` / `group-payment-proof-upload.tsx` | Customer-side proof upload |
| `shared/onboarding-hint.tsx` | Contextual first-run tooltips for empty states |
| `layout/bottom-nav.tsx` | Mobile bottom nav: 4 primary items + "Lainnya" bottom-sheet (Bahan Baku, Periode PO, Keuntungan, Laporan, Kalkulator HPP) |
| `products/product-detail-tabs.tsx` | Product detail orchestrator (tab visibility depends on cost mode) |
| `products/profit-simulator.tsx` | 3-mode pricing tool (manual/target-margin/markup) with live preview, one-click apply to `basePrice` |

---

## 4. Core business logic (`src/lib/utils/`)

- **`hpp.ts`** — the HPP engine: `calculateHpp()` (recipe cost + additional costs, or manual override), `calculatePriceFromMargin/Markup`, `calculateMargin`, `calculateProfit`
- **`production.ts`** — `calculateCapacity` (max producible units from stock), `generateProductionNeeds` (aggregates ingredient needs across paid orders), `checkAvailability`
- **`stock.ts`** — `applyPurchase`: weighted-average cost recalculation, writes `StockMovement` transactionally
- **`whatsapp.ts`** — wa.me deep-link builder + 8 canned Bahasa Indonesia message templates per order-status transition (companion tool, not real WA Business API)
- **`currency.ts`**, **`slug.ts`** (incl. reserved-slug check), **`units.ts`**, **`date.ts`**

---

## 5. Auth & middleware

Supabase Auth (`@supabase/ssr`) — email/password + Google OAuth, forgot/reset password, all via `src/actions/auth.ts`. `middleware.ts` protects `/dashboard, /toko, /produk, /bahan-baku, /periode-po, /pesanan, /keuntungan, /laporan` (redirects to `/masuk`); auth pages redirect logged-in users to `/dashboard`. First login without a `Store` routes to `/toko` for first-time setup.

---

## 6. Module status (original 15-module PRD)

| # | Module | Status |
|---|---|---|
| 1 | Auth | ✅ Done — email/password, Google OAuth, forgot/reset |
| 2 | Store Management | ✅ Done |
| 3 | Product Management | ✅ Done |
| 4 | Ingredient Management | ✅ Done |
| 5 | Recipe Builder | ✅ Done (optional — skippable via MANUAL cost mode) |
| 6 | Automatic HPP Calculation | ✅ Done for RECIPE mode; MANUAL mode uses direct entry |
| 7 | Pre-Order Campaign | ✅ Done |
| 8 | Public Store | ✅ Done |
| 9 | Order Form (no-auth) | ✅ Done — individual + group order flows |
| 10 | Order Management | ✅ Done |
| 11 | Payment Verification | ✅ Done — individual + group |
| 12 | Production Planning | ✅ Done |
| 13 | Dashboard | ✅ Done |
| 14 | Profit Dashboard | ✅ Done (shares `getStoreFinanceSummary()` with Dashboard) |
| 15 | Reporting (CSV/Excel/PDF) | ✅ Done — CSV/Excel/PDF all working, incl. production report |

## 7. Extras beyond the original PRD

- Multi-photo products (5 max, cover badge)
- Store social links as a typed list of 10 platforms (incl. Shopee/Tokopedia/GoFood/GrabFood/ShopeeFood)
- WhatsApp number with `+62` formatting convention
- Google Maps store location with public show/hide toggle
- Mobile bottom nav with "Lainnya" overflow sheet
- Two cost modes (RECIPE vs MANUAL) — lets non-F&B sellers (fashion, craft, accessories, electronics, household, beauty) skip ingredients/recipes entirely
- Customer order tracking page (`/lacak/[orderId]`), no login required
- Onboarding hints for new store owners
- Standalone (non-persistent) HPP Calculator, separate from per-product HPP

## 8. Testing

**Unit tests only, no integration/E2E yet.** `vitest` is set up (`npm test`) with 38 unit tests under `tests/unit/` covering the pure business logic: `hpp.ts`, `stock.ts` (weighted-average costing), `production.ts`, and `order-number.ts`. No tests yet for Server Actions, DB transactions, or UI (no Playwright/Jest, no React component tests). `tests/fixtures/.auth/user.json` remains a stray leftover from an abandoned Playwright setup.

---

## 9. Known issues / good enhancement targets

All items below are now **resolved** (2026-09-19) — see **Changelog** at the bottom of this doc for what changed and where.

- ~~PDF export is fake~~ — now generates a real PDF via `jspdf`/`jspdf-autotable` and is linked from `/laporan`.
- ~~"Laporan Produksi" report is broken~~ — `/api/export/csv?type=production` now aggregates ingredient needs across paid orders.
- ~~Error handling is swallowed almost everywhere~~ — every `catch` in `src/actions/*.ts` and the export routes now logs via `createLogger`.
- ~~`productSchema` (zod) is stale~~ — now includes `costMode`/`manualCostPrice`/`images`, and `createProduct`/`updateProduct` validate through it instead of `as any` casts.
- ~~Dead code: `src/stores/cart-store.ts`~~ — deleted.
- ~~Dead routes~~ — the 3 empty route directories were deleted.
- ~~Dashboard vs. Profit page duplicate query~~ — both now call `getStoreFinanceSummary()` in `src/lib/utils/finance.ts`.
- ~~`/kalkulator-hpp` isn't in the middleware's protected list~~ — added to `DASHBOARD_ROOTS` in `middleware.ts`.
- ~~Repo hygiene: stale `.kilo/worktrees/hypnotic-holiday/`~~ — worktree removed; `worktrees/` added to `.kilo/.gitignore` to prevent recurrence.
- ~~No test suite~~ — vitest set up (`npm test`), 38 unit tests covering `hpp.ts`, `stock.ts`, `production.ts`, and the new `order-number.ts` retry/formatting logic.

New/remaining candidates for next round (found while fixing the above):
- No tests yet for `orders.ts`'s `createPublicOrder` transaction or `production.ts`'s stock-deduction transaction end-to-end (would need an integration test against a real/test database, not just unit tests on pure functions).
- `middleware.ts`'s matcher had a typo excluding a non-existent `_n  ` path instead of `_next/static` (fixed in passing) — worth a lint rule or code review checklist item to catch silently-broken regex literals like this in the future.

---

## 10. Suggested next-enhancement candidates

All 6 items previously listed here (fix fake PDF export, fix broken production CSV, add error logging, delete dead code, unify dashboard/profit query, stand up a test suite) were completed on 2026-09-19 — see **Changelog**. Next candidates, roughly in priority order:

1. Add integration tests (against a real or containerized test DB) for the transactional flows that unit tests can't cover: `createPublicOrder`'s order-number retry loop, and `startProduction`'s stock-deduction + `ProductionRecord` transaction.
2. Add CI (GitHub Actions or similar) running `npm run build`, `npx tsc --noEmit`, and `npm test` on every PR — none of this is automated yet, it was all run manually during this cleanup.
3. Consider a PDF report for the "Keuntungan" (profit) and "Produksi" data too, now that the PDF pipeline (`jspdf`/`jspdf-autotable`) is proven out — currently only the orders report has a PDF option.
4. Revisit `npm audit` output (11 vulnerabilities, mostly in transitive deps) next time dependencies are touched.

---

## Changelog

**2026-09-19** — Resolved all items from the "Known issues" list above:
- Removed stale git worktree `.kilo/worktrees/hypnotic-holiday/` (detached at an old commit with contradictory PRD docs); added `worktrees/` to `.kilo/.gitignore`.
- Deleted dead code (`src/stores/cart-store.ts`) and 3 empty route directories (`produk/[id]/edit`, `bahan-baku/[id]/sesuaikan`, `(dashboard)/inventori`).
- Rewrote `/api/export/pdf` to generate a real PDF (`jspdf` + `jspdf-autotable`) instead of HTML-with-a-misleading-filename; added a "Laporan Pesanan (PDF)" card to `/laporan` (the route previously wasn't linked from any UI at all).
- Fixed `/api/export/csv?type=production` to actually aggregate ingredient needs (via `generateProductionNeeds`) instead of silently returning an empty file.
- Added `createLogger`-based error logging to every previously-bare `catch` block across `src/actions/*.ts` and the 3 export routes (`csv`, `excel`, `pdf`); `group-orders.ts`'s raw `console.error` calls were switched to the same structured logger.
- Updated `productSchema` (`src/lib/validations/product.ts`) to include `costMode`, `manualCostPrice`, and `images`, added a `productUpdateSchema`, and wired both into `createProduct`/`updateProduct` (`src/actions/products.ts`), removing the `as any` enum casts.
- Extracted `getStoreFinanceSummary()` into `src/lib/utils/finance.ts`; both `/dashboard` and `/keuntungan` now call it instead of independently duplicating the same revenue/HPP/profit aggregation query.
- Added `/kalkulator-hpp` to `middleware.ts`'s protected `DASHBOARD_ROOTS`. Also fixed an unrelated typo in the same matcher regex (`_n  ` → `_next/static`) noticed while editing.
- Extracted order-number formatting and P2002-conflict detection into `src/lib/utils/order-number.ts` (`formatOrderNumber`, `isOrderNumberConflict`), used by `src/actions/orders.ts`.
- Set up `vitest` (`npm test` / `npm run test:watch` / `npm run test:coverage`); added 38 unit tests under `tests/unit/` covering `hpp.ts`, `stock.ts` (weighted-average costing), `production.ts`, and the new `order-number.ts`.
