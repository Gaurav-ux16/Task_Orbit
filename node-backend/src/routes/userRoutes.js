import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireRole } from '../middleware/auth.js';
import { emailField, personName, passwordField, enumField } from '../validation/rules.js';
import { createStaffUser } from '../controllers/userController.js';

const router = Router();

// Only project managers provision accounts (clients self-register).
router.use(requireRole('project_manager'));

router.post(
  '/',
  [
    emailField(),
    personName(),
    passwordField(),
    enumField('role', ['project_manager', 'assignee', 'reviewer', 'client']),
    body('skills').optional().isArray({ max: 15 }).withMessage('skills must be a list of up to 15 items'),
    body('skills.*').isString().bail().trim().isLength({ min: 1, max: 40 }).withMessage('each skill must be 1–40 characters'),
    validateRequest,
  ],
  createStaffUser
);

export default router;
