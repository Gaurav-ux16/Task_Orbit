import rateLimit from 'express-rate-limit';
import { isTest } from '../config/env.js';

const json = (message) => (req, res) =>
  res.status(429).json({ success: false, error: message });

const make = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: json(message),
  });

/** Broad per-IP limiter for the whole API. */
export const apiLimiter = (opts = {}) =>
  make({
    windowMs: opts.windowMs ?? 15 * 60_000,
    max: opts.max ?? (isTest() ? 100_000 : Number(process.env.RATE_LIMIT_MAX || 600)),
    message: 'Too many requests. Please slow down and try again later.',
  });

/** Tight limiter for credential endpoints (brute-force / credential-stuffing defence). */
export const authLimiter = (opts = {}) =>
  make({
    windowMs: opts.windowMs ?? 15 * 60_000,
    max: opts.max ?? (isTest() ? 100_000 : Number(process.env.AUTH_RATE_LIMIT_MAX || 20)),
    message: 'Too many authentication attempts. Please try again later.',
  });

/** Limiter for uploads. */
export const uploadLimiter = (opts = {}) =>
  make({
    windowMs: opts.windowMs ?? 15 * 60_000,
    max: opts.max ?? (isTest() ? 100_000 : 60),
    message: 'Too many uploads. Please try again later.',
  });
