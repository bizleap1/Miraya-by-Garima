# PDP WRONG PRODUCT SWITCHING BUG - FIX REPORT

**Date:** September 3, 2026  
**Status:** FIXED & VERIFIED (Build: 0 errors)

---

## 1. Exact Root Cause
The root cause was a combination of **static index-arithmetic fallback miscalculation** in `getProductById` (`src/data/products.js`) and **non-authoritative title priority** in `ProductDetailPage.jsx`:

1. **Flawed Numeric Fallback Arithmetic**:  
   `getProductById` in `src/data/products.js` had legacy numeric index logic:
   ```js
   if (numId >= 26 && numId <= 41 && productsData['dresses']) {
     const dressIdx = numId - 26;
     return productsData['dresses'][dressIdx];
   }
   ```
   When the live production database returned products with database primary key `id`s between 26 and 41 (or integer IDs), `getProductById` misinterpreted the DB primary key as an array index offset in `productsData['dresses']`. For DB primary key `28` (or offset `2`), it returned static Dress #3: `"Obsidian Black Cut-Out Back Halter Evening Gown"`.

2. **Non-Authoritative Title Priority**:  
   In `ProductDetailPage.jsx`, `setProduct(...)` merged the state using `title: localMatch.title || data.name || data.title`. Because `localMatch` produced the wrong dress object, `localMatch.title` ("Obsidian Black...") overwrote `data.name` ("Red Indo Western Suit") 0.5–1s after the backend API response resolved.

3. **Async Race Conditions & Socket Payload Overwrite**:  
   - Async fetches lacked subscriber/route cancellation guards (`isSubscribed`), allowing out-of-order API responses to set product state when switching routes.
   - Socket listeners (`product.updated`, `inventory.updated`) did not strictly verify that `event.productId === currentProductId` before performing state updates and refetches.

---

## 2. Which State Setter Caused Overwrite
- **Primary Overwrite Setter**: `setProduct({ ...localMatch, ...data, title: localMatch.title || data.name ... })` inside `fetchProduct()` in `src/views/ProductDetailPage.jsx`.
- **Secondary Overwrite Risk**: Socket refetch handler in `src/views/ProductDetailPage.jsx` when handling realtime updates without matching `productId`.

---

## 3. Whether Socket.IO Was Responsible
- **Partial Role**: Socket.IO was not the primary trigger for the initial load switch, but its handlers (`product.updated` and `inventory.updated`) were vulnerable because they did not validate `event.productId` or `event.id` against `currentProductId`, which could cause state overwrites if any global product update occurred while viewing a PDP.
- **Fix**: Added strict guards: `if (!eventProductId || String(eventProductId) !== String(currentProductId)) return;` both before triggering refetch and before committing state updates.

---

## 4. Whether Route/Fetch Cache Contributed
- **Contribution**: Un-guarded async fetch promises (`fetchProduct()`) caused race conditions when navigating between products quickly. If a fetch for Product A resolved after user navigated to Product B, Product A's data overwrote Product B's view.
- **Fix**: Implemented `isSubscribed` flag inside `useEffect` and `initialProduct` route-ID validation to guarantee stale fetches and mismatched initial state are discarded.

---

## 5. Files Changed
1. **[`src/data/products.js`](file:///d:/Miraya-by-Garima-main%20%281%29/Miraya-by-Garima-main/src/data/products.js)**:
   - Removed dangerous hardcoded numeric index offset arithmetic (`numId - 26`, `catList[numId - 1]`, `allProducts[numId - 1]`).
   - Standardized `getProductById` to rely strictly on exact string IDs (`iw-4`, `dress-1`), composite IDs (`indo-western-iw-4`), or title/slug matches.

2. **[`src/views/ProductDetailPage.jsx`](file:///d:/Miraya-by-Garima-main%20%281%29/Miraya-by-Garima-main/src/views/ProductDetailPage.jsx)**:
   - Added validation ensuring `initialProduct` only initializes state if its ID or slug matches the current route parameter `id`.
   - Guaranteed backend API data (`data.name` / `data.title`) is strictly authoritative over local match metadata.
   - Added `isSubscribed` cleanup flag to `useEffect` to drop stale async fetch responses.
   - Enforced strict ID matching in `product.updated` and `inventory.updated` Socket.IO listeners.

---

## 6. 10-Product Stability Test
Tested 10 distinct products across all categories:
1. **Red Indo Western Suit** (`indo-western/iw-4`) -> Stable (Title/Image/Price intact after 10+s).
2. **Pink Blush Lehenga** (`indo-western/iw-1`) -> Stable.
3. **Grey Drape Saree** (`drape-sarees/ds-1`) -> Stable.
4. **Black Drape Saree** (`drape-sarees/ds-3`) -> Stable.
5. **Red Suit** (`designer-suits/suit-1`) -> Stable.
6. **Rajastani Pink Material** (`premium-suit-materials/psm-1`) -> Stable.
7. **Grey Co-ord Set** (`coord-sets/coord-1`) -> Stable.
8. **Rose Gold Fringe Crop Top Set** (`dresses/dress-1`) -> Stable.
9. **Obsidian Black Evening Gown** (`dresses/dress-3`) -> Stable.
10. **Scarlet Red Embroidered Vest Jacket Set** (`dresses/dress-5`) -> Stable.

*Result:* **PASS** — 0 title/image/price auto-switches across all tested items.

---

## 7. Two-Tab Isolation Test
- **Tab 1:** Open Product A (`Red Indo Western Suit`).
- **Tab 2:** Open Product B (`Obsidian Black Evening Gown`).
- Admin updates Product A price/stock via backend socket event.
- **Observed Behavior:** Tab 1 updates price/stock seamlessly. Tab 2 remains strictly isolated on Product B with zero state mutations.

*Result:* **PASS** — Complete realtime event isolation.

---

## 8. Realtime Regression Result
- Active product realtime updates (`product.updated` and `inventory.updated`) continue to update price, stock, and variant status immediately on the active PDP tab.
- Unrelated product socket broadcasts are safely ignored.

*Result:* **PASS** — 0 regressions in realtime functionality.

---

## 9. Build Result
- Command: `npm run build`
- Outcome: **0 Errors** (Compiled successfully in Next.js 16.3.2 Turbopack environment).
