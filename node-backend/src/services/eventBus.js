import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isTest } from '../config/env.js';

/**
 * Domain event bus (Node core `events` module). Services emit facts
 * ("task.status_changed"); listeners react without the service knowing about them.
 */
export const bus = new EventEmitter();

const here = path.dirname(fileURLToPath(import.meta.url));
export const LOG_DIR = path.resolve(here, '../../logs');

/** Appends one JSON line per event to logs/events.log (Node `fs` module). */
export function attachFileLogger(dir = LOG_DIR) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'events.log');
  const handler = (name) => (payload) => {
    fs.appendFile(file, `${JSON.stringify({ at: new Date().toISOString(), event: name, ...payload })}\n`, () => {});
  };
  const listeners = ['task.status_changed', 'submission.created'].map((n) => [n, handler(n)]);
  listeners.forEach(([n, fn]) => bus.on(n, fn));
  return () => listeners.forEach(([n, fn]) => bus.off(n, fn)); // detach (used by tests)
}

if (!isTest()) attachFileLogger();
