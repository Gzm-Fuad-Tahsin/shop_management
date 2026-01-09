# Quick Start Guide - Multi-Tenant Shop Management System

## What Was Implemented

You now have a complete multi-tenant shop management system where:
1. **Managers** can register and create their own shops
2. **Admins** approve manager accounts
3. **Staff** members work within their assigned shops
4. **Complete data isolation** - each shop's data is completely separate
5. **All operations** (products, sales, inventory, customers) are shop-scoped

---

## Quick Start

### For Admins

1. **Login as Admin**
   - Navigate to `/auth/login`
   - Use your admin credentials

2. **Approve Pending Managers**
   - Go to `/admin/users`
   - Review pending manager registrations
   - Click "Approve" or "Reject" for each manager

3. **View All Shops**
   - API endpoint: `GET /api/shops`
   - You can see and manage all shops in the system

### For Managers

1. **Register as Manager**
   - Go to `/auth/register`
   - Select **"Manager"** as role
   - Complete registration and wait for admin approval

2. **First Login - Create Your Shop**
   - Login at `/auth/login`
   - A dialog will pop up asking to create your shop
   - Fill in your shop details:
     - **Shop Name** (required): e.g., "John's Electronics"
     - Address, City, State, Postal Code
     - Phone, Email
     - Tax ID, Currency, Tax Rate (optional)
   - Click "Create Shop"

3. **Start Managing**
   - Dashboard will refresh
   - Now you can:
     - Create and manage products
     - Record sales
     - Manage inventory
     - Add and track customers
     - Create product categories

### For Staff

1. **Register as Staff**
   - Go to `/auth/register`
   - Select **"Staff"** as role
   - Wait for approval (manager or admin)

2. **Login and Work**
   - Login at `/auth/login`
   - Access only your assigned shop's data
   - Create sales, manage inventory, view products

---

## Key Features

### Manager Features
- ✅ Create and manage shop details
- ✅ Create products (with shop-specific SKU)
- ✅ Record sales
- ✅ Manage inventory
- ✅ Add customers
- ✅ Create product categories
- ✅ View reports for their shop only

### Admin Features
- ✅ View and manage all shops
- ✅ Approve/reject manager registrations
- ✅ View all products across shops
- ✅ View all sales across shops
- ✅ Access global admin dashboard

### Staff Features
- ✅ Record sales for their shop
- ✅ View inventory for their shop
- ✅ Manage customers for their shop
- ✅ View products for their shop

---

## Data Isolation

Each shop is completely isolated:

| Data Type | Isolation |
|-----------|-----------|
| Products | Shop-scoped (can have same SKU in different shops) |
| Sales | Shop-scoped (can have same sale number in different shops) |
| Inventory | Shop-scoped |
| Customers | Shop-scoped |
| Categories | Shop-scoped |

---

## API Endpoints Summary

### Authentication
```
POST /api/auth/register          - Register new user
POST /api/auth/login              - Login
GET /api/auth/pending-users       - List pending users (admin only)
POST /api/auth/approve-user/:id   - Approve user (admin only)
POST /api/auth/reject-user/:id    - Reject user (admin only)
```

### Shop Management
```
POST /api/shops                 - Create shop (manager only)
GET /api/shops                  - List all shops (admin only)
GET /api/shops/:id              - Get shop details
GET /api/shops/my-shop          - Get current user's shop (manager)
PATCH /api/shops/:id            - Update shop
```

### Products
```
GET /api/products               - List products for current shop
GET /api/products/:id           - Get product details
GET /api/products/barcode/:code - Get product by barcode
POST /api/products              - Create product
```

### Sales
```
GET /api/sales                  - List sales for current shop
GET /api/sales/range            - Get sales by date range
POST /api/sales                 - Create new sale
```

### Inventory
```
GET /api/inventory              - List inventory for current shop
GET /api/inventory/product/:id  - Get inventory for product
POST /api/inventory             - Add inventory
PUT /api/inventory/:id          - Update inventory
```

### Customers
```
GET /api/customers              - List customers for current shop
GET /api/customers/:id          - Get customer details
POST /api/customers             - Create customer
POST /api/customers/quick       - Quick create (for POS)
```

### Categories
```
GET /api/categories             - List categories for current shop
POST /api/categories            - Create category
PUT /api/categories/:id         - Update category
```

---

## Database Setup

Run these commands in MongoDB to create the necessary indexes:

```javascript
// Products - Unique SKU per shop
db.products.createIndex({ shop: 1, sku: 1 }, { unique: true })

// Sales - Unique sale number per shop
db.sales.createIndex({ shop: 1, saleNumber: 1 }, { unique: true })

// Inventory - Unique product per shop
db.inventories.createIndex({ shop: 1, product: 1 }, { unique: true })

// Categories - Unique category name per shop
db.categories.createIndex({ shop: 1, name: 1 }, { unique: true })
```

---

## Environment Variables

Make sure your `.env` includes:

```
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Backend
MONGODB_URI=mongodb://localhost:27017/shop-system
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
PORT=5000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Common Scenarios

### Scenario 1: New Business Owner Wants to Use the System

1. Owner registers as "Manager"
2. Admin approves the manager
3. Manager logs in and creates shop
4. Manager can start adding products
5. Manager can invite staff to help

### Scenario 2: Staff Member Joins

1. Staff registers as "Staff"
2. Admin or Manager approves
3. Staff logs in
4. Can only see assigned shop's data
5. Can record sales, manage inventory

### Scenario 3: Two Shops, Same Platform

1. Manager A creates Shop A
2. Manager B creates Shop B
3. Both shops operate independently
4. Products with same SKU can exist in both shops
5. Admin can see both shops' data

---

## Troubleshooting

### Manager can't see shop creation dialog
- Make sure manager is approved by admin
- Try logging out and logging back in
- Check browser console for errors

### Products aren't showing
- Verify products were created after shop was created
- Check that you're logged in as the right user
- Make sure you have products for your shop

### Can't create product
- Ensure you're a manager with an approved shop
- Check category exists for your shop
- SKU must be unique within your shop

### Access denied error
- You might be trying to access another shop's data
- Make sure you're logged in as the right user
- Admins have access to all data

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js)              │
│  Dashboard | Products | Sales | etc     │
└────────────────┬────────────────────────┘
                 │
     ┌───────────┴───────────┐
     │                       │
     ▼                       ▼
┌──────────────┐      ┌──────────────┐
│   Auth API   │      │  Business    │
│              │      │    Logic     │
└──────────────┘      └──────────────┘
     │                       │
     └───────────┬───────────┘
                 │
                 ▼
        ┌──────────────────┐
        │  Shop Filtering  │
        │   Middleware     │
        └──────────────────┘
                 │
                 ▼
        ┌──────────────────┐
        │    MongoDB       │
        │  (Multi-tenant)  │
        └──────────────────┘
```

---

## Performance Considerations

- **Compound indexes** ensure fast queries
- **Shop filtering** reduces query scope
- **Auth token includes shopId** for quick access control
- **Pagination** implemented on all list endpoints

---

## Security Checklist

- ✅ JWT authentication on all protected routes
- ✅ Shop ownership verification on all operations
- ✅ Role-based access control
- ✅ Password hashing with bcrypt
- ✅ CORS configured for your domain
- ✅ No cross-shop data access possible

---

## Support

If you encounter any issues:

1. Check the console for error messages
2. Verify MongoDB indexes are created
3. Ensure environment variables are set correctly
4. Check API response status codes
5. Review API documentation in this file

---

## Next Steps

1. ✅ Create first manager account
2. ✅ Approve manager in admin panel
3. ✅ Manager creates their shop
4. ✅ Add products
5. ✅ Invite staff members
6. ✅ Start recording sales!

---

**System is ready for production use!**
