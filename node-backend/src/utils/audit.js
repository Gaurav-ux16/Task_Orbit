import supabase from '../config/supabase.js';
import { sha256 } from './tokens.js';

/**
 * Security / account audit trail (stored in activity_logs with no project).
 * Failures to write an audit record never break the request.
 */
export async function audit(action, { actorId = null, details = {} } = {}) {
  try {
    await supabase.from('activity_logs').insert({
      project_id: null,
      task_id: null,
      actor_id: actorId,
      action,
      details,
    });
  } catch (err) {
    console.error('[AUDIT] failed to persist audit record:', err.message);
  }
}

/** Short, non-reversible fingerprint so failed-login audit rows do not store raw e-mails. */
export const fingerprint = (value) => sha256(String(value).toLowerCase()).slice(0, 12);
