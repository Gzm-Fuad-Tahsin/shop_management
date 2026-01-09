# Multi-Tenant Shop Management System - Implementation Guide

## Overview
The system has been successfully updated to support multi-tenant architecture where each manager can create and manage their own shop, with complete data isolation.

## Key Features Implemented

### 1. Manager Registration & Shop Creation Flow
- Managers register through the standard registration page with role "manager"
- Admin must approve manager accounts
- Upon first login, managers see a "Create Shop" dialog
- Once shop is created, all data is automatically scoped to that shop

### 2. Shop Model Enhancement
- **Location**: `backend/src/models/Shop.js`
- Owner reference to User (manager)
- Shop details: name, address, city, state, postal code, phone, email
- Tax settings: taxId, currency, taxRate
- Active/inactive toggle
- Timestamps

### 3. Multi-Tenancy Implementation

#### Product Model (`backend/src/models/Product.js`)
- Added required `shop` field linking to Shop
- Changed SKU from globally unique to unique per shop
- Compound index: `{ shop: 1, sku: 1 }` for shop-scoped uniqueness
- Only managers can see/manage their own shop's products

#### Sale Model (`backend/src/models/Sale.js`)
- Added required `shop` field
- Changed saleNumber from globally unique to unique per shop
- Compound index: `{ shop: 1, saleNumber: 1 }` for shop-scoped uniqueness
- Sales are isolated per shop

#### Inventory Model (`backend/src/models/Inventory.js`)
- Added required `shop` field
- Compound index: `{ shop: 1, product: 1 }` for shop-scoped uniqueness
- Each shop manages its own inventory independently

### 4. API Routes with Shop Filtering

#### Products Route (`backend/src/routes/products.js`)
```
GET /api/products         - Returns products for user's shop (auth required)
GET /api/products/:id     - Verify user has access to product's shop
GET /api/products/barcode/:barcode - Filtered by user's shop
POST /api/products        - Creates product in user's shop automatically
```

#### Inventory Route (`backend/src/routes/inventory.js`)
```
GET /api/inventory        - Returns inventory for user's shop
POST /api/inventory       - Creates inventory entry in user's shop
PUT /api/inventory/:id    - Only if user belongs to inventory's shop
```

#### Sales Route (`backend/src/routes/sales.js`)
```
GET /api/sales            - Returns sales for user's shop (auth required)
GET /api/sales/range      - Filtered by user's shop
POST /api/sales           - Creates sale in user's shop automatically
```

#### Shops Route (NEW) (`backend/src/routes/shops.js`)
```
POST /api/shops           - Manager creates shop (role: manager)
GET /api/shops/my-shop    - Manager gets their shop
GET /api/shops/:id        - Get shop details (with access control)
GET /api/shops            - Admin views all shops
PATCH /api/shops/:id      - Update shop (owner or admin)
```

### 5. User Model Updates (`backend/src/models/User.js`)
- Added `shop` field (reference to Shop model)
- Existing approval system remains intact
- Managers with role "manager" require admin approval
- Shop assignment happens after shop creation

### 6. Auth Routes Updates (`backend/src/routes/auth.js`)
- Login response now includes shop information in JWT and response
- User data includes shop reference
- Token payload includes `shopId` for quick access

### 7. Frontend Components

#### Shop Dialog (`components/shop-dialog.tsx`)
- Form for manager to create shop
- Fields: name (required), address, city, state, postal code, phone, email, taxId, currency, taxRate
- Validation and error handling
- Auto-dismiss on success

#### Dashboard Layout Update (`app/dashboard/layout.tsx`)
- Detects if authenticated user is manager without shop
- Automatically shows ShopDialog on first login
- Refreshes user data after shop creation

### 8. Data Access Control

**For Managers:**
- Can only see products from their own shop
- Can only view sales from their own shop
- Can only manage inventory for their own shop

**For Staff:**
- Automatically associated with manager's shop
- Access only their manager's shop data

**For Admin:**
- Can view all shops, products, sales, inventory
- Has administrative access across all shops

### 9. Approval Workflow

1. **Registration**: New manager registers with role "manager" → approvalStatus: "pending"
2. **Admin Review**: Admin visits `/admin/users` to review pending users
3. **Approval**: Admin approves manager → approvalStatus: "approved"
4. **Login**: Manager logs in successfully → Shop creation dialog appears
5. **Shop Setup**: Manager creates shop → gets assigned to shop
6. **Operation**: Manager and their staff can now operate the shop

## Database Indexes Added

```javascript
// Product
productSchema.index({ shop: 1, sku: 1 }, { unique: true })

// Sale
saleSchema.index({ shop: 1, saleNumber: 1 }, { unique: true })

// Inventory
inventorySchema.index({ shop: 1, product: 1 }, { unique: true })
```

## Security Features

1. **Shop Access Control**: Every API endpoint verifies user's shop association
2. **Token-based Auth**: JWT includes shopId for efficient verification
3. **Role-based Access**: Different routes for different roles (manager, staff, admin)
4. **Data Isolation**: No cross-shop data access possible
5. **Approval System**: Manager accounts require admin approval before they can create shops

## Usage Flow

### For New Manager:
1. Register at `/auth/register` with role "manager"
2. Wait for admin approval
3. Login at `/auth/login`
4. See "Create Shop" dialog
5. Fill in shop details and submit
6. Dashboard refreshes with shop data loaded
7. Can now manage products, inventory, and sales for their shop

### For Admin:
1. Login as admin
2. Visit `/admin/users` to see pending managers
3. Review and approve/reject manager accounts
4. Managers can then create shops

### For Staff:
1. Register as staff
2. Wait for admin approval (optional - can be auto-approved)
3. Gets assigned to a shop by manager
4. Can only see/access their assigned shop's data

## API Response Examples

### Login Response (Manager with Shop)
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "Manager Name",
    "email": "manager@example.com",
    "role": "manager",
    "approvalStatus": "approved",
    "shop": {
      "_id": "shop_id",
      "name": "My Shop",
      "address": "123 Main St",
      "city": "City",
      "state": "State",
      "postalCode": "12345",
      "phone": "555-1234",
      "email": "shop@example.com",
      "currency": "USD",
      "taxRate": 10
    }
  }
}
```

### Products Response (Filtered by Shop)
```json
{
  "products": [...],  // Only products from user's shop
  "total": 10,
  "page": 1,
  "pages": 1
}
```

## Error Handling

- **403 Forbidden**: User trying to access data from different shop
- **400 Bad Request**: User not assigned to any shop (for staff/managers)
- **404 Not Found**: Product/Sale/Inventory not found in user's shop
- **409 Conflict**: SKU already exists for this shop

## Testing Checklist

- [ ] Manager can register
- [ ] Admin can approve manager
- [ ] Manager sees shop creation dialog on first login
- [ ] Manager can create shop
- [ ] Manager can create products for their shop only
- [ ] Manager can create inventory for their shop only
- [ ] Manager can record sales for their shop only
- [ ] Staff cannot access other shops' data
- [ ] Admin can view all shops
- [ ] SKU uniqueness is per-shop (same SKU in different shops allowed)
- [ ] Sale numbers are per-shop (same number in different shops allowed)
- [ ] Inventory isolation works correctly

## Files Modified

### Backend
- `src/models/Product.js` - Added shop field and compound index
- `src/models/Sale.js` - Added shop field and compound index
- `src/models/Inventory.js` - Added shop field and compound index
- `src/models/User.js` - Already had shop field
- `src/routes/auth.js` - Updated login to include shop
- `src/routes/products.js` - Added shop filtering
- `src/routes/inventory.js` - Added shop filtering
- `src/routes/sales.js` - Added shop filtering
- `src/routes/shops.js` - NEW
- `src/index.js` - Added shops route

### Frontend
- `components/shop-dialog.tsx` - NEW
- `components/inventory-dialog.tsx` - Updated to work with auth
- `app/dashboard/layout.tsx` - Added shop setup check
- `hooks/use-shop-setup.ts` - NEW (optional utility)

## Migration Notes

If you have existing data, you'll need to:
1. Add default shop for existing products/sales
2. Update indexes on existing collections
3. Backfill shop references for existing data

Run these MongoDB commands to add the new indexes:
```javascript
db.products.createIndex({ shop: 1, sku: 1 }, { unique: true })
db.sales.createIndex({ shop: 1, saleNumber: 1 }, { unique: true })
db.inventories.createIndex({ shop: 1, product: 1 }, { unique: true })
```

## Future Enhancements

1. Staff management by managers (assign staff to shop)
2. Multi-shop admin dashboard
3. Shop-specific reports
4. Batch operations across shops
5. Shop templates for quick setup
6. Shop subscription tiers
7. Audit logs per shop
