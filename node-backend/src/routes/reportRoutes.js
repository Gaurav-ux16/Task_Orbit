import { Router } from 'express';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { requireRole } from '../middleware/auth.js';
import { buildSummary, taskCsvLines } from '../services/reportService.js';

const router = Router();

// Reports contain portfolio-wide data => project managers only.
router.use(requireRole('project_manager'));

// GET /api/reports/summary — dashboard numbers
router.get('/summary', async (req, res, next) => {
  try {
    res.json({ success: true, data: await buildSummary() });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/tasks.csv — streamed download (Node streams + async generator)
router.get('/tasks.csv', async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="taskorbit-tasks.csv"');
    await pipeline(Readable.from(taskCsvLines()), res);
  } catch (err) {
    if (!res.headersSent) next(err);
  }
});

export default router;
