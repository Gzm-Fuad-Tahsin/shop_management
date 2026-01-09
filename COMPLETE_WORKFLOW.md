# Complete Workflow Documentation - Multi-Tenant Shop Management System

## User Roles & Responsibilities

### Admin Role
- Registers first (should have admin role pre-assigned)
- Approves/rejects manager and staff registrations
- Can view all shops and data across the system
- Cannot create shops (shop creation is for managers only)

### Manager Role  
- Registers and awaits admin approval
- After approval, logs in and creates a shop
- Manages own shop: products, sales, inventory, customers
- Can view their shop's data only
- Can invite/manage staff for their shop

### Staff Role
- Registers and awaits approval
- Assigned to a manager's shop
- Works within that shop only
- Can record sales, manage inventory, add customers
- Cannot see other shops' data

---

## Complete User Journey

### Journey 1: First Admin Setup (One-Time)

```
STEP 1: Initial Setup
├─ Admin account is created (manually or during installation)
├─ Admin logs in at /auth/login
└─ Dashboard is accessible

STEP 2: Admin Workspace
├─ Admin can see /admin/users (for approvals)
├─ Admin can view all shops (/api/shops)
├─ Admin can view all data across shops
└─ Ready to approve managers
```

### Journey 2: Manager Registration & Shop Creation

```
STEP 1: Manager Registration
├─ New manager goes to /auth/register
├─ Fills form:
│  ├─ Name: "John Smith"
│  ├─ Email: "john@email.com"
│  ├─ Password: secure password
│  └─ Role: SELECT "Manager"
├─ Submits registration
└─ Receives: "Wait for admin approval" message

STEP 2: Admin Approval
├─ Admin logs in
├─ Navigates to /admin/users
├─ Sees "John Smith" in pending users
├─ Reviews manager details
├─ Clicks "Approve"
└─ Manager's approvalStatus changes to "approved"

STEP 3: Manager's First Login
├─ Manager goes to /auth/login
├─ Email: john@email.com
├─ Password: (the one they set)
├─ Clicks Login
├─ Frontend checks: role == "manager" && !user.shop
├─ Automatically shows "Create Shop" dialog
└─ [DIALOG APPEARS]

STEP 4: Shop Creation Dialog
┌─────────────────────────────────┐
│   Create Shop                    │
├─────────────────────────────────┤
│ Shop Name *: [________]          │
│ Address:    [________]           │
│ City:       [________]           │
│ State:      [________]           │
│ Postal:     [________]           │
│ Phone:      [________]           │
│ Email:      [________]           │
│ Currency:   [USD_____]           │
│ Tax Rate %: [0______]            │
│ Tax ID:     [________]           │
│                                  │
│ [Create Shop]                    │
└─────────────────────────────────┘

STEP 5: Shop Creation Processing
├─ Manager fills in shop details
├─ Clicks "Create Shop"
├─ Frontend sends: POST /api/shops
│  └─ { name, address, city, state, postalCode, phone, email, currency, taxRate }
├─ Backend:
│  ├─ Creates Shop document
│  ├─ Links to current user: shop.owner = userId
│  ├─ Updates User: user.shop = shopId
│  └─ Returns created shop object
├─ Frontend receives success
├─ Dialog closes
├─ Page refreshes
└─ Manager now has a shop!

STEP 6: Manager Dashboard Access
├─ Manager can now create products for their shop
├─ All products filtered to show only their shop's products
├─ Can record sales for their shop
├─ Can manage inventory for their shop
├─ Can add customers for their shop
├─ Shop name appears in topbar/sidebar
└─ Ready to operate business!
```

### Journey 3: Staff Registration

```
STEP 1: Staff Registration
├─ New staff goes to /auth/register
├─ Fills form:
│  ├─ Name: "Jane Doe"
│  ├─ Email: "jane@email.com"
│  ├─ Password: secure password
│  └─ Role: SELECT "Staff"
├─ Submits registration
└─ Receives: "Wait for approval" message

STEP 2: Approval (Admin or Manager)
├─ Admin (or manager) goes to /admin/users
├─ Sees "Jane Doe" in pending
├─ Approves Jane
└─ Jane's approvalStatus = "approved"

STEP 3: Staff First Login
├─ Jane logs in at /auth/login
├─ Gets redirected to /dashboard
├─ Dashboard loads with assigned shop
└─ Can see:
   ├─ Products for their shop only
   ├─ Inventory for their shop
   ├─ Customers for their shop
   └─ All other shops' data is HIDDEN

STEP 4: Staff Can Operate
├─ Record sales
├─ View inventory
├─ Add customers
├─ Create transactions
└─ All operations scoped to their shop
```

---

## API Call Flows

### Flow 1: Create Product (After Shop is Created)

```
Frontend: Manager clicks "New Product"
    │
    ├─ User object has: { shop: "shop_123", role: "manager" }
    │
    ├─ Shows Product Dialog
    │
    └─ Manager fills:
       ├─ Name: "Laptop"
       ├─ SKU: "LAPTOP-001"  ← Must be unique within shop_123
       ├─ Category: "Electronics"
       ├─ Cost Price: 500
       └─ Retail Price: 800

POST /api/products
{
  "name": "Laptop",
  "sku": "LAPTOP-001",
  "category": "cat_123",
  "costPrice": 500,
  "retailPrice": 800
}

Headers: Authorization: Bearer jwt_token
         (JWT contains: { shopId: "shop_123" })

Backend Processing:
├─ verifyToken() → req.user = { id, role, shopId }
├─ Fetch user from DB to confirm shop
├─ Check if SKU exists in user's shop
│  └─ Query: { shop: "shop_123", sku: "LAPTOP-001" }
│  └─ If exists → 409 Conflict
├─ Create product with shop_123
│  └─ Product = { 
│     shop: "shop_123",
│     name: "Laptop",
│     sku: "LAPTOP-001",
│     ...
│  }
├─ Save to DB
└─ Return product with shop data

Response:
{
  "_id": "prod_456",
  "shop": "shop_123",
  "name": "Laptop",
  "sku": "LAPTOP-001",
  ...
}

Frontend:
├─ Dialog closes
├─ Product list refreshes
├─ New product appears in manager's product list
└─ Note: Manager2's products won't show this product
```

### Flow 2: Create Sale

```
Frontend: Manager records sale
    │
    ├─ Manager selects products
    │  └─ Products shown = only those from their shop
    │
    ├─ Adds customer
    │  └─ Customers shown = only those from their shop
    │
    └─ Enters payment details

POST /api/sales
{
  "items": [
    { "product": "prod_456", "quantity": 1, "unitPrice": 800 }
  ],
  "customerName": "John Customer",
  "totalAmount": 800,
  "paymentMethod": "cash"
}

Backend Processing:
├─ Verify user has shop
├─ For each item:
│  ├─ Fetch product (prod_456)
│  ├─ Check: product.shop == user.shop
│  │  └─ If not → 403 Forbidden
│  ├─ Check inventory in user's shop
│  │  └─ Query: { shop: user.shop, product: prod_456 }
│  └─ Reserve quantity
├─ Create Sale with shop info
│  └─ Sale = {
│     shop: "shop_123",
│     saleNumber: "SALE-1234567890",
│     items: [...],
│     ...
│  }
├─ Update inventory
│  └─ Decrease quantity in user's shop
└─ Save and return

Response: Sale created successfully
```

### Flow 3: View Products (Filter by Shop)

```
Frontend: Manager navigates to /products
    │
    └─ page.tsx loads

GET /api/products
Headers: Authorization: Bearer jwt_token

Backend:
├─ verifyToken() → req.user
├─ Fetch user: User.findById(req.user.id)
├─ Create query
│  └─ For non-admin: query = { shop: user.shop, isActive: true }
│  └─ For admin: query = { isActive: true } (no shop filter)
├─ Execute find
│  └─ Products where shop matches
├─ Populate shop and creator details
└─ Return paginated results

Response:
{
  "products": [
    {
      "_id": "prod_456",
      "shop": { "_id": "shop_123", "name": "My Shop" },
      "name": "Laptop",
      "sku": "LAPTOP-001",
      ...
    }
  ],
  "total": 5,
  "page": 1,
  "pages": 1
}

Frontend:
├─ Only products from their shop shown
├─ If they try to access another shop's product
│  └─ GET /api/products/prod_789 (from shop_456)
│  └─ Response: 403 Forbidden
└─ Complete data isolation
```

---

## Data Isolation Verification

### Scenario: Two Managers, Two Shops

```
Manager A                          Manager B
├─ Shop A                          ├─ Shop B
├─ Products:                       ├─ Products:
│  ├─ SKU-001 ✓                   │  ├─ SKU-001 ✓  (same SKU OK!)
│  └─ SKU-002                     │  └─ SKU-003
├─ Customers:                      ├─ Customers:
│  ├─ John Doe                    │  ├─ Jane Smith
│  └─ Mary Smith                  │  └─ Bob Wilson
└─ Sales:                          └─ Sales:
   ├─ SALE-001 by Manager A       │  ├─ SALE-001 by Manager B (different)
   └─ SALE-002 by Manager A       │  └─ SALE-002 by Manager B

When Manager A logs in:
├─ GET /api/products → Only SKU-001, SKU-002 from Shop A
├─ GET /api/customers → Only John Doe, Mary Smith
├─ GET /api/sales → Only SALE-001, SALE-002 by Manager A
└─ No access to Shop B data

When Manager B logs in:
├─ GET /api/products → Only SKU-001, SKU-003 from Shop B
├─ GET /api/customers → Only Jane Smith, Bob Wilson
├─ GET /api/sales → Only SALE-001, SALE-002 by Manager B
└─ No access to Shop A data

When Admin logs in:
├─ GET /api/shops → Shop A, Shop B
├─ GET /api/products → ALL products (with shop filter optional)
├─ GET /api/customers → ALL customers
└─ GET /api/sales → ALL sales
```

---

## Error Scenarios & Handling

### Scenario 1: Manager without shop tries to create product

```
User: Manager (no shop assigned)
POST /api/products {...}

Backend:
├─ verifyToken() → OK
├─ authorizeRole(["admin", "manager"]) → OK
├─ User.findById(req.user.id)
├─ Check: !user.shop && user.role !== "admin"
│  └─ YES: user is manager but has no shop
├─ Return: 400 Bad Request
└─ Message: "You must be assigned to a shop first"

Frontend:
├─ Alert: "You must create a shop first"
├─ Or: Redirect to shop creation
└─ User cannot proceed
```

### Scenario 2: Staff tries to access other shop's product

```
User: Staff in Shop A
Request: GET /api/products/prod_999 (from Shop B)

Backend:
├─ verifyToken() → OK
├─ Fetch product (prod_999)
├─ Fetch user → user.shop = "shop_a"
├─ Check: product.shop ("shop_b") == user.shop ("shop_a")
│  └─ NO: doesn't match
├─ Return: 403 Forbidden
└─ Message: "Access denied"

Frontend:
├─ HTTP 403 received
├─ Alert: "You don't have access to this resource"
└─ Redirect: /dashboard
```

### Scenario 3: Duplicate SKU in same shop

```
User: Manager in Shop A
POST /api/products
{ "sku": "LAPTOP-001", ... }

Backend:
├─ Query existing: { shop: "shop_a", sku: "LAPTOP-001" }
├─ Result: Found (already exists)
├─ Return: 409 Conflict
└─ Message: "SKU already exists for this shop"

Frontend:
├─ Alert: "This SKU is already in use"
└─ User must choose different SKU
```

### Scenario 4: Same SKU in different shops (ALLOWED)

```
Manager A in Shop A:
├─ Creates: SKU "LAPTOP-001"
│  └─ Database: { shop: "shop_a", sku: "LAPTOP-001" } ✓

Manager B in Shop B:
├─ Creates: SKU "LAPTOP-001"
│  └─ Database: { shop: "shop_b", sku: "LAPTOP-001" } ✓
│  └─ Compound index allows (different shop)

Result:
├─ Both shops can use "LAPTOP-001"
├─ No conflict
├─ Data correctly isolated
└─ Independent operations
```

---

## Authentication & Authorization Flow

```
┌─────────────────────────────────────────┐
│         User Login                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  Validate Email    │
         │  & Password        │
         └────────┬───────────┘
                  │
          ┌───────┴────────┐
          │                │
      ✗ (401)           ✓ (200)
          │                │
          ▼                ▼
    ┌──────────┐    ┌─────────────────┐
    │  Reject  │    │ Create JWT Token│
    └──────────┘    │ Payload:        │
                    │ {               │
                    │   id, role,     │
                    │   shopId        │
                    │ }               │
                    └────────┬────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Send to Frontend│
                    │  {               │
                    │   token,         │
                    │   user: {...}    │
                    │  }               │
                    └────────┬─────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ┌──────────────┐  ┌────────────────┐
            │ localStorage │  │   Redirect to  │
            │ .setItem(    │  │   /dashboard   │
            │  "token"     │  └────────────────┘
            │ )            │
            └──────────────┘
                    │
                    ▼
    ┌────────────────────────────────┐
    │   Subsequent API Requests      │
    │ Headers: {                     │
    │   Authorization: Bearer token  │
    │ }                              │
    └────────┬───────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │   Backend:             │
    │   verifyToken()        │
    │   - Decode JWT         │
    │   - Validate signature │
    │   - Extract user info  │
    │   - Attach to req.user │
    └────────┬───────────────┘
             │
             ▼
    ┌──────────────────────┐
    │  Apply Shop Filter   │
    │  - Check role        │
    │  - If !admin:        │
    │    add shop filter   │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │  Execute Query       │
    │  - Filtered by shop  │
    │  - User sees only    │
    │    their shop data   │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │  Return Response     │
    │  - Data for their    │
    │    shop only         │
    └──────────────────────┘
```

---

## Summary

The multi-tenant system provides:
1. **Complete Isolation**: Each shop's data is completely separate
2. **Easy Onboarding**: Managers can create shops themselves
3. **Security**: Role-based access with shop verification
4. **Scalability**: Supports unlimited shops
5. **Flexibility**: Shared platform, independent operations

All operations are secured by:
- JWT authentication
- Role-based authorization
- Shop ownership verification
- Compound database indexes
