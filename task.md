# Phase 1 — Production Foundation Tasks

## Security & Auth Infrastructure
- [x] Create `config/env.js` — centralized env validation, fail-fast on missing secrets
- [x] Rewrite `auth.middleware.js` — remove JWT fallback, invoice bypass, add RBAC (super_admin, admin, store_manager, inventory_staff, cashier, customer)
- [x] Fix `auth.controller.js` — remove hardcoded JWT secrets, add `setUserRole` endpoint
- [x] Create `middleware/rateLimiter.middleware.js` — auth, OTP, payment rate limiters
- [x] Create `middleware/errorHandler.middleware.js` with AppError class & async handler wrapper
- [x] Wire up middleware in `app.js`

## Route Protection
- [x] Protect all POS routes in `pos.routes.js` (cashier, store_manager, admin, super_admin)
- [x] Fix invoice auth in `order.controller.js` and `order.routes.js` (owner or admin/manager only)
- [x] Update `stats.routes.js` for new roles (store_manager, admin, super_admin)
- [x] Update `auth.routes.js` — rate limiting, super_admin role management

## Concurrency-Safe Inventory
- [x] Rewrite `inventory.service.js` — atomic deduction (`UPDATE ... WHERE stock >= qty`), remove auto-create variant, ProductVariant source of truth
- [x] Fix `order.controller.js` — ORD-TEMP race with unique refs, server-side prices from ProductVariant, invoice auth
- [x] Harden `pos.controller.js` — role-based discount limits (Cashier: max 5%, Store Manager: max 15%, Admin: unlimited), server-side total calculations

## Payment Hardening
- [x] Fix `payment.controller.js` — server-side cart amount calculation, idempotency checks on `gateway_payment_id`, remove secret fallback, add webhook verification
- [x] Fix `config/razorpay.js` — remove dummy fallback keys

## Database Schema
- [x] Update `schema.prisma` — indexes on hot query columns, `barcode` on ProductVariant, `low_stock_alert`, `Supplier`, `Purchase`, `PurchaseItem`, `AdminAuditLog` models, double-cancel protection
- [x] Run `npx prisma format` (Validated & formatted in 23ms)
- [x] Run `npx prisma validate` (Validated 🚀)
- [x] Run `npx prisma generate` (Generated Prisma Client v6.19.3)

## Admin Dashboard
- [x] Fix `AdminDashboard.jsx` — remove all fake/fallback data, handle loading & API error states cleanly
- [x] Fix `AdminOverviewSection.jsx` — remove hardcoded fallbacks, display "Unable to load dashboard data." when API is offline
- [x] Fix `AdminPOSSection.jsx` — include Bearer token authorization in all fetch calls, remove fake catalog fallback
- [x] Fix `AdminOrdersSection.jsx` — pass token in invoice PDF download link

## Testing & Verification
- [x] Install `express-rate-limit`
- [x] Create `tests/phase1.test.js` (16 comprehensive tests)
- [x] Execute backend test suite: **16 PASSED, 0 FAILED**
- [x] Run frontend build (`npm run build`): **Built in 632ms with 0 errors**
