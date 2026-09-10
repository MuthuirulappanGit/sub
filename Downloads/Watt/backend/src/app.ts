import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/authRoutes.js';
import buildingRoutes from './routes/buildingRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import telemetryRoutes from './routes/telemetryRoutes.js';
import wastageRoutes from './routes/wastageRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import simulatorRoutes from './routes/simulatorRoutes.js';

import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Security Header configuration with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allowed for single-page app bundled assets
  })
);

// CORS configuration
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Rate Limiter for API stability
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount API Endpoints
app.use('/api/v1', authRoutes);
app.use('/api/v1', buildingRoutes);
app.use('/api/v1', deviceRoutes);
app.use('/api/v1', telemetryRoutes);
app.use('/api/v1', wastageRoutes);
app.use('/api/v1', analyticsRoutes);
app.use('/api/v1', simulatorRoutes);

// Serve Static Frontend Assets in Production Mode
const frontendDistPath = path.resolve(process.cwd(), 'dist/frontend');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);
