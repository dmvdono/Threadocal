# Threadocal Test Coverage Matrix

This inventory was generated from the current `app/` route tree and the implemented Supabase/localStorage services.

| Route | Feature | User role | Backend used | Expected behavior | Automated test file | Current status |
|---|---|---:|---|---|---|---|
| `/` | Homepage, nav, search entry, featured marketplace | Public | Mock/demo data plus localStorage counts | Loads without 404; nav/dropdowns usable; homepage design unchanged | `tests/smoke/smoke.spec.ts`, `tests/navigation/navigation.spec.ts` | Automated smoke/navigation |
| `/shop` | Product grid, category/search entry | Public/customer | Demo/localStorage products; Supabase marketplace service where visible data exists | Shows visible products only; hidden products excluded | `tests/smoke/smoke.spec.ts`, `tests/cart/cart.spec.ts`, `tests/checkout/checkout.spec.ts` | Automated partial |
| `/shop/[slug]` | Category product route | Public/customer | Demo/localStorage products | Category route renders filtered products without 404 | Planned `tests/products/` expansion | Matrixed gap |
| `/product/[slug]` | Product detail, options, cart | Public/customer | Demo/localStorage; Supabase marketplace reads for public data | Requires size when needed; quantity and fulfillment selectable; add to cart persists | `tests/cart/cart.spec.ts`, `tests/checkout/checkout.spec.ts` | Automated partial |
| `/brands` | Brand directory | Public/customer | Demo data and approved Supabase brands | Approved/visible brands render; hidden/rejected data not public | `tests/smoke/smoke.spec.ts`, `tests/navigation/navigation.spec.ts` | Automated smoke |
| `/brands/[slug]` | Legacy brand detail | Public/customer | Demo data | Brand profile route renders without 404 | Planned `tests/customer/` expansion | Matrixed gap |
| `/brand/[username]` | Public brand storefront | Public/customer | Supabase approved brands/products; owner pending images hidden publicly | Banner/logo/bio/socials/products render for approved brands | Planned authenticated fixture tests | Blocked without safe seeded brand |
| `/brands/preview` | Brand preview | Public/brand owner | Demo/mock brand data | Preview renders with storefront styling | Planned `tests/navigation/` expansion | Matrixed gap |
| `/brands/submit` | Brand submission | Public/brand owner | Form/local mocked submission | Public brand submission page works; no admin exposure | Planned `tests/brand/` expansion | Matrixed gap |
| `/promotions` | Promotions page | Public/customer | Demo data | Loads promotional content | `tests/smoke/smoke.spec.ts` | Automated smoke |
| `/how-it-works` | Help/explainer page | Public | Static content | Loads without 404 | `tests/smoke/smoke.spec.ts` | Automated smoke |
| `/signup` | Customer/brand-owner signup | Public | Supabase auth/profile insert | Query role preselects; validation friendly; destructive signup only with flag | `tests/auth/auth.spec.ts` | Automated validation; live signup gated |
| `/login` | Role-aware login | Public | Supabase auth/profile reads | Incorrect credentials friendly; role redirect by profile.role | `tests/auth/auth.spec.ts`, `tests/admin/admin.spec.ts` | Automated validation; role login gated by env |
| `/dashboard` | Customer dashboard | Customer | Supabase auth/profile guard | Logged-out users prompted; customers route here | `tests/smoke/smoke.spec.ts` | Automated smoke; authenticated flow gated |
| `/account` | Customer account, orders, favorites, following, addresses, notifications | Customer/demo | localStorage/demo customer data | Sections load and persist localStorage state | `tests/customer/customer.spec.ts` | Automated partial |
| `/cart` | Cart page | Customer/demo | localStorage cart | Cart count/items/quantity/fulfillment persist after refresh | `tests/cart/cart.spec.ts` | Automated partial |
| `/checkout` | Checkout fulfillment | Customer/demo | localStorage cart/orders | Shipping and pickup language stay separate | `tests/checkout/checkout.spec.ts` | Automated partial |
| `/orders/[id]` | Order tracking | Customer/brand owner demo | localStorage orders | Pickup/shipping status flows render correctly | Planned `tests/orders/` expansion | Matrixed gap |
| `/brand-dashboard` | Brand profile dashboard | Brand owner/admin/demo fallback | Supabase brand row when signed in; demo fallback when unavailable | No empty auto-insert; required validation; logo/banner staged then uploaded on save | `tests/brand/brand-profile.spec.ts` | Automated UI; Supabase save gated |
| `/brand-dashboard/products` | Product cards and creator | Brand owner/admin/demo fallback | Supabase products/images/variants/inventory; localStorage fallback | Draft/published fields visible; multiple images staged before save | `tests/products/product-management.spec.ts` | Automated UI; Supabase write gated |
| `/brand-dashboard/inventory` | Inventory management | Brand owner/admin/demo fallback | Supabase product_inventory; localStorage fallback | Stock edits persist and affect product states | Planned `tests/inventory/` expansion | Matrixed gap |
| `/brand-dashboard/orders` | Brand order management | Brand owner/admin/demo fallback | localStorage/demo order status | Brand status controls respect pickup/shipping language | Planned `tests/orders/` expansion | Matrixed gap |
| `/brand-dashboard/coupons` | Coupon management | Brand owner/admin/demo fallback | localStorage/demo coupons | Percent/fixed/free-pickup validation and persistence | Planned `tests/coupons/` expansion | Matrixed gap |
| `/brand-dashboard/analytics` | Brand analytics | Brand owner/admin/demo fallback | Demo metrics | Metrics page loads | `tests/smoke/smoke.spec.ts` | Automated smoke |
| `/admin` | Admin dashboard, approvals, moderation, disputes | Admin only | Supabase admin reads/writes through anon client and RLS | Non-admin blocked; admin controls available only to profile.role=`admin` | `tests/admin/admin.spec.ts`, `tests/smoke/smoke.spec.ts` | Public protection automated; admin env gated |

## Backend Use Summary

- Supabase: auth signup/login/profile, brand profile rows, marketplace brands/products/images/variants/inventory, admin moderation queues.
- Supabase Storage: `brand-logos`, `brand-banners`, `product-images`; browser tests never use service-role keys.
- localStorage/demo fallback: cart, checkout demo orders, customer account panels, demo marketplace products, coupons, inventory fallback.
- Live production data: only read-only smoke checks by default when `TEST_BASE_URL` targets production/Vercel.
- Mock/demo data: homepage featured data, fallback marketplace, customer account demo sections, local pickup/order demo flows.

## Known Coverage Gaps

Authenticated destructive flows need safe test accounts or `ALLOW_DESTRUCTIVE_E2E=true`: signup database assertions, brand save/update/no-duplicate checks, product publish/edit/delete against Supabase, admin approval/moderation/disputes. These are represented in helpers and docs but intentionally guarded to avoid production writes.
