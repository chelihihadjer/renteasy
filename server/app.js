import express from 'express';
import cors from 'cors';
import { UPLOAD_DIR } from './config/paths.js';
import { errorHandler, notFound } from './middleware/error.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';
import propertyRoutes from './routes/properties.js';
import requestRoutes from './routes/requests.js';
import statsRoutes from './routes/stats.js';
import tenantRoutes from './routes/tenant.js';
import uploadRoutes from './routes/uploads.js';
import userRoutes from './routes/users.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',') }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', index: false }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tenant', tenantRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
