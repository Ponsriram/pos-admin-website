# Pending Integration Work — Admin Website ↔ Backend

> Analysis of gaps for the **admin-only** website. Employee/POS/terminal/KOT/kitchen features are handled by a separate desktop app and are excluded from this analysis.

---

## 🔴 Critical Issues (Blocking Core Functionality)

### 1. Menu/Category Route Mismatch

The frontend calls routes that don't exist on the backend:

| Frontend Route (api.ts) | Correct Backend Route |
|---|---|
| `GET /stores/{id}/categories` | `GET /products/categories?store_id={id}` |
| `POST /stores/{id}/categories` | `POST /products/categories?store_id={id}` |
| `DELETE /stores/{id}/categories/{cid}` | `DELETE /products/categories/{cid}?store_id={id}` |
| `PUT /stores/{id}/categories/{cid}` | ❌ **No backend endpoint** |
| `GET /stores/{id}/menu-items` | `GET /products?store_id={id}` |
| `POST /stores/{id}/menu-items` | `POST /products?store_id={id}` |
| `PUT /stores/{id}/menu-items/{iid}` | `PUT /products/{iid}?store_id={id}` |
| `DELETE /stores/{id}/menu-items/{iid}` | `DELETE /products/{iid}?store_id={id}` |

**Also:** Frontend `MenuItem` type uses `is_available`, `is_vegetarian`, `image_url`; backend `Product` model uses `is_active`, `tax_percent` — no `is_vegetarian` or `image_url` fields.

**Work needed:**
- **Frontend:** Remap all routes in `api.ts` from `/stores/{id}/categories` → `/products/categories` and `/stores/{id}/menu-items` → `/products`
- **Frontend:** Align `MenuItem`/`Category` types with `ProductResponse`/`CategoryResponse`
- **Backend:** Add `PUT /products/categories/{id}` for category editing

---

### 2. Analytics `by-store` Response Shape Mismatch

| Frontend expects | Backend returns |
|---|---|
| `Record<string, AnalyticsSummary>` | `OutletAnalyticsResponse { outlets: OutletStat[], totals: AnalyticsSummary }` |

**Work needed:** Update `api.ts` return type and dashboard page to handle `outlets[]` array.

---

### 3. Missing Backend Endpoints (Called by Frontend)

| Frontend calls | Backend status | Fix |
|---|---|---|
| `DELETE /stores/{id}` | ❌ Not implemented | **Backend:** Add delete store endpoint |
| `DELETE /employees/{id}` | ❌ Not implemented | **Backend:** Add delete employee endpoint |
| `GET /employees/{id}` | ❌ Not implemented | **Backend:** Add single employee GET |
| `PUT /stores/{id}/categories/{cid}` | ❌ Not implemented | **Backend:** Add category update |
| `GET /stores/{id}/orders/{oid}/timeline` | ❌ Not implemented | **Backend:** Add order timeline/audit endpoint |
| `PUT /stores/{id}/categories/reorder` | ❌ Not implemented | Remove from frontend or add to backend |
| `PUT /stores/{id}/menu-items/reorder` | ❌ Not implemented | Remove from frontend or add to backend |
| `PUT /stores/{id}/menu-items/bulk` | ❌ Not implemented | Remove from frontend or add to backend |

---

### 4. POS Page — Admin Cannot Create Orders

The `POST /orders` endpoint requires an **employee JWT** (EmployeeContext). The admin website uses admin JWT.

**Resolution:** Since order creation is handled by the employee desktop app, **remove or disable the POS page** (`/dashboard/orders`) from the admin website, or keep it as **read-only order monitoring** (listing/viewing orders works with admin JWT).

---

## 🟡 Frontend Pages Without Implementation

The sidebar links to pages that have **no frontend code** yet, but the backend has API support:

| Page | Backend Routes Ready | Admin Relevance |
|------|---------------------|-----------------|
| **Inventory** `/dashboard/inventory` | Items, stock levels, adjustments, recipes, transfers, out-of-stock | ✅ High — admin manages stock |
| **Reports** `/dashboard/reports` | 22 predefined report types, generate/view reports | ✅ High — admin reviews reports |
| **History** `/dashboard/history` | Orders list with date filters, day-close summaries, shifts | ✅ Medium — admin reviews past activity |
| **Settings** `/dashboard/settings` | `PUT /users/me` for profile updates | ✅ Medium — admin profile editing |
| **Help** `/dashboard/help` | N/A (static content) | Low |

---

## 🟡 Backend Features Available but Not Used by Admin Website

| Backend Module | Admin Use Case | Effort to Integrate |
|---|---|---|
| **Shifts** (`/shifts`) | View shift reports, day-close summaries | Medium |
| **Reports** (`/reports`) | Generate and view sales/inventory/finance reports | Medium |
| **Guests/CRM** (`/guests`) | View customer profiles, loyalty tracking | Medium |
| **Marketing** (`/marketing`) | Manage campaigns, coupons, promotions | Large |
| **Delivery** (`/delivery`) | Monitor delivery orders and aggregator stats | Medium |
| **Purchasing** (`/purchasing`) | Manage purchase orders and suppliers | Large |
| **Expenses** (`/stores/expenses`) | Track store operational expenses | Small |
| **Ledger** (`/ledger`) | City ledger and accounting entries | Large |
| **Chains** (`/chains`) | Multi-store chain management settings | Medium |
| **User Management** (`/users`) | Create/manage sub-users with cloud access | Medium |
| **Permission Groups** (`/groups`) | Manage admin/biller permission groups | Medium |
| **Notifications** (`/notifications`) | In-app notifications for admin | Medium |
| **Audit Logs** (`/audit`) | View system event audit trail | Small |
| **Integrations** (`/integrations`) | Manage third-party delivery/payment integrations | Large |

---

## 🟢 Minor Fixes Needed

### Frontend

1. **Payment field inconsistency** — Uses both `payment_method` and `method` across pages. Backend uses `payment_method`. Standardize.
2. **Order amounts** — Frontend uses `total`/`subtotal`/`tax`/`discount` as fallbacks alongside `net_amount`/`gross_amount`/`tax_amount`/`discount_amount`. Can clean up once backend is the sole source.
3. **Menu system** — Backend has a separate `/menus` system (scheduling, pricing rules, menu→item linking) that's distinct from `/products`. Admin may want to manage menu schedules and pricing in the future.

### Backend

1. **Add `DELETE /stores/{store_id}`** endpoint
2. **Add `DELETE /employees/{employee_id}`** endpoint
3. **Add `GET /employees/{employee_id}`** endpoint
4. **Add `PUT /products/categories/{category_id}`** for editing
5. **Add order timeline/audit endpoint** for admin order detail view

---

## Priority Order

| Priority | Task | Effort |
|----------|------|--------|
| **P0** | Fix menu/categories route mapping in `api.ts` to use `/products` routes | Small |
| **P0** | Align `MenuItem`↔`Product` field names (`is_available`→`is_active`, remove `image_url`/`is_vegetarian`) | Small |
| **P0** | Fix `analytics/summary/by-store` response type in frontend | Small |
| **P0** | Decide: remove POS page or make it read-only order monitor | Small |
| **P1** | Backend: add missing CRUD endpoints (store delete, employee delete/get, category update) | Medium |
| **P1** | Backend: add order timeline endpoint | Medium |
| **P1** | Standardize payment field names in frontend | Small |
| **P2** | Build Inventory page (backend ready) | Large |
| **P2** | Build Reports page (backend ready) | Large |
| **P2** | Build History/Shifts page (backend ready) | Medium |
| **P3** | Build Settings page with profile editing | Medium |
| **P3** | Integrate Permission Groups and User Management | Medium |
| **P4** | Build Delivery, Guest CRM, Marketing, Purchasing pages | Very Large |
