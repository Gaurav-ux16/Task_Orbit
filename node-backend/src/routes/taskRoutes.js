import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireRole, requireAuth } from '../middleware/auth.js';
import {
  text, optionalText, enumField, dateField, uuidParam, uuidBody, profileIdBody, boolField, pagination,
  queryEnum, queryProfileId, queryUuid, PRIORITIES, TASK_STATUSES, UUID_RE,
} from '../validation/rules.js';
import { listTasks, getTask, createTask, updateTask, updateTaskStatus, previewConflicts } from '../controllers/taskController.js';

const router = Router();

router.use(requireAuth);

const optionalAssignee = () =>
  body('assignee_id')
    .optional({ values: 'falsy' })
    .isString().bail()
    .matches(/^[A-Za-z0-9_-]{3,64}$/)
    .withMessage('assignee_id must be a valid user id');

router.get(
  '/',
  [
    ...pagination(),
    queryUuid('project_id'),
    queryProfileId('assignee_id'),
    queryEnum('status', TASK_STATUSES),
    queryEnum('priority', PRIORITIES),
    validateRequest,
  ],
  listTasks
);
router.get('/:id', [uuidParam('id'), validateRequest], getTask);

router.post(
  '/',
  requireRole('project_manager'),
  [
    uuidBody('project_id'),
    text('title', { min: 3, max: 120, noAngle: true, label: 'Title' }),
    optionalText('description', { max: 2000, label: 'Description' }),
    optionalAssignee(),
    enumField('priority', PRIORITIES),
    dateField('start_date', { label: 'Start date' }),
    dateField('due_date', { label: 'Due date' }),
    boolField('override_conflicts'),
    validateRequest,
  ],
  createTask
);

// Managers edit everything; assignees may only edit `description` of their own task (controller enforces).
router.patch(
  '/:id',
  requireRole('project_manager', 'assignee'),
  [
    uuidParam('id'),
    text('title', { min: 3, max: 120, noAngle: true, optional: true, label: 'Title' }),
    optionalText('description', { max: 2000, label: 'Description' }),
    optionalAssignee(),
    enumField('priority', PRIORITIES, { optional: true }),
    dateField('start_date', { optional: true, label: 'Start date' }),
    dateField('due_date', { optional: true, label: 'Due date' }),
    boolField('override_conflicts'),
    validateRequest,
  ],
  updateTask
);

// Transition authorisation (role + ownership + legal edge) is enforced by the workflow service.
router.post('/:id/status', [uuidParam('id'), enumField('status', TASK_STATUSES), validateRequest], updateTaskStatus);

// Conflict preview — does NOT change the database. `:id` may be the literal "new".
router.post(
  '/:id/conflict-preview',
  requireRole('project_manager'),
  [
    param('id')
      .custom((v) => v === 'new' || UUID_RE.test(v))
      .withMessage('id must be a task id or "new"'),
    profileIdBody('assignee_id'),
    dateField('start_date', { label: 'Start date' }),
    dateField('due_date', { label: 'Due date' }),
    validateRequest,
  ],
  previewConflicts
);

export default router;
