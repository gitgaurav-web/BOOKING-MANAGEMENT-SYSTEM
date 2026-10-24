import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/auth';
import hallsRoutes from './routes/halls';
import availabilityRoutes from './routes/availability';
import bookingsRoutes from './routes/bookings';
import blockedDatesRoutes from './routes/blockedDates';
import maintenanceRoutes from './routes/maintenance';
import holidaysRoutes from './routes/holidays';
import usersRoutes from './routes/users';
import reportsRoutes from './routes/reports';
import notificationsRoutes from './routes/notifications';
import activityLogsRoutes from './routes/activityLogs';
import settingsRoutes from './routes/settings';

import helmet from 'helmet';
import uploadRoutes, { handleAuthorizedFileDownload } from './routes/upload';
import { getJwtSecret } from './utils/jwt';
import { globalApiRateLimiter } from './middleware/rateLimiter';

// Validate JWT configuration
getJwtSecret();

const app = express();
const PORT = process.env.PORT || 5000;

// Reverse-Proxy support for accurate IP detection behind Nginx, Render, Cloudflare
app.set('trust proxy', 1);

// Security Layer: Helmet headers & disable tech stack leakage
app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com', 'https://apis.google.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://lh3.googleusercontent.com'],
        connectSrc: ["'self'", 'https://accounts.google.com', 'https://oauth2.googleapis.com', 'https://www.googleapis.com'],
        frameSrc: ["'self'", 'https://accounts.google.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Production CORS origin restriction based on CLIENT_URL
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : [];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server, mobile or curl requests without origin
    if (!origin) return callback(null, true);

    // In development or test, allow local origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In production, restrict to allowed CLIENT_URL origins (or allow all if in single-host mode without CLIENT_URL)
    if (allowedOrigins.length === 0) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
    return callback(new Error(`Origin ${origin} is not allowed by CORS policy.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Input & Payload size limits: prevent memory exhaustion and DoS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global API rate limiting protection (Layer 04: Anti-scraping and DoS protection)
app.use('/api', globalApiRateLimiter);

// Protected file access for uploads (Requires Bearer token or ?token= query param with owner/admin authorization)
app.get('/uploads/:filename', handleAuthorizedFileDownload);

app.use('/api/upload', uploadRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/halls', hallsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/blocked-dates', blockedDatesRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/holidays', holidaysRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/settings', settingsRoutes);

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    system: 'Seminar Hall & AV Hall Booking Management System API',
  });
});

// Serve React Client in Single-Host Production Mode
const possibleClientDistPaths = [
  path.join(__dirname, 'public'),
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(__dirname, '../client/dist'),
];
const clientDistPath = possibleClientDistPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  console.log(`[PRODUCTION] Serving React client static build from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  console.warn('[PRODUCTION WARNING] Client static build directory was not found. Please verify client build output.');
}

// Global Safe Error Boundary (Layer 04: Don't leak stack traces or internal DB info)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[SERVER UNHANDLED ERROR]:', err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({
    error: isDev
      ? (err.message || 'An unexpected internal error occurred.')
      : 'An unexpected institutional service error occurred. Please contact the campus administrator.',
  });
});

const isTestEnv = process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('test'));
if (!isTestEnv) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app };
export default app;
