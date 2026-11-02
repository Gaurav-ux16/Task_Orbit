import { detectThreat, normalizeText } from './inputSecurity';

/**
 * Form validation (client side). Each validator returns an error string or ''.
 * Every free-text field is also screened for SQL / script / command injection
 * BEFORE the form is submitted. The API repeats all of these checks.
 */

export const PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = ['zip', 'pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'txt', 'tar', 'gz'];

const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{1,79}$/u;
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

export function isRealDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Generic text field: required?, length, no markup, no injection payloads. */
export function validateText(value, { label = 'This field', min = 0, max = 200, required = false, noAngle = false } = {}) {
  const v = typeof value === 'string' ? normalizeText(value) : '';
  if (!v) return required ? `${label} is required` : '';
  if (v.length < min) return `${label} must be at least ${min} characters`;
  if (v.length > max) return `${label} must be at most ${max} characters`;
  if (noAngle && /[<>]/.test(v)) return `${label} must not contain < or >`;
  const threat = detectThreat(v);
  if (threat) return `${label} contains disallowed content (${threat.replace('-', ' ')}). Remove special code or markup.`;
  return '';
}

export const validateEmail = (value) => {
  const v = (value || '').trim();
  if (!v) return 'E-mail is required';
  if (v.length > 254 || !EMAIL.test(v)) return 'Enter a valid e-mail address';
  return '';
};

export const validateName = (value) => {
  const v = normalizeText(value || '');
  if (!v) return 'Name is required';
  if (!PERSON_NAME.test(v)) return "Name must be 2–80 letters (spaces, . ' - allowed)";
  return '';
};

/** Password policy — mirrors the server (utils/password.js). */
export function passwordProblems(password, { email = '', name = '' } = {}) {
  const p = [];
  if (!password) return ['Password is required'];
  if (password.length < 10) p.push('at least 10 characters');
  if (password.length > 128) p.push('at most 128 characters');
  if (!/[a-z]/.test(password)) p.push('a lowercase letter');
  if (!/[A-Z]/.test(password)) p.push('an uppercase letter');
  if (!/\d/.test(password)) p.push('a digit');
  if (!/[^A-Za-z0-9]/.test(password)) p.push('a symbol');
  const local = email.split('@')[0].toLowerCase();
  if (local.length >= 3 && password.toLowerCase().includes(local)) p.push('no part of your e-mail');
  const first = name.trim().split(/\s+/)[0]?.toLowerCase();
  if (first && first.length >= 4 && password.toLowerCase().includes(first)) p.push('no part of your name');
  return p;
}

export const validatePassword = (password, ctx) => {
  const problems = passwordProblems(password, ctx);
  if (problems.length === 0) return '';
  return problems[0] === 'Password is required' ? problems[0] : `Password needs ${problems.join(', ')}`;
};

export function validateDate(value, { label = 'Date', required = false } = {}) {
  if (!value) return required ? `${label} is required` : '';
  return isRealDate(value) ? '' : `${label} must be a valid date`;
}

export function validateDateRange(start, due) {
  if (start && due && isRealDate(start) && isRealDate(due) && start > due) return 'Start date must not be after due date';
  return '';
}

export function validateFile(file) {
  if (!file) return 'Please attach a deliverable file to submit.';
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) return `Invalid file format .${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
  if (/\.(php\d?|exe|dll|bat|cmd|sh|js|jsp|py|ps1|vbs|jar|html?|svg)\.[a-z0-9]+$/i.test(file.name)) return 'Executable or script-like file names are not allowed.';
  if (file.size === 0) return 'The selected file is empty.';
  if (file.size > MAX_UPLOAD_BYTES) return `File size (${(file.size / 1048576).toFixed(1)} MB) exceeds the 25 MB limit.`;
  return '';
}

/** Runs a map of field => validator-result and returns only the failing ones. */
export function collectErrors(checks) {
  return Object.fromEntries(Object.entries(checks).filter(([, msg]) => msg));
}

export const validateProjectRequest = (f) =>
  collectErrors({
    title: validateText(f.title, { label: 'Title', min: 3, max: 120, required: true, noAngle: true }),
    description: validateText(f.description, { label: 'Description', min: 10, max: 2000, required: true }),
    requirements: validateText(f.requirements, { label: 'Requirements', max: 2000 }),
    requested_deadline: validateDate(f.requested_deadline, { label: 'Deadline', required: true }),
    priority: PRIORITIES.includes(f.priority) ? '' : 'Choose a valid priority',
  });

export const validateProject = (f) =>
  collectErrors({
    title: validateText(f.title, { label: 'Title', min: 3, max: 120, required: true, noAngle: true }),
    description: validateText(f.description, { label: 'Description', max: 2000 }),
    client_id: f.client_id ? '' : 'Choose a client',
    start_date: validateDate(f.start_date, { label: 'Start date' }),
    due_date: validateDate(f.due_date, { label: 'Due date' }),
    range: validateDateRange(f.start_date, f.due_date),
  });

export const validateTask = (f) =>
  collectErrors({
    title: validateText(f.title, { label: 'Title', min: 3, max: 120, required: true, noAngle: true }),
    description: validateText(f.description, { label: 'Description', max: 2000 }),
    priority: PRIORITIES.includes(f.priority) ? '' : 'Choose a valid priority',
    start_date: validateDate(f.start_date, { label: 'Start date', required: true }),
    due_date: validateDate(f.due_date, { label: 'Due date', required: true }),
    range: validateDateRange(f.start_date, f.due_date),
  });

export const validateReview = ({ decision, feedback }) =>
  collectErrors({
    feedback: validateText(feedback, { label: 'Feedback', max: 2000, required: decision === 'revision' }),
  });

export const validateSubmission = ({ file, description, isRevision }) =>
  collectErrors({
    file: validateFile(file),
    description: validateText(description, { label: 'Submission note', max: 1000, required: isRevision }),
  });

export const validateLogin = ({ email, password }) =>
  collectErrors({
    email: validateEmail(email),
    password: password ? '' : 'Password is required',
  });

export const validateRegistration = ({ display_name, email, password, confirm }) =>
  collectErrors({
    display_name: validateName(display_name),
    email: validateEmail(email),
    password: validatePassword(password, { email, name: display_name }),
    confirm: confirm === password ? '' : 'Passwords do not match',
  });

export const validateStaffAccount = ({ display_name, email, password, role, skills }) =>
  collectErrors({
    display_name: validateName(display_name),
    email: validateEmail(email),
    password: validatePassword(password, { email, name: display_name }),
    role: ['project_manager', 'assignee', 'reviewer', 'client'].includes(role) ? '' : 'Choose a role',
    skills: validateText(skills, { label: 'Skills', max: 300 }),
  });
