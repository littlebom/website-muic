/**
 * Structured Logging Utility
 * สำหรับ monitoring และ debugging ในระบบ production
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  /** Request ID สำหรับ trace requests */
  requestId?: string;
  /** User ID */
  userId?: string;
  /** API endpoint */
  endpoint?: string;
  /** Response time (ms) */
  responseTime?: number;
  /** HTTP status code */
  statusCode?: number;
  /** Error details */
  error?: Error | string;
  /** Additional metadata */
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

/**
 * Format log entry as JSON
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && { context }),
  };
}

/**
 * Log at DEBUG level
 */
export function debug(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === 'development') {
    const log = formatLog(LogLevel.DEBUG, message, context);
    console.log(JSON.stringify(log, null, 2));
  }
}

/**
 * Log at INFO level
 */
export function info(message: string, context?: LogContext): void {
  const log = formatLog(LogLevel.INFO, message, context);
  console.log(JSON.stringify(log));
}

/**
 * Log at WARN level
 */
export function warn(message: string, context?: LogContext): void {
  const log = formatLog(LogLevel.WARN, message, context);
  console.warn(JSON.stringify(log));
}

/**
 * Log at ERROR level
 */
export function error(message: string, context?: LogContext): void {
  const log = formatLog(LogLevel.ERROR, message, context);
  console.error(JSON.stringify(log));
}

/**
 * Log API request/response
 */
export function logApiCall(
  method: string,
  endpoint: string,
  statusCode: number,
  responseTime: number,
  context?: Omit<LogContext, 'endpoint' | 'statusCode' | 'responseTime'>
): void {
  info(`${method} ${endpoint} - ${statusCode}`, {
    endpoint,
    statusCode,
    responseTime,
    ...context,
  });
}

/**
 * Log database query
 */
export function logQuery(
  query: string,
  duration: number,
  context?: LogContext
): void {
  if (process.env.NODE_ENV === 'development') {
    debug(`DB Query: ${duration}ms`, {
      query: query.substring(0, 200), // Limit query length
      duration,
      ...context,
    });
  }
}

/**
 * Log error with stack trace
 */
export function logError(
  err: Error,
  message: string,
  context?: Omit<LogContext, 'error'>
): void {
  error(message, {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    ...context,
  });
}

/**
 * Performance monitoring helper
 */
export class PerformanceMonitor {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
  }

  end(context?: LogContext): number {
    const duration = Date.now() - this.startTime;

    if (duration > 1000) {
      // Log slow operations
      warn(`Slow operation: ${this.operation} took ${duration}ms`, {
        operation: this.operation,
        duration,
        ...context,
      });
    } else if (process.env.NODE_ENV === 'development') {
      debug(`${this.operation}: ${duration}ms`, {
        operation: this.operation,
        duration,
        ...context,
      });
    }

    return duration;
  }
}

/**
 * Create request ID for tracing
 */
export function createRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export default {
  debug,
  info,
  warn,
  error,
  logApiCall,
  logQuery,
  logError,
  PerformanceMonitor,
  createRequestId,
};
