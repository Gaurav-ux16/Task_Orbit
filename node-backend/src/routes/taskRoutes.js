import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  previewConflicts,
} from '../controllers/taskController.js';

const router = Router();

router.get('/', listTasks);
router.get('/:id', getTask);

router.post('/', [
  body('project_id').notEmpty().withMessage('Project ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('start_date').isISO8601().withMessage('Invalid start date'),
  body('due_date').isISO8601().withMessage('Invalid due date'),
  validateRequest,
], createTask);

router.patch('/:id', updateTask);

router.post('/:id/status', [
  body('status').isIn(['todo', 'in_progress', 'submitted', 'in_review', 'approved', 'revision'])
    .withMessage('Invalid status value'),
  validateRequest,
], updateTaskStatus);

// Conflict preview — does NOT change the database
router.post('/:id/conflict-preview', [
  body('assignee_id').notEmpty().withMessage('assignee_id is required'),
  body('start_date').isISO8601().withMessage('Invalid start_date'),
  body('due_date').isISO8601().withMessage('Invalid due_date'),
  validateRequest,
], previewConflicts);

export default router;
