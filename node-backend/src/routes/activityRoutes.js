import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireRole } from '../middleware/auth.js';
import { uuidParam, pagination } from '../validation/rules.js';
import { getProjectActivity, getProfiles, getWorkersDirectory } from '../controllers/activityController.js';
import { queryEnum, ROLES } from '../validation/rules.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:projectId/activity (scoped per role in the controller)
router.get('/', [uuidParam('projectId'), ...pagination(), validateRequest], getProjectActivity);

export default router;

// Directory data contains e-mail addresses => project managers only.
export function profilesRouter() {
  const r = Router();
  r.use(requireRole('project_manager'));
  r.get('/', [queryEnum('role', ROLES), validateRequest], getProfiles);
  r.get('/workers', getWorkersDirectory);
  return r;
}

export function workersRouter() {
  const r = Router();
  r.use(requireRole('project_manager'));
  r.get('/', getWorkersDirectory);
  return r;
}
