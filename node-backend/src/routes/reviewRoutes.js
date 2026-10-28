import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { getPendingReviews, createReview, getTaskReviews } from '../controllers/reviewController.js';

const router = Router();

router.get('/pending', getPendingReviews);

// POST /api/submissions/:submissionId/reviews
router.post('/:submissionId/reviews', [
  body('decision').isIn(['approved', 'revision']).withMessage("Decision must be 'approved' or 'revision'"),
  body('task_id').notEmpty().withMessage('task_id is required'),
  validateRequest,
], createReview);

export default router;

// Task reviews sub-router (mounted under tasks)
export function taskReviewsRouter() {
  const r = Router({ mergeParams: true });
  r.get('/', getTaskReviews);
  return r;
}
