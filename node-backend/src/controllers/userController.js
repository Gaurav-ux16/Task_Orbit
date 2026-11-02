import { createUser } from '../services/authService.js';
import { audit } from '../utils/audit.js';

/** POST /api/users — manager provisions a staff (or client) account. */
export async function createStaffUser(req, res, next) {
  try {
    const { email, password, display_name, role, skills = [] } = req.body;
    const user = await createUser({ email, password, display_name, role, skills });
    await audit('user_created_by_manager', { actorId: req.user.id, details: { user_id: user.id, role } });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}
