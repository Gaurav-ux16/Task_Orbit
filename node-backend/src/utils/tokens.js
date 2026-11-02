import crypto from 'node:crypto';

/** 256-bit URL-safe random token. */
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');

/** Only the SHA-256 of a session id is persisted, so a DB leak cannot be replayed. */
export const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

/** Constant-time string comparison. */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
