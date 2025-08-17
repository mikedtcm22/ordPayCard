/**
 * @fileoverview Centralized error handling middleware for structured API responses
 * @module middleware/errorHandler
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Custom API error class with structured error information
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  
  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Error code constants for consistent error identification
 */
export const ErrorCodes = {
  INVALID_INSCRIPTION_FORMAT: 'INVALID_INSCRIPTION_FORMAT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',
  DATA_PARSING_ERROR: 'DATA_PARSING_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * Create structured error response
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    requestId: string;
    details?: unknown;
    stack?: string;
  };
}

function createErrorResponse(
  error: ApiError | Error,
  requestId: string,
  includeDebug: boolean
): ErrorResponse {
  if (error instanceof ApiError) {
    const response: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        requestId,
      }
    };
    
    if (includeDebug && error.details) {
      response.error.details = error.details;
    }
    
    if (includeDebug && error.stack) {
      response.error.stack = error.stack;
    }
    
    return response;
  }
  
  // Generic error handling
  const response: ErrorResponse = {
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'An internal error occurred',
      statusCode: 500,
      requestId,
    }
  };
  
  if (includeDebug) {
    response.error.details = { originalError: error.message };
    response.error.stack = error.stack;
  }
  
  return response;
}

/**
 * Centralized error handling middleware
 */
interface RequestWithId extends Request {
  id?: string;
}

export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = (req as RequestWithId).id || uuidv4();
  const includeDebug = process.env['DEBUG'] === '1' || process.env['DEBUG'] === 'true';
  
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const errorResponse = createErrorResponse(err, requestId, includeDebug);
  
  res.status(statusCode).json(errorResponse);
}

/**
 * Wrap async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}