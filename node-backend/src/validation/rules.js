import { body, param, query } from 'express-validator';

export const PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const TASK_STATUSES = ['todo', 'in_progress', 'submitted', 'in_review', 'approved', 'revision'];
export const REQUEST_STATUSES = ['pending', 'reviewing', 'approved', 'rejected'];
export const PROJECT_STATUSES = ['active', 'on_hold', 'completed', 'cancelled'];
export const ROLES = ['client', 'project_manager', 'assignee', 'reviewer'];

// Any 8-4-4-4-12 hex id (Postgres uuid columns; also accepts the fixed-pattern seed ids).
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROFILE_ID = /^[A-Za-z0-9_-]{3,64}$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{1,79}$/u;

export const isRealDate = (value) => {
  if (typeof value !== 'string' || !DATE_ONLY.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};

/** `field` must be a string (never an object/array) within [min,max]. */
export function text(field, { min = 1, max = 200, optional = false, noAngle = false, label } = {}) {
  const name = label || field;
  let chain = body(field);
  chain = optional ? chain.optional({ values: 'null' }) : chain;
  chain = chain
    .isString().withMessage(`${name} must be text`).bail()
    .trim()
    .isLength({ min, max }).withMessage(`${name} must be ${min === max ? `exactly ${min}` : `${min}–${max}`} characters`);
  if (noAngle) chain = chain.not().matches(/[<>]/).withMessage(`${name} must not contain < or >`);
  return chain;
}

export const optionalText = (field, opts = {}) => text(field, { ...opts, min: 0, optional: true });

export const enumField = (field, values, { optional = false, location = body } = {}) => {
  let chain = location(field);
  if (optional) chain = chain.optional();
  return chain.isString().bail().isIn(values).withMessage(`${field} must be one of: ${values.join(', ')}`);
};

export const dateField = (field, { optional = false, label } = {}) => {
  let chain = body(field);
  if (optional) chain = chain.optional({ values: 'null' });
  return chain
    .isString().bail()
    .custom(isRealDate)
    .withMessage(`${label || field} must be a valid date (YYYY-MM-DD)`);
};

export const uuidParam = (name = 'id') => param(name).matches(UUID_RE).withMessage(`${name} must be a valid id`);
export const uuidBody = (field, { optional = false } = {}) => {
  let chain = body(field);
  if (optional) chain = chain.optional({ values: 'null' });
  return chain.isString().bail().matches(UUID_RE).withMessage(`${field} must be a valid id`);
};
export const profileIdBody = (field, { optional = false } = {}) => {
  let chain = body(field);
  if (optional) chain = chain.optional({ values: 'null' });
  return chain.isString().bail().matches(PROFILE_ID).withMessage(`${field} must be a valid user id`);
};

export const emailField = (field = 'email') =>
  body(field)
    .isString().withMessage('E-mail must be text').bail()
    .trim()
    .isLength({ max: 254 }).withMessage('E-mail is too long').bail()
    .isEmail({ allow_utf8_local_part: false }).withMessage('Enter a valid e-mail address').bail()
    .customSanitizer((v) => v.toLowerCase());

export const personName = (field = 'display_name') =>
  body(field)
    .isString().withMessage('Name must be text').bail()
    .trim()
    .matches(PERSON_NAME).withMessage('Name must be 2–80 letters (spaces, . \' - allowed)');

export const passwordField = (field = 'password') =>
  body(field)
    .isString().withMessage('Password must be text').bail()
    .isLength({ min: 1, max: 128 }).withMessage('Password must be at most 128 characters');

export const boolField = (field) => body(field).optional().isBoolean().withMessage(`${field} must be true or false`).toBoolean();

export const pagination = () => [
  query('page').optional().isInt({ min: 1, max: 100000 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100').toInt(),
];

export const queryEnum = (field, values) =>
  query(field).optional().isString().bail().isIn(values).withMessage(`${field} must be one of: ${values.join(', ')}`);

export const queryProfileId = (field) =>
  query(field).optional().isString().bail().matches(PROFILE_ID).withMessage(`${field} must be a valid user id`);

export const queryUuid = (field) => query(field).optional().isString().bail().matches(UUID_RE).withMessage(`${field} must be a valid id`);
