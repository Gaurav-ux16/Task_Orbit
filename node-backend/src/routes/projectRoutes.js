import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireRole, requireAuth } from '../middleware/auth.js';
import {
  text, optionalText, enumField, dateField, uuidParam, uuidBody, profileIdBody, pagination, queryEnum, queryProfileId,
  PROJECT_STATUSES,
} from '../validation/rules.js';
import { listProjects, getProject, createProject, updateProject } from '../controllers/projectController.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  [...pagination(), queryEnum('status', PROJECT_STATUSES), queryProfileId('manager_id'), queryProfileId('client_id'), validateRequest],
  listProjects
);
router.get('/:id', requireAuth, [uuidParam('id'), validateRequest], getProject);

router.post(
  '/',
  requireRole('project_manager'),
  [
    uuidBody('request_id', { optional: true }),
    text('title', { min: 3, max: 120, noAngle: true, label: 'Title' }),
    optionalText('description', { max: 2000, label: 'Description' }),
    profileIdBody('client_id'),
    profileIdBody('manager_id', { optional: true }),
    dateField('start_date', { optional: true, label: 'Start date' }),
    dateField('due_date', { optional: true, label: 'Due date' }),
    validateRequest,
  ],
  createProject
);

router.patch(
  '/:id',
  requireRole('project_manager'),
  [
    uuidParam('id'),
    text('title', { min: 3, max: 120, noAngle: true, optional: true, label: 'Title' }),
    optionalText('description', { max: 2000, label: 'Description' }),
    enumField('status', PROJECT_STATUSES, { optional: true }),
    profileIdBody('manager_id', { optional: true }),
    dateField('start_date', { optional: true, label: 'Start date' }),
    dateField('due_date', { optional: true, label: 'Due date' }),
    validateRequest,
  ],
  updateProject
);

export default router;
