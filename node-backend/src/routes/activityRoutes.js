import { Router } from 'express';
import { getProjectActivity, getProfiles, getWorkersDirectory } from '../controllers/activityController.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:projectId/activity
router.get('/', getProjectActivity);

export default router;

export function profilesRouter() {
  const r = Router();
  r.get('/', getProfiles);
  r.get('/workers', getWorkersDirectory);
  return r;
}

export function workersRouter() {
  const r = Router();
  r.get('/', getWorkersDirectory);
  return r;
}
