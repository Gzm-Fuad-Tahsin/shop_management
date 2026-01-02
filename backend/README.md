# Shop Management System - Backend API

Express.js backend API for the Shop Management System with MongoDB.

## Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Create `.env` file:
\`\`\`bash
cp .env.example .env
\`\`\`

3. Configure MongoDB URI and JWT secret in `.env`

4. Start development server:
\`\`\`bash
npm run dev
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin/manager)
- `PUT /api/products/:id` - Update product (admin/manager)

### Inventory
- `GET /api/inventory` - Get all inventory
- `GET /api/inventory/product/:productId` - Get inventory for product
- `POST /api/inventory` - Create inventory entry
- `PUT /api/inventory/:id` - Update inventory

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/range` - Get sales by date range
- `POST /api/sales` - Create sale

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRE` - JWT expiration time
- `FRONTEND_URL` - Frontend URL for CORS
