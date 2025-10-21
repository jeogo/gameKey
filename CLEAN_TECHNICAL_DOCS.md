# GameKey Codebase Technical Documentation

## System Architecture

### Core Technology Stack
- **Backend Framework**: Node.js with TypeScript
- **Web Server**: Express 5.x with comprehensive middleware
- **Bot Framework**: Grammy for Telegram integration
- **Database**: MongoDB with Mongoose ODM
- **Payment Processing**: NOWPayments API integration
- **Documentation**: Swagger/OpenAPI 3.0 specification

### Application Structure

#### Entry Points
1. **Main Application** (src/index.ts)
   - Application bootstrapping
   - Service initialization
   - Error handling setup

2. **Express Server** (src/server.ts)
   - HTTP API endpoints
   - Middleware configuration
   - Request/response handling

3. **Telegram Bot** (src/bot.ts)
   - Bot command processing
   - User interaction handling
   - Session management

### Database Schema Design

#### User Management
```typescript
interface User {
  telegramId: number;          // Unique Telegram identifier
  username: string;            // User display name
  firstName: string;           // Telegram first name
  lastName?: string;           // Telegram last name
  isAdmin: boolean;            // Administrative privileges
  balance: number;             // Account balance
  createdAt: Date;             // Registration timestamp
  updatedAt: Date;             // Last modification
}
```

#### Product Catalog
```typescript
interface Product {
  name: string;                // Product title
  description: string;         // Product description
  price: number;               // Price in USD
  category: ObjectId;          // Category reference
  stock: number;               // Available quantity
  isActive: boolean;           // Availability status
  digitalContent: string[];    // Product keys/content
  imageUrl?: string;           // Product image
  metadata: object;            // Additional data
  createdAt: Date;
  updatedAt: Date;
}
```

#### Order Processing
```typescript
interface Order {
  userId: ObjectId;            // User reference
  productId: ObjectId;         // Product reference
  quantity: number;            // Order quantity
  totalAmount: number;         // Total cost
  status: OrderStatus;         // Order state
  paymentId?: ObjectId;        // Payment reference
  deliveredContent?: string[]; // Delivered items
  createdAt: Date;
  updatedAt: Date;
}

type OrderStatus = 'pending' | 'paid' | 'delivered' | 'cancelled';
```

#### Payment Transactions
```typescript
interface PaymentTransaction {
  orderId: ObjectId;           // Associated order
  amount: number;              // Payment amount
  currency: string;            // Payment currency
  provider: string;            // Payment provider
  externalId: string;          // Provider transaction ID
  status: PaymentStatus;       // Transaction status
  webhookData: object;         // Provider webhook data
  createdAt: Date;
  updatedAt: Date;
}

type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'expired';
```

### API Endpoint Documentation

#### User Management Endpoints
- `GET /api/users` - List users (admin only)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user information
- `DELETE /api/users/:id` - Delete user (admin only)

#### Product Management Endpoints
- `GET /api/products` - List products with filtering
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

#### Order Management Endpoints
- `GET /api/orders` - List orders with pagination
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Cancel order

#### Payment Processing Endpoints
- `POST /api/payments/create` - Initialize payment
- `POST /api/payments/webhook` - Handle provider webhooks
- `GET /api/payments/:id` - Get payment status
- `GET /api/payments/verify/:id` - Verify payment

### Bot Command System

#### Available Commands
```typescript
const commands = [
  { command: 'start', description: 'Account setup and welcome' },
  { command: 'help', description: 'Command reference and support' },
  { command: 'menu', description: 'Main navigation interface' },
  { command: 'shop', description: 'Browse product catalog' },
  { command: 'products', description: 'Product listing (alias)' },
  { command: 'store', description: 'Store access (alias)' },
  { command: 'buy', description: 'Quick purchase (alias)' },
  { command: 'orders', description: 'Order history and tracking' },
  { command: 'profile', description: 'Account information' },
  { command: 'status', description: 'Account status overview' },
  { command: 'support', description: 'Customer service contact' }
];
```

#### Command Processing Flow
1. User sends command via Telegram
2. Grammy framework routes command to handler
3. Authentication middleware validates user
4. Session middleware loads user context
5. Command handler executes business logic
6. Database operations performed if needed
7. Response formatted and sent to user
8. Session state updated as required

### Payment Integration

#### NOWPayments Workflow
1. User initiates purchase
2. Order created in pending status
3. Payment request sent to NOWPayments
4. User receives payment instructions
5. User completes cryptocurrency payment
6. NOWPayments sends webhook notification
7. Webhook handler processes payment
8. Order status updated to paid
9. Product delivery executed
10. User receives confirmation

#### Supported Cryptocurrencies
- Bitcoin (BTC)
- Ethereum (ETH)
- USDT (Tether)
- Litecoin (LTC)
- Additional currencies as configured

### Security Implementation

#### Request Security
- Input validation and sanitization
- Rate limiting per IP address
- CORS policy enforcement
- Security headers implementation
- SQL injection prevention

#### Authentication
- Telegram-based user authentication
- Admin privilege verification
- Session-based authorization
- Token validation

#### Webhook Security
- HMAC signature verification
- IP address whitelist validation
- Replay attack prevention
- Data integrity validation

### Database Optimization

#### Performance Features
- Connection pooling for efficiency
- Strategic index placement
- Query result caching
- Aggregation pipeline optimization
- Read/write operation balancing

#### Data Integrity
- Schema validation enforcement
- Required field validation
- Data type consistency
- Referential integrity maintenance
- Transaction support where needed

### Development Environment

#### Build Configuration
- TypeScript strict mode enabled
- ES2020 compilation target
- Source map generation
- Declaration file output
- Hot reload in development

#### Testing Framework
- Unit test coverage
- Integration testing
- API endpoint testing
- Database operation testing
- Bot command testing

### Deployment Configuration

#### Environment Variables
```typescript
interface EnvironmentConfig {
  NODE_ENV: string;              // Environment mode
  PORT: number;                  // Server port
  MONGODB_URI: string;           // Database connection
  BOT_TOKEN: string;             // Telegram bot token
  NOWPAYMENTS_API_KEY: string;   // Payment API key
  NOWPAYMENTS_IPN_SECRET: string; // Webhook secret
  ADMIN_TELEGRAM_ID: number;     // Admin user ID
}
```

#### Production Settings
- Process clustering for scalability
- Memory usage optimization
- Error logging and monitoring
- Performance metrics collection
- Automatic restart on failure

### Monitoring and Logging

#### Application Logging
- Error level for failures
- Info level for operations
- Debug level for development
- Performance metrics
- User activity tracking

#### System Monitoring
- Response time measurement
- Database query performance
- Memory usage tracking
- Bot command statistics
- Payment processing metrics

### Extensibility Features

#### Modular Architecture
- Repository pattern for data access
- Service layer for business logic
- Controller layer for request handling
- Middleware for cross-cutting concerns

#### Configuration Management
- Environment-based configuration
- Feature flags support
- Dynamic setting updates
- Plugin architecture ready

### Operational Procedures

#### Administrative Tasks
- User account management
- Product catalog maintenance
- Order processing oversight
- Payment monitoring
- System health checks

#### Maintenance Operations
- Database backup procedures
- Log rotation and cleanup
- Performance optimization
- Security updates
- Dependency management

This documentation provides comprehensive technical understanding of the GameKey system architecture, implementation details, and operational procedures.