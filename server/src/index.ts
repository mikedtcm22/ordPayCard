import express, { Request, Response } from 'express';
import cors from 'cors';
// @ts-ignore
const helmet = require('helmet');
import rateLimit from 'express-rate-limit';
// @ts-ignore
const compression = require('compression');
import pino from 'pino';
import pinoHttp from 'pino-http';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';
import { requestTimeout } from './middleware/timeout';
import authRoutes from './routes/auth';
import membershipRoutes from './routes/membership';
import manualRoutes from './routes/manual';
import inscriptionRoutes from './routes/inscriptions';
import registrationRoutes, { v1RegistrationRouter } from './routes/registration';

const app = express();
const PORT = process.env['PORT'] || 3001;

// Logger setup
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env['CLIENT_URL'] || 'http://localhost:3000',
    credentials: true,
  }),
);

// Compression middleware
app.use(compression());

// Request ID middleware
app.use(requestId);
app.use(requestTimeout());

// Request logging middleware
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }) as any);
app.use(express.urlencoded({ extended: true }) as any);

// HTTP logger (after body parsing)
app.use(pinoHttp({ 
  logger, 
  customProps: (req: any) => ({ requestId: req.id })
}) as any);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: process.env['NODE_ENV'] || 'development',
    requestId: req.id,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/manual', manualRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/v1/registration', v1RegistrationRouter);

// API root
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'SatSpray Membership Card API',
    version: '0.1.0',
    status: 'running',
    requestId: req.id,
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    requestId: req.id,
  });
});

// Centralized error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  logger.info(`🔗 API available at http://localhost:${PORT}/api`);
});

export default app;
