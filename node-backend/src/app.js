import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { devIdentityMiddleware } from './middleware/devIdentity.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import projectRequestRoutes from './routes/projectRequestRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import submissionRoutes, { submissionDownloadRouter } from './routes/submissionRoutes.js';
import reviewRoutes, { taskReviewsRouter } from './routes/reviewRoutes.js';
import activityRoutes, { profilesRouter, workersRouter } from './routes/activityRoutes.js';
import { isSupabaseConfigured, checkSupabaseConnectivity } from './config/supabase.js';

dotenv.config();

const app = express();

// ── Security & logging ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, process.env.FRONTEND_URL || 'http://localhost:5173');
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Dev-User-Id', 'X-Dev-Role'],
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── DEV IDENTITY — replace with Supabase Auth in production ─────────────────
app.use(devIdentityMiddleware);

// ── Health & Supabase diagnostics ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), user: req.user });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'ok', service: 'taskorbit-backend', user: req.user });
});

app.get('/api/supabase/status', (req, res) => {
  res.json({
    ok: true,
    configured: isSupabaseConfigured(),
    projectUrl: isSupabaseConfigured() ? process.env.SUPABASE_URL : null,
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'taskorbit-files',
  });
});

app.get('/api/supabase/connectivity', async (req, res) => {
  const result = await checkSupabaseConnectivity();
  res.status(result.ok ? 200 : 502).json(result);
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/project-requests', projectRequestRoutes);
app.use('/api/projects',         projectRoutes);

// Nested routes: /api/projects/:projectId/activity
app.use('/api/projects/:projectId/activity', activityRoutes);

app.use('/api/tasks',            taskRoutes);

// Nested: /api/tasks/:taskId/submissions
app.use('/api/tasks/:taskId/submissions', submissionRoutes);

// Nested: /api/tasks/:taskId/reviews
app.use('/api/tasks/:taskId/reviews', taskReviewsRouter());

// Standalone: /api/submissions/:id/download
app.use('/api/submissions', submissionDownloadRouter());

// Reviews: /api/reviews/pending  and  /api/submissions/:submissionId/reviews
app.use('/api/reviews', reviewRoutes);
app.use('/api/submissions', reviewRoutes);

// Profiles: /api/profiles  and  Workers: /api/workers
app.use('/api/profiles', profilesRouter());
app.use('/api/workers', workersRouter());

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
