import { isProduction } from '../config/env.js';

/**
 * Centralised error handler. Clients get a stable JSON envelope; stack traces and
 * internal messages for 5xx errors are never sent in production.
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let status = err.status || err.statusCode || 500;

  // body-parser errors
  if (err.type === 'entity.parse.failed') status = 400;
  if (err.type === 'entity.too.large') status = 413;

  if (status >= 500) {
    console.error(`[ERROR] ${req.id || '-'} ${req.method} ${req.path}:`, err.message || err);
  }

  let message;
  if (err.type === 'entity.parse.failed') message = 'Malformed JSON body';
  else if (err.type === 'entity.too.large') message = 'Request body too large';
  else if (status >= 500 && isProduction()) message = 'Internal server error';
  else message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: message,
    ...(err.details && { details: err.details }),
    ...(req.id && { requestId: req.id }),
    ...(process.env.NODE_ENV === 'development' && status >= 500 && { stack: err.stack }),
  });
}

/** 404 handler for unmatched routes. */
export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, error: 'Route not found' });
}
