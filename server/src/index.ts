import 'dotenv/config';
import express from 'express';
import cors from 'cors';

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

import uploadRoutes, { handleAuthorizedFileDownload } from './routes/upload';
import { getJwtSecret } from './utils/jwt';

// Validate JWT configuration
getJwtSecret();

const app = express();
const PORT = process.env.PORT || 5000;

// Production CORS origin restriction based on CLIENT_URL
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : [];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server, mobile or curl requests without origin
    if (!origin) return callback(null, true);
    // In development or test, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // In production, restrict to allowed CLIENT_URL origins
    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS policy.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(express.json());

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

const isTestEnv = process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('test'));
if (!isTestEnv) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app };
export default app;
