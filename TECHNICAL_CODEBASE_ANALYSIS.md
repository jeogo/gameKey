# GameKey Technical Codebase Analysis

## System Architecture Overview

### Core Components
- **Express API Server**: REST API with comprehensive middleware stack
- **Grammy Telegram Bot**: Telegram bot with session management and command handling
- **MongoDB Database**: Document database with optimized schemas and indexes
- **Payment Integration**: NOWPayments crypto payment processing
- **Notification System**: Real-time user notifications and alerts

### Technology Stack
- **Runtime**: Node.js with TypeScript for type safety
- **Web Framework**: Express 5.x with middleware chain
- **Bot Framework**: Grammy for Telegram bot development
- **Database**: MongoDB with Mongoose ODM
- **Payment**: NOWPayments API integration
- **Documentation**: Swagger/OpenAPI 3.0

## Application Entry Points

### 1. Main Server (src/index.ts)
```
Application startup sequence:
1. Environment configuration validation
2. Database connection establishment
3. Express server initialization
4. Telegram bot startup
5. Route registration
6. Middleware configuration
7. Error handling setup
```

### 2. Express API Server (src/server.ts)
```
Server capabilities:
- RESTful API endpoints
- Request validation and sanitization
- Rate limiting and security headers
- CORS configuration
- Error handling middleware
- Swagger documentation at /api-docs
```

### 3. Telegram Bot (src/bot.ts)
```
Bot functionality:
- Command processing and routing
- Session state management
- User registration and authentication
- Order management interface
- Payment flow handling
- Admin functionality
```

## Database Architecture

### Collections and Schemas

#### Users Collection
```
Fields:
- telegramId: Unique Telegram user identifier
- username: Telegram username
- firstName: User's first name
- lastName: User's last name
- isAdmin: Administrative privileges flag
- balance: User account balance
- createdAt: Account creation timestamp
- updatedAt: Last modification timestamp

Indexes:
- telegramId (unique)
- username
- isAdmin
```

#### Products Collection
```
Fields:
- name: Product name
- description: Product description
- price: Product price in USD
- category: Product category reference
- stock: Available quantity
- isActive: Availability status
- imageUrl: Product image URL
- metadata: Additional product information
- createdAt: Creation timestamp
- updatedAt: Last modification timestamp

Indexes:
- category
- isActive
- price
- name (text search)
```

#### Orders Collection
```
Fields:
- userId: Reference to user
- products: Array of ordered products
- totalAmount: Total order value
- status: Order status (pending, paid, delivered, cancelled)
- paymentId: Payment transaction reference
- deliveryInfo: Product delivery details
- createdAt: Order creation timestamp
- updatedAt: Order status update timestamp

Indexes:
- userId
- status
- createdAt
- paymentId
```

#### Categories Collection
```
Fields:
- name: Category name
- description: Category description
- isActive: Category availability
- sortOrder: Display order priority
- createdAt: Creation timestamp
- updatedAt: Last modification timestamp

Indexes:
- isActive
- sortOrder
```

#### PaymentTransactions Collection
```
Fields:
- orderId: Associated order reference
- amount: Payment amount
- currency: Payment currency
- provider: Payment provider (NOWPayments)
- externalId: Provider transaction ID
- status: Payment status
- webhookData: Provider webhook information
- createdAt: Transaction creation timestamp
- updatedAt: Status update timestamp

Indexes:
- orderId
- externalId
- status
- createdAt
```

#### Notifications Collection
```
Fields:
- userId: Target user reference
- title: Notification title
- message: Notification content
- type: Notification type classification
- isRead: Read status flag
- metadata: Additional notification data
- createdAt: Creation timestamp

Indexes:
- userId
- isRead
- type
- createdAt
```

## API Endpoints Structure

### User Management
```
GET /api/users - List all users (admin only)
GET /api/users/:id - Get specific user details
PUT /api/users/:id - Update user information
DELETE /api/users/:id - Delete user account (admin only)
```

### Product Management
```
GET /api/products - List products with filtering and pagination
GET /api/products/:id - Get specific product details
POST /api/products - Create new product (admin only)
PUT /api/products/:id - Update product (admin only)
DELETE /api/products/:id - Delete product (admin only)
```

### Category Management
```
GET /api/categories - List all categories
GET /api/categories/:id - Get specific category
POST /api/categories - Create category (admin only)
PUT /api/categories/:id - Update category (admin only)
DELETE /api/categories/:id - Delete category (admin only)
```

### Order Management
```
GET /api/orders - List orders with filtering
GET /api/orders/:id - Get specific order details
POST /api/orders - Create new order
PUT /api/orders/:id - Update order status
DELETE /api/orders/:id - Cancel order
```

### Payment Processing
```
POST /api/payments/create - Initialize payment transaction
POST /api/payments/webhook - Handle payment provider webhooks
GET /api/payments/:id - Get payment status
GET /api/payments/verify/:id - Verify payment completion
```

### Notification System
```
GET /api/notifications - Get user notifications
POST /api/notifications - Send notification (admin only)
PUT /api/notifications/:id/read - Mark notification as read
DELETE /api/notifications/:id - Delete notification
```

## Bot Command System

### Command Registration (src/bot/commands/index.ts)
```
Available commands and their functions:
- /start - User registration and welcome
- /help - Command reference and assistance
- /menu - Main navigation interface
- /products, /shop, /store, /buy - Product catalog browsing
- /orders - Order history and tracking
- /profile - User account information
- /support - Customer service contact
- /status - Account and order status overview

Command aliases enable multiple entry points for same functionality.
```

### Command Processing Flow
```
1. User sends command via Telegram
2. Grammy framework captures and routes command
3. Authentication middleware validates user
4. Session middleware loads user context
5. Command handler executes business logic
6. Database operations performed if needed
7. Response formatted and sent to user
8. Session state updated if required
```

### Bot Middleware Stack
```
Authentication (auth.ts):
- Validates user existence in database
- Creates new users automatically
- Sets user context in session

Session Management (session.ts):
- Maintains conversation state
- Stores temporary data between interactions
- Handles pagination and navigation state

Error Handling (errorHandler.ts):
- Catches and logs errors
- Provides user-friendly error messages
- Prevents bot crashes from exceptions
```

## Payment Processing System

### NOWPayments Integration
```
Payment flow sequence:
1. User initiates purchase through bot
2. Order created in pending status
3. Payment request sent to NOWPayments API
4. User receives payment instructions
5. User completes payment
6. NOWPayments sends webhook notification
7. Webhook handler verifies and processes payment
8. Order status updated to paid
9. Product delivery initiated
10. User notification sent
```

### Supported Payment Methods
```
Cryptocurrency options:
- Bitcoin (BTC)
- Ethereum (ETH)
- USDT (Tether)
- Additional cryptocurrencies as configured

Payment validation:
- Webhook signature verification
- Amount and currency validation
- Duplicate payment prevention
- Timeout handling for expired payments
```

## Security Implementation

### API Security
```
Request validation:
- Input sanitization and validation
- Rate limiting per IP address
- CORS policy enforcement
- Security headers implementation

Authentication:
- Telegram-based user authentication
- Admin privilege verification
- Session-based authorization
```

### Webhook Security
```
NOWPayments webhook validation:
- HMAC signature verification
- IP address whitelist checking
- Replay attack prevention
- Data integrity validation
```

## Database Optimization

### Performance Features
```
Connection management:
- Connection pooling
- Automatic reconnection
- Read/write splitting capability
- Connection timeout handling

Query optimization:
- Strategic index placement
- Query result caching
- Aggregation pipeline optimization
- Lazy loading implementation
```

### Data Integrity
```
Validation rules:
- Schema-level data validation
- Required field enforcement
- Data type validation
- Custom validation rules

Consistency measures:
- Transaction support where needed
- Referential integrity maintenance
- Duplicate prevention
- Data migration scripts
```

## Development and Deployment

### Build System
```
TypeScript compilation:
- Strict type checking enabled
- Modern ES2020 target
- Source map generation
- Declaration file output

Development tools:
- Hot reload capability
- Error reporting
- Debug configuration
- Testing framework integration
```

### Configuration Management
```
Environment variables:
- Database connection strings
- API keys and secrets
- Bot tokens
- Service endpoints
- Feature flags

Configuration validation:
- Required variable checking
- Type conversion and validation
- Default value assignment
- Environment-specific settings
```

## Monitoring and Logging

### Application Logging
```
Log levels and categories:
- Error logging for failures
- Info logging for operations
- Debug logging for development
- Performance metrics collection

Log destinations:
- Console output
- File-based logging
- External log aggregation
- Error tracking services
```

### Performance Monitoring
```
Metrics collection:
- Response time tracking
- Database query performance
- Memory usage monitoring
- Bot command usage statistics
```

## Extensibility and Customization

### Modular Architecture
```
Component separation:
- Repository pattern for data access
- Service layer for business logic
- Controller layer for request handling
- Middleware for cross-cutting concerns

Extension points:
- Custom payment providers
- Additional bot commands
- New API endpoints
- Custom notification types
```

### Configuration Options
```
Customizable features:
- Payment method selection
- Product category management
- User permission levels
- Notification preferences
- Rate limiting thresholds
```

## Operational Capabilities

### Administrative Functions
```
User management:
- User account creation and modification
- Permission level assignment
- Account suspension and activation
- Bulk user operations

Product management:
- Product catalog maintenance
- Category organization
- Inventory tracking
- Price management

Order management:
- Order status tracking
- Manual order processing
- Refund handling
- Customer communication
```

### Analytics and Reporting
```
Available data insights:
- User registration trends
- Product sales performance
- Payment success rates
- Bot command usage patterns
- Customer behavior analysis
```

This technical analysis provides comprehensive understanding of the GameKey codebase architecture, functionality, and operational capabilities without decorative elements.