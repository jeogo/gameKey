/**
 * Enhanced structured logging system for GameKey Bot
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  component?: string;
  userId?: string;
  orderId?: string;
  transactionId?: string;
  error?: any;
  data?: any;
}

class Logger {
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 1000;

  /**
   * Log an error message
   */
  error(message: string, component?: string, data?: any): void {
    this.log('error', message, component, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, component?: string, data?: any): void {
    this.log('warn', message, component, data);
  }

  /**
   * Log an info message
   */
  info(message: string, component?: string, data?: any): void {
    this.log('info', message, component, data);
  }

  /**
   * Log a debug message
   */
  debug(message: string, component?: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, component, data);
    }
  }

  /**
   * Log a payment event
   */
  payment(message: string, transactionId?: string, data?: any): void {
    this.log('info', message, 'PAYMENT', { transactionId, ...data });
  }

  /**
   * Log an order event
   */
  order(message: string, orderId?: string, userId?: string, data?: any): void {
    this.log('info', message, 'ORDER', { orderId, userId, ...data });
  }

  /**
   * Log a bot event
   */
  bot(message: string, userId?: string, data?: any): void {
    this.log('info', message, 'BOT', { userId, ...data });
  }

  /**
   * Log an API event
   */
  api(message: string, endpoint?: string, method?: string, data?: any): void {
    this.log('info', message, 'API', { endpoint, method, ...data });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, component?: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      component,
      ...data
    };

    // Add to history
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Console output with colors
    const colorCode = this.getColorCode(level);
    const resetCode = '\x1b[0m';
    const componentText = component ? `[${component}]` : '';
    
    console.log(
      `${colorCode}${entry.timestamp} [${level.toUpperCase()}] ${componentText} ${message}${resetCode}`,
      data ? JSON.stringify(data, null, 2) : ''
    );

    // In production, you might want to send logs to external service
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      this.sendToErrorTracking(entry);
    }
  }

  /**
   * Get color code for log level
   */
  private getColorCode(level: LogLevel): string {
    switch (level) {
      case 'error': return '\x1b[31m'; // Red
      case 'warn': return '\x1b[33m';  // Yellow
      case 'info': return '\x1b[36m';  // Cyan
      case 'debug': return '\x1b[37m'; // White
      default: return '\x1b[0m';       // Reset
    }
  }

  /**
   * Send error to external tracking service
   */
  private sendToErrorTracking(entry: LogEntry): void {
    // Placeholder for error tracking service (Sentry, LogRocket, etc.)
    // In production, implement actual error tracking
    console.error('🚨 Critical error logged:', entry);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count = 100): LogEntry[] {
    return this.logHistory.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel, count = 100): LogEntry[] {
    return this.logHistory
      .filter(entry => entry.level === level)
      .slice(-count);
  }

  /**
   * Get logs by component
   */
  getLogsByComponent(component: string, count = 100): LogEntry[] {
    return this.logHistory
      .filter(entry => entry.component === component)
      .slice(-count);
  }

  /**
   * Export logs for debugging
   */
  exportLogs(filters?: { level?: LogLevel; component?: string; since?: Date }): LogEntry[] {
    let logs = this.logHistory;

    if (filters?.level) {
      logs = logs.filter(entry => entry.level === filters.level);
    }

    if (filters?.component) {
      logs = logs.filter(entry => entry.component === filters.component);
    }

    if (filters?.since) {
      logs = logs.filter(entry => new Date(entry.timestamp) >= filters.since!);
    }

    return logs;
  }

  /**
   * Clear log history
   */
  clearLogs(): void {
    this.logHistory = [];
  }
}

// Create singleton instance
export const logger = new Logger();

/**
 * Middleware to log API requests
 */
export function apiLoggingMiddleware(req: any, res: any, next: any) {
  const start = Date.now();
  
  logger.api(
    `${req.method} ${req.path} - Request received`,
    req.path,
    req.method,
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.method !== 'GET' ? req.body : undefined
    }
  );

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'error' : 'info';
    
    logger[level](
      `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
      'API',
      {
        statusCode: res.statusCode,
        duration,
        ip: req.ip
      }
    );
  });

  next();
}

/**
 * Error logging helper
 */
export function logError(error: any, context?: string, data?: any): void {
  logger.error(
    error.message || 'Unknown error',
    context,
    {
      stack: error.stack,
      name: error.name,
      code: error.code,
      ...data
    }
  );
}

/**
 * Payment logging helper
 */
export function logPayment(
  event: string,
  transactionId?: string,
  amount?: number,
  status?: string,
  data?: any
): void {
  logger.payment(
    `Payment ${event}`,
    transactionId,
    {
      amount,
      status,
      ...data
    }
  );
}

/**
 * Order logging helper
 */
export function logOrder(
  event: string,
  orderId?: string,
  userId?: string,
  productId?: string,
  data?: any
): void {
  logger.order(
    `Order ${event}`,
    orderId,
    userId,
    {
      productId,
      ...data
    }
  );
}

/**
 * Bot interaction logging helper
 */
export function logBotInteraction(
  action: string,
  userId?: number,
  command?: string,
  data?: any
): void {
  logger.bot(
    `Bot ${action}`,
    userId?.toString(),
    {
      command,
      ...data
    }
  );
}