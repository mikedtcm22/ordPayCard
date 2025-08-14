/**
 * @fileoverview Authentication middleware
 * @module middleware/auth
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        address: string;
      };
    }
  }
}

/**
 * JWT authentication middleware
 * Verifies JWT token from Authorization header
 */
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ error: 'Token required' });
    return;
  }

  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    res.status(500).json({ error: 'JWT secret not configured' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      id: string;
      address: string;
    };

    req.user = {
      id: decoded.id,
      address: decoded.address
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(500).json({ error: 'Token verification failed' });
  }
}

/**
 * Optional JWT authentication middleware
 * Allows requests to proceed without token
 */
export function optionalAuthenticateJWT(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      id: string;
      address: string;
    };

    req.user = {
      id: decoded.id,
      address: decoded.address
    };
  } catch {
    // Ignore errors for optional auth
  }

  next();
}