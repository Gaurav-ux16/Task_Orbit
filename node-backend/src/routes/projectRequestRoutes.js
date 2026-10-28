import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  listProjectRequests,
  getProjectRequest,
  createProjectRequest,
  updateProjectRequest,
} from '../controllers/projectRequestController.js';

const router = Router();

router.get('/', listProjectRequests);
router.get('/:id', getProjectRequest);

router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('requested_deadline').isISO8601().withMessage('Invalid deadline date'),
  validateRequest,
], createProjectRequest);

router.patch('/:id', updateProjectRequest);

export default router;
