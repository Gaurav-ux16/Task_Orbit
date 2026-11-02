import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { isProduction, isTest } from './config/env.js';
import { requestId, securityHeaders, corsPolicy, noStore } from './middleware/security.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { inputGuard } from './middleware/inputGuard.js';
import { attachSession, csrfProtection, requireAuth, requireRole } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRequestRoutes from './routes/projectRequestRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import submissionRoutes, { submissionDownloadRouter } from './routes/submissionRoutes.js';
import reviewRoutes, { taskReviewsRouter } from './routes/reviewRoutes.js';
import activityRoutes, { profilesRouter, workersRouter } from './routes/activityRoutes.js';
import { isSupabaseConfigured, checkSupabaseConnectivity } from './config/supabase.js';

const app = express();

// ── Hardening ────────────────────────────────────────────────────────────────
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

app.use(requestId);
app.use(securityHeaders());
app.use(corsPolicy());
if (!isTest()) app.use(morgan(isProduction() ? 'combined' : 'dev'));
app.use(apiLimiter());
app.use(noStore);

// ── Parsing (small limits) ───────────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());

// ── Input screening, session, CSRF — before any route logic ──────────────────
app.use(inputGuard);
app.use(attachSession);
app.use(csrfProtection);

// ── Public endpoints ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'ok', service: 'taskorbit-backend' });
});

app.use('/api/auth', authRoutes);

// ── Everything below requires a valid session ────────────────────────────────
app.use('/api', requireAuth);

// Operational diagnostics: managers only (they reveal infrastructure details).
app.get('/api/supabase/status', requireRole('project_manager'), (req, res) => {
  res.json({
    ok: true,
    configured: isSupabaseConfigured(),
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'taskorbit-files',
  });
});

app.get('/api/supabase/connectivity', requireRole('project_manager'), async (req, res) => {
  const result = await checkSupabaseConnectivity();
  res.status(result.ok ? 200 : 502).json(result);
});

app.use('/api/users', userRoutes);
app.use('/api/project-requests', projectRequestRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/activity', activityRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tasks/:taskId/submissions', submissionRoutes);
app.use('/api/tasks/:taskId/reviews', taskReviewsRouter());
app.use('/api/submissions', submissionDownloadRouter());
app.use('/api/reviews', reviewRoutes);
app.use('/api/submissions', reviewRoutes);
app.use('/api/profiles', profilesRouter());
app.use('/api/workers', workersRouter());

// ── Errors ───────────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
