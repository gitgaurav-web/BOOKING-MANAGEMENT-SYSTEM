import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

import uploadRoutes from './routes/upload';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './utils/jwt';

dotenv.config();

// Validate JWT configuration
getJwtSecret();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Protected file access for uploads (Requires Bearer token or ?token= query param)
app.get('/uploads/:filename', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.split(' ')[1] 
    : (req.query.token as string);

  if (!token) {
    res.status(401).json({ error: 'Authentication required to access permission documents.' });
    return;
  }

  try {
    jwt.verify(token, getJwtSecret());
  } catch {
    res.status(403).json({ error: 'Invalid or expired authentication token.' });
    return;
  }

  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(process.cwd(), 'uploads', safeFilename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Requested file not found.' });
    return;
  }

  res.sendFile(filePath);
});

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
