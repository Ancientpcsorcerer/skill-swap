import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { apiRouter } from './routes';
import { healthRouter } from './routes/health';
import { NotFoundError } from './utils/errors';

export const app = express();

// Security and utility middleware
// Strict allowed frontend origins whitelist
const ALLOWED_FRONTEND_ORIGINS = [
  'https://skill-swap-xi-lake.vercel.app',
  'https://skill-swap.vercel.app',
  'https://skill-swap-git-main-ancientpcsorcerer.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // allow curl, health monitors, mobile apps without origin
  if (ALLOWED_FRONTEND_ORIGINS.includes(origin)) return true;
  // Allow project-specific Vercel preview URLs for skill-swap
  if (/^https:\/\/skill-swap(-[a-z0-9-]+)?-ancientpcsorcerer\.vercel\.app$/.test(origin)) {
    return true;
  }
  // Check configured CORS_ORIGIN
  const envOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter((o) => o !== '*');
  return envOrigins.includes(origin);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Security policy: Origin '${origin}' is not authorized to access this API.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Rate limiting
app.use('/api/', generalLimiter);

// Direct health checks
app.use(healthRouter);

// API routes
app.use('/api/v1', apiRouter);

// 404 Catch-all
app.use((req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Centralized error handler
app.use(errorHandler);
