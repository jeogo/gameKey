# 🎮 GameKey Store - Complete API Documentation

## 📋 Table of Contents
- [🚀 Quick Start](#-quick-start)
- [🔗 Base URLs](#-base-urls)
- [👤 Users API](#-users-api)
- [🎮 Products API](#-products-api)
- [🛒 Orders API](#-orders-api)
- [💳 Payments API](#-payments-api)
- [🏷️ Categories API](#️-categories-api)
- [🔔 Notifications API](#-notifications-api)
- [📊 Analytics & Stats](#-analytics--stats)
- [🔒 Authentication & Security](#-authentication--security)
- [🚫 Error Handling](#-error-handling)
- [📝 Data Models](#-data-models)

---

## 🚀 Quick Start

### Base Information
- **API Version:** v1.0.0
- **Content-Type:** `application/json`
- **Rate Limits:** 500 requests/15min for API, 100 requests/15min for sensitive operations

### Environment URLs
```bash
# Development
http://localhost:3000/api

# Production  
https://your-domain.com/api
```

### Testing the API
```bash
# Health check
curl -X GET "http://localhost:3000/health"

# Get all products
curl -X GET "http://localhost:3000/api/products"

# Interactive docs
http://localhost:3000/api-docs
```

---

## 🔗 Base URLs

| Environment | URL | Description |
|-------------|-----|-------------|
| **Development** | `http://localhost:3000/api` | Local development server |
| **Production** | `https://your-domain.com/api` | Production server |
| **Swagger Docs** | `http://localhost:3000/api-docs` | Interactive API documentation |

---

## 👤 Users API

### Get All Users
```http
GET /api/users
```

**Parameters:**
- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "telegramId": 123456789,
      "username": "gameuser123",
      "firstName": "John",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20
  }
}
```

### Get User by ID
```http
GET /api/users/{id}
```

**Parameters:**
- `id` (path, required): MongoDB Object ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "telegramId": 123456789,
    "username": "gameuser123", 
    "firstName": "John",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update User
```http
PUT /api/users/{id}
```

**Request Body:**
```json
{
  "username": "newusername",
  "firstName": "Updated Name"
}
```

### Send Message to User
```http
POST /api/users/{userId}/send-message
```

**Request Body:**
```json
{
  "message": "Your order has been processed!",
  "type": "order_update"
}
```

---

## 🎮 Products API

### Get All Products
```http
GET /api/products
```

**Parameters:**
- `page` (query, optional): Page number
- `limit` (query, optional): Items per page
- `category` (query, optional): Filter by category ID
- `search` (query, optional): Search products by name
- `minPrice` (query, optional): Minimum price filter
- `maxPrice` (query, optional): Maximum price filter

**Example:**
```bash
curl "http://localhost:3000/api/products?category=507f1f77bcf86cd799439013&minPrice=10&maxPrice=100"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Steam Gift Card $50",
      "description": "Digital Steam gift card valid worldwide",
      "price": 47.99,
      "categoryId": "507f1f77bcf86cd799439014",
      "isAvailable": true,
      "digitalContent": ["STEAM-XXXX-YYYY-ZZZZ"],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Product by ID
```http
GET /api/products/{id}
```

### Create Product
```http
POST /api/products
```

**Request Body:**
```json
{
  "name": "Steam Gift Card $25",
  "description": "Digital Steam gift card",
  "price": 23.99,
  "categoryId": "507f1f77bcf86cd799439014",
  "isAvailable": true,
  "digitalContent": [
    "STEAM-AAAA-BBBB-CCCC",
    "STEAM-DDDD-EEEE-FFFF"
  ]
}
```

### Update Product
```http
PUT /api/products/{id}
```

### Delete Product
```http
DELETE /api/products/{id}
```

---

## 🛒 Orders API

### Get All Orders
```http
GET /api/orders
```

**Parameters:**
- `page`, `limit`: Pagination
- `status` (query, optional): Filter by order status (`pending`, `paid`, `delivered`, `cancelled`)
- `userId` (query, optional): Filter by user ID

### Get Orders by User
```http
GET /api/orders/user/{userId}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "userId": "507f1f77bcf86cd799439011",
      "productId": "507f1f77bcf86cd799439013",
      "quantity": 2,
      "unitPrice": 47.99,
      "totalAmount": 95.98,
      "status": "delivered",
      "deliveredContent": ["STEAM-XXXX-YYYY-ZZZZ", "STEAM-AAAA-BBBB-CCCC"],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Order by ID
```http
GET /api/orders/{id}
```

### Create Order
```http
POST /api/orders
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "productId": "507f1f77bcf86cd799439013",
  "quantity": 1,
  "paymentMethod": "crypto"
}
```

### Update Order Status
```http
PUT /api/orders/{id}/status
```

**Request Body:**
```json
{
  "status": "delivered",
  "deliveredContent": ["STEAM-XXXX-YYYY-ZZZZ"]
}
```

---

## 💳 Payments API

### Get All Payments
```http
GET /api/payments
```

### Get Payments by User
```http
GET /api/payments/user/{userId}
```

### Get Payment by ID
```http
GET /api/payments/{id}
```

### Get Payment by Order
```http
GET /api/payments/order/{orderId}
```

### Check Payment Status
```http
GET /api/payments/{id}/check
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "orderId": "507f1f77bcf86cd799439015",
    "userId": "507f1f77bcf86cd799439011",
    "amount": 47.99,
    "currency": "usd",
    "cryptoType": "usdterc20",
    "status": "completed",
    "paymentProvider": "nowpayments",
    "paymentUrl": "https://nowpayments.io/payment/xxx",
    "cryptoAddress": "0x742d35Cc6bC16532E1D8B9c4aDF6e9c3C4B4Cc8A",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "completedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

### Payment Stats
```http
GET /api/payments/stats/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 15450.75,
    "totalTransactions": 324,
    "successfulPayments": 298,
    "pendingPayments": 12,
    "failedPayments": 14,
    "averageOrderValue": 47.68,
    "topCryptoCurrencies": [
      { "currency": "usdterc20", "count": 156, "volume": 7234.50 },
      { "currency": "btc", "count": 89, "volume": 4123.25 }
    ]
  }
}
```

### NOWPayments Webhook
```http
POST /api/payments/webhook/nowpayments
```

**Request Headers:**
- `x-nowpayments-sig`: Webhook signature for verification

---

## 🏷️ Categories API

### Get All Categories
```http
GET /api/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Gaming Gift Cards",
      "description": "Digital gift cards for popular gaming platforms",
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Category by ID
```http
GET /api/categories/{id}
```

### Create Category
```http
POST /api/categories
```

**Request Body:**
```json
{
  "name": "Game Keys",
  "description": "Digital game keys and licenses",
  "isActive": true,
  "sortOrder": 2
}
```

### Update Category
```http
PUT /api/categories/{id}
```

### Delete Category
```http
DELETE /api/categories/{id}
```

---

## 🔔 Notifications API

### Get All Notifications
```http
GET /api/notifications
```

### Get User Notifications
```http
GET /api/notifications/user/{userId}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "userId": "507f1f77bcf86cd799439011",
      "type": "payment",
      "title": "Payment Confirmed",
      "message": "Your payment has been confirmed and order is being processed",
      "isRead": false,
      "data": {
        "orderId": "507f1f77bcf86cd799439015",
        "amount": 47.99
      },
      "createdAt": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

### Create Notification
```http
POST /api/notifications
```

### Mark as Read
```http
PUT /api/notifications/{id}/read
```

### Delete Notification
```http
DELETE /api/notifications/{id}
```

---

## 📊 Analytics & Stats

### System Status
```http
GET /api/status
```

**Response:**
```json
{
  "server": "GameKey Bot API",
  "status": "running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": "125 seconds",
  "memory": {
    "used": "45 MB",
    "total": "128 MB"
  }
}
```

### Performance Metrics
```http
GET /api/performance
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 125.456,
  "memory": {
    "rss": 47923200,
    "heapTotal": 25169920,
    "heapUsed": 18742016
  },
  "version": "1.0.0",
  "environment": "development"
}
```

---

## 🔒 Authentication & Security

### Rate Limiting
- **General API**: 500 requests per 15 minutes
- **Sensitive Operations** (orders, payments): 100 requests per 15 minutes
- **Webhook Endpoints**: 100 requests per 15 minutes

### Input Validation
All endpoints include:
- Request body sanitization
- Parameter validation
- SQL injection prevention
- XSS protection

### Webhook Security
- Signature verification for NOWPayments webhooks
- Timestamp validation
- Replay attack prevention

---

## 🚫 Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error"
    }
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `RATE_LIMITED` - Too many requests
- `PAYMENT_ERROR` - Payment processing failed
- `INSUFFICIENT_STOCK` - Product not available
- `INTERNAL_ERROR` - Server error

---

## 📝 Data Models

### User Model
```typescript
{
  _id: string;           // MongoDB Object ID
  telegramId: number;    // Telegram user ID
  username?: string;     // Optional username
  firstName?: string;    // User's first name
  createdAt: Date;       // Account creation date
}
```

### Product Model
```typescript
{
  _id: string;              // MongoDB Object ID
  name: string;             // Product name
  description?: string;     // Product description
  price: number;            // Price in USD
  categoryId: string;       // Category reference
  isAvailable: boolean;     // Availability status
  digitalContent: string[]; // Product keys/content
  createdAt: Date;          // Creation date
}
```

### Order Model
```typescript
{
  _id: string;                    // MongoDB Object ID
  userId: string;                 // Customer reference
  productId: string;              // Product reference
  quantity: number;               // Order quantity
  unitPrice: number;              // Price per unit
  totalAmount: number;            // Total order value
  status: 'pending' | 'paid' | 'delivered' | 'cancelled';
  deliveredContent?: string[];    // Delivered items
  createdAt: Date;               // Order date
}
```

### Payment Model
```typescript
{
  _id: string;                    // MongoDB Object ID
  orderId: string;                // Order reference
  userId: string;                 // Customer reference
  amount: number;                 // Payment amount
  currency: string;               // Payment currency
  cryptoType?: string;            // Cryptocurrency used
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentProvider: string;        // Payment processor
  paymentUrl?: string;            // Payment page URL
  cryptoAddress?: string;         // Payment address
  createdAt: Date;               // Payment creation
  completedAt?: Date;            // Payment completion
}
```

---

## 🧪 Testing Examples

### Using cURL
```bash
# Get all products
curl -X GET "http://localhost:3000/api/products" \
  -H "Content-Type: application/json"

# Create a new order
curl -X POST "http://localhost:3000/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "productId": "507f1f77bcf86cd799439013",
    "quantity": 1
  }'

# Check payment status
curl -X GET "http://localhost:3000/api/payments/507f1f77bcf86cd799439016/check" \
  -H "Content-Type: application/json"
```

### Using JavaScript/Fetch
```javascript
// Get user orders
const response = await fetch('http://localhost:3000/api/orders/user/123456789');
const data = await response.json();
console.log(data);

// Create a new product
const newProduct = await fetch('http://localhost:3000/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Steam Gift Card $10',
    price: 9.99,
    categoryId: '507f1f77bcf86cd799439014',
    isAvailable: true,
    digitalContent: ['STEAM-1111-2222-3333']
  })
});
```

---

## 📞 Support & Resources

- **Swagger UI**: `http://localhost:3000/api-docs` (Interactive API testing)
- **Health Check**: `http://localhost:3000/health` (System status)
- **Performance Stats**: `http://localhost:3000/api/performance` (API metrics)
- **Support Contact**: @jeogo
- **Repository**: [GitHub Repository](https://github.com/jeogo/gameKey)

---

*🎮 GameKey Store API - Digital gaming products with instant delivery*
