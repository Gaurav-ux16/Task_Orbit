/**
 * Client-side mirror of node-backend/src/utils/sanitize.js.
 * Runs BEFORE a form is submitted so users get instant feedback; the server repeats
 * the same screening (never trust the client) and is the authoritative check.
 * Keep the rule table in sync with the backend file.
 */

const THREAT_RULES = [
  // ── SQL injection ──────────────────────────────────────────────────────────
  ['sql-injection', /\bunion\b[\s\S]{0,20}\bselect\b/i],
  ['sql-injection', /['"`)]\s*(or|and)\s+['"`(]?[\w.]+['"`)]?\s*(=|<|>|like\b)/i],
  ['sql-injection', /\b(or|and)\s+\d+\s*(=|<>|!=)\s*\d+/i],
  ['sql-injection', /['"`]\s*(or|and)\s+(true|false|null)\b/i],
  ['sql-injection', /;\s*(drop|delete|insert|update|alter|truncate|create|exec|execute|shutdown|grant|revoke)\b/i],
  ['sql-injection', /\bdrop\s+(table|database|schema|view|index|user|role)\b/i],
  ['sql-injection', /\btruncate\s+table\b/i],
  ['sql-injection', /\bdelete\s+from\s+[\w."]+\s*(where\b|;|--|$)/i],
  ['sql-injection', /\binsert\s+into\s+[\w."]+\s*(\(|values\b|select\b|;|--)/i],
  ['sql-injection', /\bupdate\s+[\w."]+\s+set\s+[\w."]+\s*=/i],
  ['sql-injection', /['"`]\s*(--|#|\/\*|;)/],
  ['sql-injection', /\b(pg_sleep|sleep|benchmark|load_file|dbms_pipe)\s*\(|\bwaitfor\s+delay\b|\bxp_cmdshell\b/i],
  ['sql-injection', /\b(information_schema|pg_catalog|pg_shadow|sysobjects|sqlite_master|mysql\.user)\b/i],
  ['sql-injection', /\bselect\b[\s\S]{1,60}?\bfrom\b\s+[\w."]+\s+(where\s+[\w."]+\s*(=|<>|!=|<|>|like\b)|union\b|order\s+by\b|group\s+by\b|limit\s+\d)/i],
  ['sql-injection', /\b(char|chr|concat|ascii|substring|cast|convert)\s*\([^)]*\)\s*(=|--)/i],
  ['sql-injection', /\/\*[\s\S]*?\*\//],

  // ── Cross-site scripting / HTML & script injection ─────────────────────────
  ['xss', /<\/?[a-z!][a-z0-9-]*(\s|\/|>|$)/i],
  ['xss', /\bon(error|load|click|dblclick|mouse\w+|focus\w*|blur|change|submit|key\w+|toggle|pointer\w+|animation\w+|begin|start|input|drag\w*|drop|wheel|scroll|resize|select|reset|abort|unload)\s*=/i],
  ['xss', /\b(javascript|vbscript|livescript)\s*:/i],
  ['xss', /\bdata\s*:\s*(text\/html|application\/(x-)?javascript|image\/svg)/i],
  ['xss', /(&#x?[0-9a-f]+;?\s*){3,}/i],
  ['xss', /\b(eval|atob)\s*\(|document\.(cookie|write|location)|window\.(location|open)|\.innerHTML\b|\.fromCharCode\b/i],
  ['xss', /expression\s*\(|@import\b|-moz-binding/i],

  // ── Command / code injection ───────────────────────────────────────────────
  ['command-injection', /(\||&&|;)\s*(rm\s+-|cat\s+\/|curl\s|wget\s|nc\s|ncat\s|bash\s+-|sh\s+-|powershell|cmd(\.exe)?\b|whoami|chmod\s|chown\s|uname\b)/i],
  ['command-injection', /\$\([^)]*\)|`[^`]*(?:rm|cat|curl|wget|bash|sh|powershell)[^`]*`/i],
  ['command-injection', /\b(cmd(\.exe)?\s*\/c|powershell(\.exe)?\s+-)/i],
  ['code-injection', /\{\{[\s\S]*\}\}|\{%[\s\S]*%\}|\$\{[^}]*\}|<%[\s\S]*%>/],
  ['code-injection', /<\?(php|=)?/i],
  ['code-injection', /\b(require|import)\s*\(\s*['"]|process\.(env|exit|mainModule)|child_process|__proto__|constructor\s*\.\s*constructor/i],

  // ── Path traversal / null bytes ────────────────────────────────────────────
  ['path-traversal', /(\.\.[\\/])|([\\/]\.\.)|%2e%2e|%252e|\.\.%2f|\.\.%5c/i],
  ['path-traversal', /\/etc\/(passwd|shadow)|[a-z]:\\windows\\|boot\.ini/i],
  ['null-byte', /\u0000|%00/],

  // ── NoSQL operator injection ───────────────────────────────────────────────
  ['nosql-injection', /\{\s*["']?\$(ne|gt|gte|lt|lte|in|nin|or|and|not|nor|regex|where|exists|expr)\b/i],

  // ── Malware signature (EICAR test string) ──────────────────────────────────
  ['malware-signature', /X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7\}\$EICAR/],
];

/**
 * Returns the threat category for a hostile string, or null if it looks clean.
 */
export function detectThreat(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  let candidate = value;
  // Also inspect the URL-decoded form so %27%20OR%201=1 style payloads are caught.
  try {
    const decoded = decodeURIComponent(value.replace(/\+/g, ' '));
    if (decoded !== value) candidate = `${value}\n${decoded}`;
  } catch {
    /* malformed percent-encoding: scan the raw string only */
  }
  for (const [label, re] of THREAT_RULES) {
    if (re.test(candidate)) return label;
  }
  return null;
}

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/** Trim, NFC-normalise and strip control / bidi-override characters. */
export function normalizeText(value) {
  return value.normalize('NFC').replace(CONTROL_CHARS, '').trim();
}

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Fields that legitimately contain arbitrary characters; never pattern-scanned. */
const SECRET_FIELDS = new Set(['password', 'current_password', 'new_password', 'confirm_password']);

export const LIMITS = { maxString: 5000, maxDepth: 6, maxKeys: 60, maxArray: 50 };

/**
 * Recursively screens (and normalises, in place) a request container.
 * Returns an array of `{ field, reason }` violations.
 */
export function scanPayload(root, basePath = '') {
  const violations = [];

  const walk = (node, path, depth) => {
    if (depth > LIMITS.maxDepth) {
      violations.push({ field: path, reason: 'nesting-too-deep' });
      return;
    }
    if (Array.isArray(node)) {
      if (node.length > LIMITS.maxArray) {
        violations.push({ field: path, reason: 'array-too-large' });
        return;
      }
      node.forEach((item, i) => {
        if (typeof item === 'string') handleString(node, i, `${path}[${i}]`, false);
        else walk(item, `${path}[${i}]`, depth + 1);
      });
      return;
    }
    if (node && typeof node === 'object') {
      const keys = Object.keys(node);
      if (keys.length > LIMITS.maxKeys) {
        violations.push({ field: path, reason: 'too-many-fields' });
        return;
      }
      for (const key of keys) {
        const childPath = path ? `${path}.${key}` : key;
        if (FORBIDDEN_KEYS.has(key)) {
          violations.push({ field: childPath, reason: 'forbidden-key' });
          continue;
        }
        if (key.startsWith('$') || key.includes('.') || key.includes('\u0000')) {
          violations.push({ field: childPath, reason: 'operator-key' });
          continue;
        }
        const threatInKey = detectThreat(key);
        if (threatInKey) {
          violations.push({ field: childPath, reason: threatInKey });
          continue;
        }
        const child = node[key];
        if (typeof child === 'string') handleString(node, key, childPath, SECRET_FIELDS.has(key));
        else walk(child, childPath, depth + 1);
      }
    }
  };

  const handleString = (container, key, path, isSecret) => {
    const raw = container[key];
    if (raw.length > LIMITS.maxString) {
      violations.push({ field: path, reason: 'too-long' });
      return;
    }
    if (isSecret) return; // passwords are length-checked elsewhere, never altered
    const clean = normalizeText(raw);
    const threat = detectThreat(clean) || detectThreat(raw);
    if (threat) {
      violations.push({ field: path, reason: threat });
      return;
    }
    container[key] = clean;
  };

  walk(root, basePath, 0);
  return violations;
}

/** Sanitises a file name for storage/display: basename only, safe characters. */
export function safeFileName(name) {
  const base = String(name || 'file').split(/[\\/]/).pop();
  const cleaned = normalizeText(base)
    .replace(/[^A-Za-z0-9._\- ()]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+/, '')
    .slice(0, 120);
  return cleaned || 'file';
}
