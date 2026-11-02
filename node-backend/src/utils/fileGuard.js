import path from 'node:path';
import { detectThreat, safeFileName } from './sanitize.js';

/**
 * Upload verification. The client-declared MIME type is never trusted: the file
 * extension must be allow-listed AND the leading bytes (magic number) must match it.
 */
const SIGNATURES = {
  '.zip': [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06]],
  '.docx': [[0x50, 0x4b, 0x03, 0x04]],
  '.pdf': [[0x25, 0x50, 0x44, 0x46]],
  '.png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  '.jpg': [[0xff, 0xd8, 0xff]],
  '.jpeg': [[0xff, 0xd8, 0xff]],
  '.gif': [[0x47, 0x49, 0x46, 0x38]],
  '.doc': [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  '.gz': [[0x1f, 0x8b]],
  '.tar': null, // tar has its signature at offset 257 – checked separately
  '.txt': null, // plain text – checked for binary content
};

export const ALLOWED_EXTENSIONS = Object.keys(SIGNATURES);

const MIME_BY_EXT = {
  '.zip': 'application/zip',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.doc': 'application/msword',
  '.gz': 'application/gzip',
  '.tar': 'application/x-tar',
  '.txt': 'text/plain',
};

const matches = (buf, sig) => sig.every((b, i) => buf[i] === b);

/** Executable / script signatures that are refused whatever the extension says. */
function looksExecutable(buf) {
  const head = buf.subarray(0, 4);
  if (head[0] === 0x4d && head[1] === 0x5a) return 'Windows executable (MZ)';
  if (head[0] === 0x7f && head[1] === 0x45 && head[2] === 0x4c && head[3] === 0x46) return 'ELF executable';
  if (head[0] === 0x23 && head[1] === 0x21) return 'shebang script';
  if (head[0] === 0xca && head[1] === 0xfe && head[2] === 0xba && head[3] === 0xbe) return 'Java class / Mach-O binary';
  return null;
}

/**
 * Returns `{ ok: true, safeName, ext, mime }` or `{ ok: false, error }`.
 */
export function inspectUpload(file) {
  if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    return { ok: false, error: 'The uploaded file is empty.' };
  }

  const safeName = safeFileName(file.originalname);
  const ext = path.extname(safeName).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { ok: false, error: `File type '${ext || 'unknown'}' is not permitted. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}.` };
  }

  // Double extension tricks such as report.php.zip / invoice.exe.pdf
  if (/\.(php\d?|phtml|exe|dll|bat|cmd|com|scr|sh|js|mjs|jsp|asp|aspx|py|rb|pl|ps1|vbs|jar|msi|html?|svg)\.[a-z0-9]+$/i.test(safeName)) {
    return { ok: false, error: 'Executable or script-like file names are not permitted.' };
  }

  const exec = looksExecutable(file.buffer);
  if (exec) return { ok: false, error: `Executable content is not permitted (${exec}).` };

  const sigs = SIGNATURES[ext];
  if (sigs && !sigs.some((s) => matches(file.buffer, s))) {
    return { ok: false, error: `File content does not match its '${ext}' extension.` };
  }
  if (ext === '.tar' && file.buffer.length > 262) {
    if (file.buffer.subarray(257, 262).toString('latin1') !== 'ustar') {
      return { ok: false, error: "File content does not match its '.tar' extension." };
    }
  }

  if (ext === '.txt') {
    const sample = file.buffer.subarray(0, 8192);
    if (sample.includes(0)) return { ok: false, error: 'Binary content is not permitted in .txt files.' };
    const threat = detectThreat(file.buffer.toString('utf8', 0, 200_000));
    if (threat) return { ok: false, error: `Text file rejected: ${threat} content detected.` };
  }

  // Images and PDFs must not smuggle HTML/script payloads in their first bytes.
  if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) {
    const probe = file.buffer.toString('latin1', 0, 2048).toLowerCase();
    if (probe.includes('<script') || probe.includes('<?php')) {
      return { ok: false, error: 'Embedded script content detected in image.' };
    }
  }

  if (file.buffer.includes(Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR'))) {
    return { ok: false, error: 'Malware test signature detected.' };
  }

  return { ok: true, safeName, ext, mime: MIME_BY_EXT[ext] };
}
