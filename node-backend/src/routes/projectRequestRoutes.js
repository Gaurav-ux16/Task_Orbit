import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireRole } from '../middleware/auth.js';
import {
  text, optionalText, enumField, dateField, uuidParam, pagination, queryEnum, queryProfileId,
  PRIORITIES, REQUEST_STATUSES,
} from '../validation/rules.js';
import {
  listProjectRequests,
  getProjectRequest,
  createProjectRequest,
  updateProjectRequest,
} from '../controllers/projectRequestController.js';

const router = Router();

// Clients (own requests) and managers (all). Other roles have no business here.
router.use(requireRole('client', 'project_manager'));

router.get('/', [...pagination(), queryEnum('status', REQUEST_STATUSES), queryProfileId('client_id'), validateRequest], listProjectRequests);
router.get('/:id', [uuidParam('id'), validateRequest], getProjectRequest);

router.post(
  '/',
  requireRole('client'),
  [
    text('title', { min: 3, max: 120, noAngle: true, label: 'Title' }),
    text('description', { min: 10, max: 2000, label: 'Description' }),
    optionalText('requirements', { max: 2000, label: 'Requirements' }),
    enumField('priority', PRIORITIES),
    dateField('requested_deadline', { label: 'Deadline' }),
    validateRequest,
  ],
  createProjectRequest
);

router.patch(
  '/:id',
  [
    uuidParam('id'),
    text('title', { min: 3, max: 120, noAngle: true, optional: true, label: 'Title' }),
    text('description', { min: 10, max: 2000, optional: true, label: 'Description' }),
    optionalText('requirements', { max: 2000, label: 'Requirements' }),
    enumField('priority', PRIORITIES, { optional: true }),
    dateField('requested_deadline', { optional: true, label: 'Deadline' }),
    enumField('status', REQUEST_STATUSES, { optional: true }),
    validateRequest,
  ],
  updateProjectRequest
);

export default router;
