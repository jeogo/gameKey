import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger configuration and options
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GameKey Store API',
      version: '1.0.0',
      description: `
        **🎮 GameKey Store - Telegram Bot & Payment System API**
        
        Complete REST API for a Telegram bot-based digital store with cryptocurrency payment processing.
        
        ## 🌟 Features
        - 👤 User management and profiles
        - 🎮 Digital product catalog  
        - 🛒 Order processing system
        - 💳 Multi-crypto payment integration (NOWPayments)
        - 📊 Advanced analytics and reporting
        - 🔔 Real-time notifications
        - 🏷️ Category management
        - 🔐 Secure webhook handling
        
        ## 💰 Supported Cryptocurrencies
        - **USDT** (ERC-20, TRC-20, BEP-20, Polygon, Solana)
        - **Bitcoin (BTC)**
        - **Ethereum (ETH)**  
        - **Litecoin (LTC)**
        - **BNB (BSC)**
        
        ## 🔐 Authentication
        All endpoints are secured with input validation, rate limiting, and error handling.
        Webhook endpoints include signature verification for production security.
        
        ## 📈 Rate Limiting  
        - API endpoints: 100 requests/minute per IP
        - Webhook endpoints: 100 requests/minute per IP
        
        ## 🚀 Production Ready
        - Comprehensive error handling
        - Request/response validation  
        - Performance monitoring
        - Structured logging
        - Database optimization
      `,
      contact: {
        name: 'GameKey Store API',
        email: 'support@gamekey.store',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001/api',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:3001/api',
        description: 'Development Server',
      },
    ],
    components: {
      schemas: {
        // User Models - Simplified
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB Object ID',
              example: '507f1f77bcf86cd799439011',
            },
            telegramId: {
              type: 'number',
              description: 'Telegram user ID',
              example: 123456789,
            },
            username: {
              type: 'string',
              description: 'Optional Telegram username',
              example: 'gameuser123',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
              example: 'John',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account status',
              example: true,
            },
          },
          required: ['telegramId', 'createdAt'],
        },

        // Product Models
        Product: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB Object ID',
            },
            name: {
              type: 'string',
              description: 'Product name',
              example: 'Steam Gift Card $50',
            },
            description: {
              type: 'string',
              description: 'Product description',
              example: 'Digital Steam gift card valid worldwide',
            },
            price: {
              type: 'number',
              description: 'Product price in USD',
              example: 47.99,
            },
            categoryId: {
              type: 'string',
              description: 'Category ID reference',
              example: '507f1f77bcf86cd799439013',
            },
            isAvailable: {
              type: 'boolean',
              description: 'Product availability status',
              example: true,
            },
            digitalContent: {
              type: 'array',
              items: { type: 'string' },
              description: 'Digital content (keys, emails, accounts)',
              example: ['email1@example.com:password1', 'STEAM-XXXX-YYYY-ZZZZ'],
            },
            allowPreorder: {
              type: 'boolean',
              description: 'Whether to allow preorders when stock is empty',
              example: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
          required: ['name', 'price', 'categoryId', 'isAvailable', 'digitalContent', 'allowPreorder'],
        },

        // Order Models
        Order: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB Object ID',
            },
            userId: {
              type: 'string',
              description: 'Customer user ID',
              example: '507f1f77bcf86cd799439011',
            },
            productId: {
              type: 'string',
              description: 'Ordered product ID',
              example: '507f1f77bcf86cd799439013',
            },
            quantity: {
              type: 'number',
              description: 'Order quantity',
              example: 2,
            },
            totalAmount: {
              type: 'number',
              description: 'Total order amount',
              example: 95.98,
            },
            unitPrice: {
              type: 'number',
              description: 'Unit price at purchase time',
              example: 47.99,
            },
            status: {
              type: 'string',
              enum: ['pending', 'paid', 'delivered', 'cancelled'],
              description: 'Order status',
            },
            deliveredContent: {
              type: 'array',
              items: { type: 'string' },
              description: 'Delivered digital content',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['userId', 'productId', 'quantity', 'totalAmount', 'status'],
        },

        // Payment Models
        PaymentTransaction: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB Object ID',
            },
            orderId: {
              type: 'string',
              description: 'Associated order ID',
              example: '507f1f77bcf86cd799439015',
            },
            userId: {
              type: 'string',
              description: 'Customer user ID',
              example: '507f1f77bcf86cd799439011',
            },
            amount: {
              type: 'number',
              description: 'Transaction amount in USD',
              example: 47.99,
            },
            currency: {
              type: 'string',
              description: 'Payment currency',
              example: 'usd',
            },
            cryptoType: {
              type: 'string',
              description: 'Cryptocurrency used',
              example: 'usdterc20',
            },
            cryptoNetwork: {
              type: 'string',
              description: 'Blockchain network',
              example: 'Ethereum',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
              description: 'Payment status',
            },
            paymentProvider: {
              type: 'string',
              description: 'Payment processor',
              example: 'nowpayments',
            },
            providerTransactionId: {
              type: 'string',
              description: 'Provider transaction ID',
            },
            paymentUrl: {
              type: 'string',
              description: 'Payment page URL',
            },
            cryptoAddress: {
              type: 'string',
              description: 'Crypto wallet address for payment',
            },
            cryptoTxHash: {
              type: 'string',
              description: 'Blockchain transaction hash',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['orderId', 'userId', 'amount', 'currency', 'status', 'paymentProvider'],
        },

        // Category Models
        Category: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB Object ID',
            },
            name: {
              type: 'string',
              description: 'Category name',
              example: 'Gaming Gift Cards',
            },
            description: {
              type: 'string',
              description: 'Category description',
              example: 'Digital gift cards for popular gaming platforms',
            },
            isActive: {
              type: 'boolean',
              description: 'Category status',
              example: true,
            },
            sortOrder: {
              type: 'number',
              description: 'Display sort order',
              example: 1,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['name', 'isActive', 'sortOrder'],
        },

        // Notification Models
        Notification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB Object ID',
            },
            userId: {
              type: 'string',
              description: 'Target user ID',
              example: '507f1f77bcf86cd799439011',
            },
            type: {
              type: 'string',
              enum: ['order', 'payment', 'system', 'promo'],
              description: 'Notification type',
            },
            title: {
              type: 'string',
              description: 'Notification title',
              example: 'Payment Confirmed',
            },
            message: {
              type: 'string',
              description: 'Notification content',
              example: 'Your payment has been confirmed and order is being processed',
            },
            isRead: {
              type: 'boolean',
              description: 'Read status',
              example: false,
            },
            data: {
              type: 'object',
              description: 'Additional notification data',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['userId', 'type', 'title', 'message', 'isRead'],
        },

        // Response Models
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Request success status',
            },
            message: {
              type: 'string',
              description: 'Response message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            error: {
              type: 'string',
              description: 'Error message if failed',
            },
          },
          required: ['success'],
        },

        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'array',
              items: {},
            },
            pagination: {
              type: 'object',
              properties: {
                currentPage: { type: 'number' },
                totalPages: { type: 'number' },
                totalItems: { type: 'number' },
                itemsPerPage: { type: 'number' },
              },
            },
          },
        },

        // Error Models
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Validation failed',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },

      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
        },
        ObjectIdParam: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'MongoDB Object ID',
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$',
          },
        },
      },

      responses: {
        BadRequest: {
          description: 'Bad Request - Invalid input parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Resource not found' },
                  code: { type: 'string', example: 'NOT_FOUND' },
                },
              },
            },
          },
        },
        InternalError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Internal server error' },
                  code: { type: 'string', example: 'INTERNAL_ERROR' },
                },
              },
            },
          },
        },
      },
    },

    tags: [
      {
        name: 'Users',
        description: '👤 User management and profile operations',
      },
      {
        name: 'Products',
        description: '🎮 Digital product catalog management',
      },
      {
        name: 'Orders',
        description: '🛒 Order processing and management',
      },
      {
        name: 'Payments',
        description: '💳 Payment processing and cryptocurrency transactions',
      },
      {
        name: 'Categories',
        description: '🏷️ Product category management',
      },
      {
        name: 'Notifications',
        description: '🔔 User notification system',
      },
      {
        name: 'Analytics',
        description: '📊 System analytics and reporting',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/models/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
