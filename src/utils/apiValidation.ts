import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { ObjectId } from 'mongodb';

/**
 * Standardized API Response Interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/**
 * Create a standardized API response
 */
export function createResponse<T>(
  success: boolean,
  data?: T,
  error?: { message: string; code?: string; details?: any },
  meta?: { page?: number; limit?: number; total?: number }
): ApiResponse<T> {
  const response: ApiResponse<T> = { success };

  if (data !== undefined) response.data = data;
  if (error) response.error = error;
  if (meta) response.meta = meta;

  return response;
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  meta?: { page?: number; limit?: number; total?: number }
): ApiResponse<T> {
  return createResponse(true, data, undefined, meta);
}

/**
 * Error response helper
 */
export function errorResponse(message: string, code?: string, details?: any): ApiResponse {
  return createResponse(false, undefined, { message, code, details });
}

/**
 * Validation middleware to handle express-validator errors
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    return res
      .status(400)
      .json(errorResponse('Validation failed', 'VALIDATION_ERROR', errorDetails));
  }

  next();
}

/**
 * MongoDB ObjectId validation
 */
export function validateObjectId(field: string): ValidationChain {
  return param(field)
    .isMongoId()
    .withMessage(`${field} must be a valid MongoDB ObjectId`)
    .custom(value => {
      if (!ObjectId.isValid(value)) {
        throw new Error(`Invalid ObjectId format for ${field}`);
      }
      return true;
    });
}

/**
 * User validation rules
 */
export const validateCreateUser = [
  body('telegramId').isInt({ min: 1 }).withMessage('telegramId must be a positive integer'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 32 })
    .withMessage('username must be between 3 and 32 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('username can only contain letters, numbers, and underscores'),
];

export const validateUpdateUser = [
  validateObjectId('id'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 32 })
    .withMessage('username must be between 3 and 32 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('username can only contain letters, numbers, and underscores'),
];

/**
 * Product validation rules
 */
export const validateCreateProduct = [
  body('name')
    .isLength({ min: 1, max: 255 })
    .withMessage('Product name must be between 1 and 255 characters')
    .trim()
    .escape(),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .trim()
    .escape(),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be a positive number'),
  body('categoryId').isMongoId().withMessage('categoryId must be a valid MongoDB ObjectId'),
  body('digitalContent')
    .isArray({ min: 1 })
    .withMessage('digitalContent must be a non-empty array'),
  body('digitalContent.*')
    .isString()
    .isLength({ min: 5 })
    .withMessage('Each digitalContent item must be a valid string'),
  body('allowPreorder').isBoolean().withMessage('allowPreorder must be a boolean'),
  body('preorderNote')
    .optional()
    .isLength({ max: 500 })
    .withMessage('preorderNote must not exceed 500 characters')
    .trim()
    .escape(),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
];

export const validateUpdateProduct = [
  validateObjectId('id'),
  ...validateCreateProduct.slice(1), // Skip name validation for updates
];

/**
 * Order validation rules
 */
export const validateCreateOrder = [
  body('userId').isMongoId().withMessage('userId must be a valid MongoDB ObjectId'),
  body('productId').isMongoId().withMessage('productId must be a valid MongoDB ObjectId'),
  body('quantity').isInt({ min: 1, max: 100 }).withMessage('quantity must be between 1 and 100'),
  body('type')
    .isIn(['purchase', 'preorder'])
    .withMessage('type must be either "purchase" or "preorder"'),
  body('customerNote')
    .optional()
    .isLength({ max: 500 })
    .withMessage('customerNote must not exceed 500 characters')
    .trim()
    .escape(),
];

export const validateUpdateOrderStatus = [
  validateObjectId('id'),
  body('status')
    .isIn(['pending', 'completed', 'cancelled'])
    .withMessage('status must be one of: pending, completed, cancelled'),
  body('note')
    .optional()
    .isLength({ max: 500 })
    .withMessage('note must not exceed 500 characters')
    .trim()
    .escape(),
];

/**
 * Category validation rules
 */
export const validateCreateCategory = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1 and 100 characters')
    .trim()
    .escape(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .trim()
    .escape(),
];

export const validateUpdateCategory = [validateObjectId('id'), ...validateCreateCategory];

/**
 * Payment validation rules
 */
export const validateUpdatePaymentStatus = [
  validateObjectId('id'),
  body('status')
    .isIn(['pending', 'completed', 'failed', 'cancelled', 'refunded'])
    .withMessage('status must be one of: pending, completed, failed, cancelled, refunded'),
];

/**
 * Pagination validation
 */
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
];

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  // Skip sanitation for Swagger UI & static assets
  const skipPaths = [/^\/api-docs/, /^\/favicon\.ico$/, /^\/\.well-known\//];
  if (skipPaths.some(rx => rx.test(req.path))) {
    return next();
  }

  // Only allow safe characters, strip script/event handler patterns
  const cleanString = (val: string) =>
    val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();

  const mutateObject = (obj: any, depth = 0) => {
    if (!obj || depth > 4) return; // prevent deep / circular traversal
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] === 'string') obj[i] = cleanString(obj[i]);
        else if (typeof obj[i] === 'object') mutateObject(obj[i], depth + 1);
      }
      return;
    }
    if (typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        const value = (obj as any)[key];
        if (typeof value === 'string') {
          (obj as any)[key] = cleanString(value);
        } else if (typeof value === 'object') {
          mutateObject(value, depth + 1);
        }
      }
    }
  };

  try {
    if (req.body && typeof req.body === 'object') mutateObject(req.body);
    // req.query is a getter backed object; mutate keys instead of reassigning
    if (req.query && typeof req.query === 'object') mutateObject(req.query);
    if (req.params && typeof req.params === 'object') mutateObject(req.params);
  } catch (e) {
    // Fail-open: do not block request due to sanitization issues
    console.warn('⚠️ sanitizeInput warning:', (e as Error).message);
  }
  next();
}

/**
 * Request rate limiting per endpoint
 */
export function createRateLimit(windowMs: number, max: number, message?: string) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}_${req.path}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [k, v] of requests.entries()) {
      if (v.resetTime < windowStart) {
        requests.delete(k);
      }
    }

    // Check current request
    const current = requests.get(key);
    if (!current) {
      requests.set(key, { count: 1, resetTime: now });
      return next();
    }

    if (current.count >= max) {
      return res
        .status(429)
        .json(errorResponse(message || 'Too many requests', 'RATE_LIMIT_EXCEEDED'));
    }

    current.count++;
    next();
  };
}

/**
 * Global error handler middleware
 */
export function globalErrorHandler(error: any, req: Request, res: Response, _next: NextFunction) {
  console.error('🚨 API Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return res
      .status(409)
      .json(errorResponse(`Duplicate value for ${field}`, 'DUPLICATE_ERROR', { field }));
  }

  // MongoDB validation error
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
    }));
    return res
      .status(400)
      .json(errorResponse('Database validation failed', 'DB_VALIDATION_ERROR', details));
  }

  // MongoDB cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return res
      .status(400)
      .json(errorResponse('Invalid ID format', 'INVALID_ID', { field: error.path }));
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json(errorResponse(message, 'INTERNAL_ERROR'));
}

/**
 * Legacy validation aliases (for compatibility with existing routes)
 */
export const validateUserCreation = validateCreateUser;
export const validateGcoinDeposit = [
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  handleValidationErrors,
];
export const validateProduct = validateCreateProduct;
export const validatePayment = validateUpdatePaymentStatus;

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json(errorResponse(`Route ${req.method} ${req.path} not found`, 'NOT_FOUND'));
}
