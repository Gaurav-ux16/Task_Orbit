import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { listProjects, getProject, createProject, updateProject } from '../controllers/projectController.js';

const router = Router();

router.get('/', listProjects);
router.get('/:id', getProject);

router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('client_id').notEmpty().withMessage('Client ID is required'),
  body('manager_id').notEmpty().withMessage('Manager ID is required'),
  validateRequest,
], createProject);

router.patch('/:id', updateProject);

export default router;
