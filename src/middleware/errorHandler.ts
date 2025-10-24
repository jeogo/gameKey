import { Request, Response, NextFunction } from 'express';
import { performanceMonitor } from '../utils/performance';

// Custom error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, _fields?: string[]) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';

    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    details?: any;
  };
}

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error for monitoring
  console.error('Error caught by global handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Track error in performance monitor
  performanceMonitor
    .monitor('error.global', async () => {
      throw err;
    })
    .catch(() => {}); // Silent catch to avoid recursion

  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code || 'APP_ERROR';
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    statusCode = 500;
    code = 'DATABASE_ERROR';
    message = 'Database operation failed';
  } else if (err.name === 'SyntaxError' && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON format';
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.details = {
      stack: err.stack,
      originalError: err.name,
    };
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Database operation wrapper with error handling
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error(`Database error in ${context}:`, error);

    if (error instanceof Error) {
      // Handle specific MongoDB errors
      if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        throw new DatabaseError(`Database operation failed in ${context}`, error);
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        throw new ValidationError(`Validation failed in ${context}: ${error.message}`);
      }

      // Handle duplicate key errors
      if ('code' in error && error.code === 11000) {
        throw new ConflictError('Resource already exists with provided data');
      }
    }

    throw error;
  }
};

/**
 * Service operation wrapper with context
 */
export const withServiceContext = async <T>(
  service: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const timer = performanceMonitor.startTimer(`service.${service}.${operation}`);

  try {
    const result = await fn();
    timer.end(true);
    return result;
  } catch (error) {
    timer.end(false, error instanceof Error ? error.message : 'Unknown error');

    // Add service context to error
    if (error instanceof Error) {
      error.message = `[${service}:${operation}] ${error.message}`;
    }

    throw error;
  }
};

/**
 * Controller response wrapper
 */
export const sendResponse = <T>(res: Response, data: T, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Controller error response wrapper
 */
export const sendError = (res: Response, error: AppError | Error, statusCode?: number) => {
  const code = error instanceof AppError ? error.code : 'UNKNOWN_ERROR';
  const status = statusCode || (error instanceof AppError ? error.statusCode : 500);

  res.status(status).json({
    success: false,
    error: {
      code,
      message: error.message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Retry wrapper for unreliable operations
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError!;
};

/**
 * Circuit breaker for external services
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold = 5,
    private timeout = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime < this.timeout) {
        throw new ExternalServiceError('Circuit Breaker', 'Service temporarily unavailable');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

export const circuitBreaker = new CircuitBreaker();
