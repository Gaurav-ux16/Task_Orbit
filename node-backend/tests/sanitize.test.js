import { detectThreat, scanPayload, safeFileName, normalizeText } from '../src/utils/sanitize.js';
import { passwordProblems, hashPassword, verifyPassword } from '../src/utils/password.js';
import { sha256, safeEqual, randomToken } from '../src/utils/tokens.js';
import { inspectUpload } from '../src/utils/fileGuard.js';
import { isRealDate } from '../src/validation/rules.js';
import { ZIP_BYTES, PDF_BYTES } from './helpers.js';

const SQLI = [
  "' OR '1'='1",
  "' OR 1=1 --",
  "admin'--",
  "1; DROP TABLE users",
  "'; DROP TABLE profiles; --",
  "x' UNION SELECT password_hash FROM profiles --",
  "1 UNION ALL SELECT NULL,NULL",
  "'; DELETE FROM tasks WHERE 1=1; --",
  "'; INSERT INTO profiles (id) VALUES ('x'); --",
  "1' AND SLEEP(5)#",
  "1; SELECT pg_sleep(10)",
  "' OR true --",
  "SELECT * FROM information_schema.tables",
  "%27%20OR%201%3D1%20--",
  "TRUNCATE TABLE sessions",
  "' or 'a'='a",
  "1 or 2=2",
  "Robert'); DROP TABLE Students;--",
];

const XSS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  '"><script src=//evil.example/x.js></script>',
  'javascript:alert(document.cookie)',
  '<iframe src="https://evil.example"></iframe>',
  '<a href="javascript:alert(1)">click</a>',
  'x" onmouseover="alert(1)',
  '<body onload=alert(1)>',
  'data:text/html;base64,PHNjcmlwdD4=',
  '%3Cscript%3Ealert(1)%3C/script%3E',
  "<style>@import 'https://evil.example/x.css';</style>",
  '<div style="background:url(javascript:alert(1))">',
];

const OTHER = [
  ['command-injection', 'report.pdf; rm -rf /'],
  ['command-injection', 'a | cat /etc/passwd'],
  ['command-injection', '$(whoami)'],
  ['code-injection', '{{7*7}}'],
  ['code-injection', '${process.env.SECRET}'],
  ['code-injection', '<?php system($_GET[1]); ?>'],
  ['path-traversal', '../../../etc/passwd'],
  ['path-traversal', '..\\..\\windows\\win.ini'],
  ['path-traversal', '%2e%2e%2f%2e%2e%2fsecret'],
  ['null-byte', 'file.pdf\u0000.exe'],
  ['nosql-injection', '{"$ne": null}'],
  ['malware-signature', 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'],
];

const BENIGN = [
  'Implement the product listing page',
  'Design new checkout flow — wireframes & prototype',
  "Carol's task: update the table design and select the best option from the list",
  'Fix bug #123 (login) in v2.1; deploy by Friday',
  'Budget: $5,000 – $7,500; 5 < 10 and 10 > 5',
  'Sleep schedule review for on-call rotation',
  'Café Müller — résumé & 日本語 テスト',
  'Review the "Order & tracking" page: filters, sorting, pagination.',
  'Use OAuth 2.0 / OIDC with PKCE, then refresh tokens (30 days).',
  'Delete from the backlog everything older than a quarter',
  'We need to select users from the directory where role is assignee',
];

describe('detectThreat — SQL injection', () => {
  test.each(SQLI)('rejects %s', (payload) => {
    expect(detectThreat(payload)).toBe('sql-injection');
  });
});

describe('detectThreat — XSS / HTML injection', () => {
  test.each(XSS)('rejects %s', (payload) => {
    expect(detectThreat(payload)).not.toBeNull();
  });
});

describe('detectThreat — other attack classes', () => {
  test.each(OTHER)('classifies %s as %s', (label, payload) => {
    expect(detectThreat(payload)).toBe(label);
  });
});

describe('detectThreat — benign business text is not blocked', () => {
  test.each(BENIGN)('accepts %s', (text) => {
    expect(detectThreat(text)).toBeNull();
  });
});

describe('scanPayload', () => {
  test('trims, normalises and strips control / zero-width characters in place', () => {
    const body = { title: '  Hello\u200B World\u0007  ' };
    expect(scanPayload(body)).toEqual([]);
    expect(body.title).toBe('Hello World');
  });

  test('reports the exact field path of a hostile nested value', () => {
    const v = scanPayload({ a: { b: ['ok', "'; DROP TABLE x;--"] } });
    expect(v).toEqual([{ field: 'a.b[1]', reason: 'sql-injection' }]);
  });

  test('rejects prototype-pollution and operator keys', () => {
    const polluted = JSON.parse('{"__proto__": {"admin": true}}');
    expect(scanPayload(polluted).map((v) => v.reason)).toContain('forbidden-key');
    expect(scanPayload({ $where: '1' }).map((v) => v.reason)).toContain('operator-key');
    expect(scanPayload({ 'a.b': 1 }).map((v) => v.reason)).toContain('operator-key');
  });

  test('rejects oversize strings, deep nesting and huge arrays', () => {
    expect(scanPayload({ t: 'x'.repeat(5001) })[0].reason).toBe('too-long');
    const deep = { a: { b: { c: { d: { e: { f: { g: 1 } } } } } } };
    expect(scanPayload(deep)[0].reason).toBe('nesting-too-deep');
    expect(scanPayload({ a: new Array(51).fill('x') })[0].reason).toBe('array-too-large');
  });

  test('passwords are never altered or pattern-scanned (length checked elsewhere)', () => {
    const body = { password: "P@ss'w0rd<>--;", new_password: " keep spaces " };
    expect(scanPayload(body)).toEqual([]);
    expect(body.new_password).toBe(' keep spaces ');
  });
});

describe('misc helpers', () => {
  test('safeFileName strips paths and unsafe characters', () => {
    expect(safeFileName('../../etc/passwd')).toBe('passwd');
    expect(safeFileName('C:\\Users\\x\\evil<script>.zip')).toBe('evil_script_.zip');
    expect(safeFileName('..hidden..zip')).toBe('hidden.zip');
    expect(safeFileName('')).toBe('file');
  });

  test('normalizeText applies NFC', () => {
    expect(normalizeText('e\u0301')).toBe('é');
  });

  test('isRealDate accepts real calendar dates only', () => {
    expect(isRealDate('2026-02-28')).toBe(true);
    expect(isRealDate('2028-02-29')).toBe(true);
    expect(isRealDate('2026-02-30')).toBe(false);
    expect(isRealDate('2026-13-01')).toBe(false);
    expect(isRealDate('26-1-1')).toBe(false);
    expect(isRealDate('2026-10-10T00:00:00Z')).toBe(false);
    expect(isRealDate(20261010)).toBe(false);
  });

  test('token helpers: random, hashed, constant-time compare', () => {
    expect(randomToken()).not.toBe(randomToken());
    expect(randomToken(32)).toHaveLength(43);
    expect(sha256('abc')).toMatch(/^[0-9a-f]{64}$/);
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(safeEqual(undefined, 'abc')).toBe(false);
  });
});

describe('password policy and hashing', () => {
  test.each([
    ['short1!A', 'at least 10'],
    ['alllowercase1!', 'uppercase'],
    ['ALLUPPERCASE1!', 'lowercase'],
    ['NoDigitsHere!!', 'digit'],
    ['NoSymbols12345', 'symbol'],
    ['Password123!', null],
  ])('%s', (pw, expectedFragment) => {
    const problems = passwordProblems(pw).join(' | ');
    if (expectedFragment) expect(problems).toContain(expectedFragment);
    else expect(problems).toBe('');
  });

  test('rejects passwords containing the e-mail name or first name', () => {
    expect(passwordProblems('Alice-Secret1!', { email: 'alice@x.io' }).join()).toMatch(/e-mail name/);
    expect(passwordProblems('Brandon#2026x', { name: 'Brandon Lee' }).join()).toMatch(/your name/);
  });

  test('bcrypt hashes are salted, verifiable and never equal the plaintext', async () => {
    const h1 = await hashPassword('Str0ng!Passphrase');
    const h2 = await hashPassword('Str0ng!Passphrase');
    expect(h1).not.toBe(h2);
    expect(h1).toMatch(/^\$2[aby]\$/);
    expect(await verifyPassword('Str0ng!Passphrase', h1)).toBe(true);
    expect(await verifyPassword('wrong', h1)).toBe(false);
    expect(await verifyPassword(undefined, h1)).toBe(false);
  });
});

describe('inspectUpload — content verification', () => {
  const file = (name, buffer) => ({ originalname: name, buffer });

  test('accepts genuine files whose content matches the extension', () => {
    expect(inspectUpload(file('a.zip', ZIP_BYTES)).ok).toBe(true);
    expect(inspectUpload(file('a.pdf', PDF_BYTES)).ok).toBe(true);
    expect(inspectUpload(file('notes.txt', Buffer.from('plain notes'))).ok).toBe(true);
    expect(inspectUpload(file('p.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).ok).toBe(true);
  });

  test('rejects extension / content mismatch (spoofed type)', () => {
    expect(inspectUpload(file('fake.pdf', ZIP_BYTES)).ok).toBe(false);
    expect(inspectUpload(file('fake.zip', Buffer.from('not a zip'))).ok).toBe(false);
  });

  test('rejects executables regardless of name', () => {
    expect(inspectUpload(file('setup.zip', Buffer.from('MZ\x90\x00'))).ok).toBe(false);
    expect(inspectUpload(file('run.txt', Buffer.from('#!/bin/sh\nrm -rf /'))).ok).toBe(false);
    expect(inspectUpload(file('tool.exe', Buffer.from('MZ'))).ok).toBe(false);
  });

  test('rejects double-extension scripts, empty files, hostile text and EICAR', () => {
    expect(inspectUpload(file('shell.php.zip', ZIP_BYTES)).ok).toBe(false);
    expect(inspectUpload(file('a.zip', Buffer.alloc(0))).ok).toBe(false);
    expect(inspectUpload(file('x.txt', Buffer.from('<script>alert(1)</script>'))).ok).toBe(false);
    expect(inspectUpload(file('eicar.txt', Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'))).ok).toBe(false);
  });

  test('sanitises the stored file name', () => {
    const r = inspectUpload(file('../../evil name.zip', ZIP_BYTES));
    expect(r.ok).toBe(true);
    expect(r.safeName).toBe('evil name.zip');
  });
});
