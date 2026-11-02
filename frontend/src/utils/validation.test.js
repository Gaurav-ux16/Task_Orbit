import { describe, test, expect } from 'vitest';
import {
  validateText, validateEmail, validateName, validatePassword, validateDate, validateDateRange, validateFile,
  validateProjectRequest, validateProject, validateTask, validateReview, validateSubmission, validateLogin,
  validateRegistration, validateStaffAccount, isRealDate, MAX_UPLOAD_BYTES,
} from './validation';
import { detectThreat, scanPayload } from './inputSecurity';

const file = (name, size = 100) => ({ name, size });

describe('validateText', () => {
  test('required / optional', () => {
    expect(validateText('', { label: 'Title', required: true })).toMatch(/required/);
    expect(validateText('   ', { label: 'Title', required: true })).toMatch(/required/);
    expect(validateText('', { label: 'Notes' })).toBe('');
  });
  test('length bounds', () => {
    expect(validateText('ab', { label: 'Title', min: 3 })).toMatch(/at least 3/);
    expect(validateText('x'.repeat(11), { label: 'Title', max: 10 })).toMatch(/at most 10/);
    expect(validateText('abc', { label: 'Title', min: 3, max: 10 })).toBe('');
  });
  test('angle brackets only blocked where requested', () => {
    expect(validateText('a < b', { noAngle: true })).toMatch(/< or >/);
    expect(validateText('a < b')).toBe('');
  });
});

describe('injection screening in text fields', () => {
  const attacks = [
    "' OR '1'='1' --",
    "'; DROP TABLE users; --",
    'x UNION SELECT password FROM users',
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '../../etc/passwd',
    '$(whoami)',
    '{{7*7}}',
  ];
  test.each(attacks)('blocks %s', (payload) => {
    expect(validateText(payload, { label: 'Title' })).toMatch(/disallowed content/);
    expect(
      validateProjectRequest({
        title: payload, description: 'A valid description text', priority: 'low', requested_deadline: '2027-01-01',
      }).title
    ).toBeTruthy();
    expect(
      validateTask({
        title: 'Valid', description: payload, priority: 'low', start_date: '2027-01-01', due_date: '2027-01-02',
      }).description
    ).toBeTruthy();
    expect(validateReview({ decision: 'approved', feedback: payload }).feedback).toBeTruthy();
    expect(validateSubmission({ file: file('a.zip'), description: payload, isRevision: false }).description).toBeTruthy();
  });
  test('allows normal business text', () => {
    expect(validateText('Implement the product listing page (v2) — filters & sorting', { label: 'Title' })).toBe('');
    expect(validateText("Carol's task: select the best option from the list", { label: 'Title' })).toBe('');
  });
  test('detectThreat / scanPayload helpers', () => {
    expect(detectThreat('hello world')).toBeNull();
    expect(scanPayload({ a: ['ok', '<b onclick=x>'] })).toHaveLength(1);
  });
});

describe('identity fields', () => {
  test('email', () => {
    expect(validateEmail('')).toMatch(/required/);
    expect(validateEmail('nope')).toMatch(/valid/);
    expect(validateEmail('a@b')).toMatch(/valid/);
    expect(validateEmail('<x>@b.co')).toMatch(/valid/);
    expect(validateEmail('alice@clientcorp.io')).toBe('');
  });
  test('name', () => {
    expect(validateName('')).toMatch(/required/);
    expect(validateName('A')).toMatch(/2–80/);
    expect(validateName('12345')).toMatch(/2–80/);
    expect(validateName("José O'Neil-Müller")).toBe('');
  });
  test('password policy', () => {
    expect(validatePassword('')).toMatch(/required/);
    expect(validatePassword('short')).toMatch(/10 characters/);
    expect(validatePassword('alllowercase1!')).toMatch(/uppercase/);
    expect(validatePassword('Str0ng!Passphrase')).toBe('');
    expect(validatePassword('Alice-Secret1!', { email: 'alice@x.io' })).toMatch(/e-mail/);
  });
});

describe('dates and ranges', () => {
  test('isRealDate', () => {
    expect(isRealDate('2028-02-29')).toBe(true);
    expect(isRealDate('2027-02-29')).toBe(false);
    expect(isRealDate('2027-13-01')).toBe(false);
    expect(isRealDate('tomorrow')).toBe(false);
  });
  test('validateDate / validateDateRange', () => {
    expect(validateDate('', { label: 'Due', required: true })).toMatch(/required/);
    expect(validateDate('31/12/2027', { label: 'Due' })).toMatch(/valid/);
    expect(validateDateRange('2027-05-02', '2027-05-01')).toMatch(/must not be after/);
    expect(validateDateRange('2027-05-01', '2027-05-01')).toBe('');
  });
});

describe('file validation', () => {
  test('requires a file', () => expect(validateFile(null)).toMatch(/attach/));
  test('extension allow-list', () => {
    expect(validateFile(file('x.exe'))).toMatch(/Invalid file format/);
    expect(validateFile(file('x.zip'))).toBe('');
    expect(validateFile(file('x.PDF'))).toBe('');
  });
  test('script-like double extensions are refused', () => expect(validateFile(file('shell.php.zip'))).toMatch(/Executable/));
  test('size limits', () => {
    expect(validateFile(file('a.zip', 0))).toMatch(/empty/);
    expect(validateFile(file('a.zip', MAX_UPLOAD_BYTES + 1))).toMatch(/25 MB/);
  });
});

describe('form-level validators', () => {
  const goodRequest = {
    title: 'Customer portal', description: 'Portal for customers to track orders.', priority: 'high', requested_deadline: '2027-03-01',
  };
  test('project request', () => {
    expect(validateProjectRequest(goodRequest)).toEqual({});
    expect(
      Object.keys(validateProjectRequest({ ...goodRequest, title: '', description: 'x', requested_deadline: '' }))
    ).toEqual(['title', 'description', 'requested_deadline']);
    expect(validateProjectRequest({ ...goodRequest, priority: 'urgent' }).priority).toBeTruthy();
  });
  test('project', () => {
    expect(validateProject({ title: 'Valid project', client_id: 'c1' })).toEqual({});
    expect(validateProject({ title: 'Valid project' }).client_id).toBeTruthy();
    expect(
      validateProject({ title: 'Valid project', client_id: 'c1', start_date: '2027-02-02', due_date: '2027-02-01' }).range
    ).toBeTruthy();
  });
  test('task', () => {
    expect(validateTask({ title: 'Write docs', priority: 'low', start_date: '2027-01-01', due_date: '2027-01-03' })).toEqual({});
    expect(validateTask({ title: 'Write docs', priority: 'low', start_date: '', due_date: '' })).toHaveProperty('start_date');
  });
  test('review: feedback mandatory only for revision', () => {
    expect(validateReview({ decision: 'approved', feedback: '' })).toEqual({});
    expect(validateReview({ decision: 'revision', feedback: '' }).feedback).toMatch(/required/);
  });
  test('submission: note mandatory for revisions', () => {
    expect(validateSubmission({ file: file('a.zip'), description: '', isRevision: false })).toEqual({});
    expect(validateSubmission({ file: file('a.zip'), description: '', isRevision: true }).description).toBeTruthy();
    expect(validateSubmission({ file: null, description: '', isRevision: false }).file).toBeTruthy();
  });
  test('login / registration / staff account', () => {
    expect(validateLogin({ email: 'a@b.co', password: 'x' })).toEqual({});
    expect(Object.keys(validateLogin({ email: '', password: '' }))).toEqual(['email', 'password']);
    const reg = { display_name: 'Jane Doe', email: 'jane@x.io', password: 'Str0ng!Passphrase', confirm: 'Str0ng!Passphrase' };
    expect(validateRegistration(reg)).toEqual({});
    expect(validateRegistration({ ...reg, confirm: 'different' }).confirm).toMatch(/match/);
    expect(validateStaffAccount({ ...reg, role: 'reviewer', skills: 'QA, Security' })).toEqual({});
    expect(validateStaffAccount({ ...reg, role: 'root', skills: '' }).role).toBeTruthy();
    expect(validateStaffAccount({ ...reg, role: 'reviewer', skills: "'; DROP TABLE x;--" }).skills).toBeTruthy();
  });
});
