import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireRole } from '../middleware/auth.js';
import { uuidParam, uuidBody, optionalText } from '../validation/rules.js';
import { getPendingReviews, createReview, getTaskReviews } from '../controllers/reviewController.js';

const router = Router();

// Review queue: reviewers (and managers for oversight)
router.get('/pending', requireRole('reviewer', 'project_manager'), getPendingReviews);

// POST /api/submissions/:submissionId/reviews — reviewers only
router.post(
  '/:submissionId/reviews',
  requireRole('reviewer'),
  [
    uuidParam('submissionId'),
    body('decision').isString().bail().isIn(['approved', 'revision']).withMessage("Decision must be 'approved' or 'revision'"),
    uuidBody('task_id', { optional: true }),
    optionalText('feedback', { max: 2000 }),
    validateRequest,
  ],
  createReview
);

export default router;

// Task reviews sub-router (mounted under tasks)
export function taskReviewsRouter() {
  const r = Router({ mergeParams: true });
  r.get('/', [uuidParam('taskId'), validateRequest], getTaskReviews);
  return r;
}
