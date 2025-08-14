import { Request, Response, NextFunction } from 'express';

const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds

export function requestTimeout(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      const requestId = req.id || res.locals['requestId'];
      // Log the timeout event
      // eslint-disable-next-line no-console
      console.error(
        `[TIMEOUT] Request ${requestId || ''} ${req.method} ${req.originalUrl} exceeded ${timeoutMs}ms`,
      );
      if (!res.headersSent) {
        res.status(503).json({
          error: 'Request Timeout',
          message: `Request exceeded ${timeoutMs}ms`,
          requestId,
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  };
}
