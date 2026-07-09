# Threadocal Build Roadmap

Threadocal is being built as a production-ready marketplace for discovering and buying from independent clothing brands. The current priority is stabilizing the marketplace demo flow before reconnecting authentication, persistence, and payments.

## Phase 1 — Marketplace Demo

### Goal
Prove the core shopping, cart, checkout, local pickup, order tracking, and brand order-management flow using demo data and localStorage.

### Features
- Homepage navigation into the marketplace.
- Shop page with working category filters.
- Product listing and product detail pages.
- Size, quantity, fulfillment method, and pickup slot selection.
- Cart with quantity updates, item removal, subtotal, and cart count.
- Demo checkout with payment-hold messaging.
- Local pickup order tracking.
- Customer confirmation and dispute placeholder.
- Demo brand dashboard and brand order-management page.

### Files Likely Involved
- `app/page.tsx`
- `app/shop/page.tsx`
- `app/shop/[slug]/page.tsx`
- `app/cart/page.tsx`
- `app/checkout/page.tsx`
- `app/orders/[id]/page.tsx`
- `app/(dashboard)/brand-dashboard/page.tsx`
- `app/(dashboard)/brand-dashboard/orders/page.tsx`
- `components/marketplace/*`
- `components/cart/*`
- `components/orders/*`
- `lib/demo/marketplace.ts`
- `services/cart/index.ts`
- `services/orders/index.ts`
- `types/product.ts`
- `types/order.ts`

### Test Checklist
- Homepage category links open filtered shop pages.
- Product detail requires size where sizes exist.
- Quantity stepper cannot go below one.
- Shipping and local pickup can be selected.
- Pickup slots show only when local pickup is selected.
- Cart shows size, quantity, fulfillment method, and pickup time.
- Cart subtotal and nav count update correctly.
- Checkout creates a local demo order.
- Customer tracking page is read-only for brand-controlled status progress.
- Brand orders page can move an order from order placed to preparing to ready for pickup.
- Customer can confirm pickup only after ready for pickup.
- Customer can complete or dispute the order.

### What Should Stay Demo/localStorage
- Product catalog.
- Brand profile preview.
- Cart data.
- Checkout data.
- Demo orders.
- Demo dispute records.
- Brand order status updates.

### What Later Needs Supabase/Stripe
- Product persistence.
- Brand persistence.
- Cart persistence across devices.
- Real order records.
- Pickup location records.
- Dispute records and admin review.
- Stripe checkout and payment holds.

## Phase 1.5 — Brand Portal Demo

### Goal
Give brands a professional demo workspace for managing products, inventory, coupons, orders, and analytics before Supabase Auth and database persistence return.

### Features
- Shopify-style brand dashboard overview.
- Today's orders, pending pickup orders, demo revenue, product count, and low inventory alerts.
- Product add, edit, delete, image placeholder, sizes, colors, inventory quantity, and sold-out controls.
- Inventory table by product, size, and color with quick quantity adjustment.
- Brand order management for demo orders.
- Coupon creation, editing, deletion, validation, active status, dates, percent off, fixed amount off, and free pickup.
- Analytics cards and simple CSS bar charts for sales, orders, views, conversion, top products, and returning customers.

### Files Likely Involved
- `app/(dashboard)/brand-dashboard/page.tsx`
- `app/(dashboard)/brand-dashboard/products/page.tsx`
- `app/(dashboard)/brand-dashboard/inventory/page.tsx`
- `app/(dashboard)/brand-dashboard/orders/page.tsx`
- `app/(dashboard)/brand-dashboard/coupons/page.tsx`
- `app/(dashboard)/brand-dashboard/analytics/page.tsx`
- `components/dashboard/BrandPortalNav.tsx`
- `components/dashboard/BrandDashboardHome.tsx`
- `components/dashboard/BrandProductsClient.tsx`
- `components/dashboard/BrandInventoryClient.tsx`
- `components/dashboard/BrandCouponsClient.tsx`
- `components/dashboard/BrandAnalyticsClient.tsx`
- `components/orders/BrandOrdersClient.tsx`
- `services/brand-portal/index.ts`
- `types/product.ts`

### Test Checklist
- Brand dashboard loads without Supabase.
- Dashboard metric cards reflect local demo products and orders.
- Products can be added, edited, deleted, and marked sold out.
- Inventory quantities can be increased and decreased.
- Low stock warnings appear for low inventory variants.
- Coupons can be created, edited, deleted, activated, and deactivated.
- Coupon validation blocks missing code, invalid dates, and invalid discount values.
- Analytics cards and bars render from local demo data.
- Orders page still updates demo order status.

### What Should Stay Demo/localStorage
- Brand products.
- Product inventory.
- Coupon records.
- Brand analytics.
- Brand dashboard metrics.

### What Later Needs Supabase/Stripe
- Brand ownership and permissions.
- Product database tables.
- Inventory database tables.
- Coupon/promotion tables.
- Analytics event tables.
- Supabase Storage for product images.
- Stripe promotion/checkout integration where needed.

## Phase 2 — Authentication

### Goal
Restore real account creation and session management after the Phase 1 demo flow is stable.

### Features
- Customer signup.
- Brand owner signup.
- Login and logout.
- Session persistence.
- Role-based redirects.
- Protected customer, brand, and admin areas.

### Files Likely Involved
- `app/(auth)/signup/page.tsx`
- `app/(auth)/login/page.tsx`
- `components/auth/*`
- `components/dashboard/ProtectedDashboardPage.tsx`
- `services/auth/index.ts`
- `supabase/client.ts`
- `supabase/server.ts`
- `supabase/schema/auth-profiles.sql`
- `types/auth.ts`
- `types/supabase.ts`

### Test Checklist
- Customer signup creates Auth user and profile.
- Brand owner signup creates Auth user and profile.
- Login redirects by role.
- Logout clears session.
- Protected routes redirect logged-out users.
- Wrong-role users redirect to the correct dashboard.

### What Should Stay Demo/localStorage
- Marketplace products and orders can remain demo until authentication is stable.
- Brand profile preview can remain localStorage during auth testing.

### What Later Needs Supabase/Stripe
- `profiles` table as source of truth.
- Role management and admin role assignment.
- Server-side route protection.
- Optional OAuth providers.

## Phase 3 — Brand Portal

### Goal
Give independent brands a real workspace to manage their public presence, inventory, and order operations.

### Features
- Brand profile editor.
- Logo upload.
- Product upload.
- Inventory editing.
- Order management.
- Pickup availability and pickup windows.
- Brand analytics.

### Files Likely Involved
- `app/(dashboard)/brand-dashboard/page.tsx`
- `app/(dashboard)/brand-dashboard/orders/page.tsx`
- `components/dashboard/*`
- `components/marketplace/*`
- `services/brands/index.ts`
- `services/products/index.ts`
- `services/orders/index.ts`
- `services/pickup/index.ts`
- `types/brand.ts`
- `types/product.ts`
- `types/order.ts`
- `types/pickup.ts`

### Test Checklist
- Brand can edit profile.
- Brand can upload logo.
- Brand can create, edit, publish, and archive products.
- Inventory changes affect shopper-facing product pages.
- Brand can manage pickup orders.
- Brand analytics render from real data.

### What Should Stay Demo/localStorage
- Analytics can stay mocked until enough real events exist.
- Some onboarding preview states can stay local-only before publishing.

### What Later Needs Supabase/Stripe
- Brand table.
- Product table.
- Inventory table.
- Supabase Storage for logos/product images.
- Order table and pickup tables.
- Event tracking tables for analytics.

## Phase 4 — Customer Accounts

### Goal
Give shoppers persistent account features that improve repeat buying and marketplace trust.

### Features
- Wishlist.
- Order history.
- Reviews.
- Customer profile.
- Addresses.
- Notifications.

### Files Likely Involved
- `app/(dashboard)/dashboard/page.tsx`
- `components/dashboard/*`
- `components/marketplace/*`
- `services/orders/index.ts`
- `services/products/index.ts`
- `types/auth.ts`
- `types/order.ts`
- `types/product.ts`

### Test Checklist
- Customer can save and remove wishlist items.
- Customer can view order history.
- Customer can leave a review after completed order.
- Customer can edit profile and address info.
- Notifications appear for order updates.

### What Should Stay Demo/localStorage
- Notification UI can stay mocked during early account work.
- Wishlist can stay local-only before account persistence.

### What Later Needs Supabase/Stripe
- Wishlist table.
- Reviews table.
- Addresses table.
- Notification/event table.
- Real order-history query by user.

## Phase 5 — Payments

### Goal
Connect real checkout and payout behavior while protecting shoppers and brands.

### Features
- Stripe checkout.
- Payment hold.
- Release to brand.
- Refunds.
- Payment status tracking.
- Fee calculations.

### Files Likely Involved
- `app/checkout/page.tsx`
- `app/orders/[id]/page.tsx`
- `services/payments/index.ts`
- `services/orders/index.ts`
- `types/order.ts`
- `utils/format.ts`
- API route handlers when added.

### Test Checklist
- Stripe checkout session is created safely.
- Payment status is stored on the order.
- Payment is held until pickup/completion rules pass.
- Refund path handles disputes and cancellations.
- Stripe webhooks update orders reliably.

### What Should Stay Demo/localStorage
- Payment-hold messaging can remain in demo until Stripe is wired.
- Demo checkout can remain available for local testing.

### What Later Needs Supabase/Stripe
- Stripe products/prices or dynamic checkout sessions.
- Stripe Connect for brand payouts.
- Webhook handling.
- Payment intents, refunds, and transfer records.
- Order payment state in Supabase.

## Phase 6 — Moderation/Admin

### Goal
Protect marketplace quality, handle disputes, and manage platform operations.

### Features
- Reports.
- Disputes.
- Admin dashboard.
- Brand verification.
- Product moderation.
- Refund/release decision support.
- Demo marketplace overview with order, brand, product, dispute, and approval counts.
- Brand approval queue with approve, reject, and verified states.
- Product flag, hide, and restore controls.
- Demo admin activity log stored in localStorage.

### Files Likely Involved
- `app/(dashboard)/admin/page.tsx`
- `components/dashboard/*`
- `components/admin/AdminDashboardClient.tsx`
- `components/orders/*`
- `services/admin/index.ts`
- `services/orders/index.ts`
- `services/brands/index.ts`
- `services/products/index.ts`
- `types/admin.ts`
- `types/order.ts`
- `types/brand.ts`
- `types/product.ts`

### Test Checklist
- Admin can view reported brands/products.
- Admin can view disputes and order context.
- Admin can mark brands verified.
- Admin can hide or reject products.
- Admin can approve or reject submitted demo brands.
- Admin can resolve disputes in favor of customer or brand.
- Admin can mark disputes as needing investigation.
- Admin can view local admin activity.
- Admin actions are permission-gated.

### What Should Stay Demo/localStorage
- Early moderation UI can use demo disputes from localStorage.
- Admin queue prototypes can use mock data while policies are designed.
- Admin product moderation state can stay localStorage while moderation rules are shaped.
- Admin audit activity can stay localStorage during the demo.

### What Later Needs Supabase/Stripe
- Reports table.
- Disputes table.
- Admin audit log.
- Brand verification fields.
- Product moderation status.
- Payment release/refund actions tied to Stripe.
