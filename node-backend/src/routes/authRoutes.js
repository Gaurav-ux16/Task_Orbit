import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { emailField, personName, passwordField, boolField } from '../validation/rules.js';
import { register, login, logout, logoutAll, me, changePassword } from '../controllers/authController.js';

const router = Router();

router.post('/register', authLimiter(), [emailField(), personName(), passwordField(), validateRequest], register);

router.post('/login', authLimiter(), [emailField(), passwordField(), boolField('remember'), validateRequest], login);

router.post('/logout', logout);
router.post('/logout-all', requireAuth, logoutAll);
router.get('/me', me);

router.post(
  '/change-password',
  requireAuth,
  authLimiter(),
  [
    passwordField('current_password'),
    body('new_password').isString().withMessage('New password must be text').bail().isLength({ min: 1, max: 128 }),
    validateRequest,
  ],
  changePassword
);

export default router;
