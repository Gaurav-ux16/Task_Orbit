import { Router } from 'express';
import multer from 'multer';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireRole } from '../middleware/auth.js';
import { inputGuard } from '../middleware/inputGuard.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import { uuidParam, optionalText } from '../validation/rules.js';
import { ALLOWED_EXTENSIONS } from '../utils/fileGuard.js';
import { listSubmissions, createTaskSubmission, downloadSubmission } from '../controllers/submissionController.js';

const router = Router({ mergeParams: true });

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

// Memory storage: the buffer is inspected (magic bytes) before being forwarded to storage.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 5, fieldSize: 10_000, parts: 8 },
  fileFilter: (req, file, cb) => {
    const lower = String(file.originalname || '').toLowerCase();
    if (ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))) return cb(null, true);
    return cb(new Error(`File type not permitted. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}.`));
  },
});

// Wraps multer so every upload violation is a clean JSON 400.
const uploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: `File size exceeds maximum permitted limit (${MAX_UPLOAD_BYTES / 1024 / 1024} MB).` });
      }
      return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    }
    if (err) return res.status(400).json({ success: false, error: err.message });
    next();
  });
};

router.get('/', [uuidParam('taskId'), validateRequest], listSubmissions);

router.post(
  '/',
  requireRole('assignee'),
  uploadLimiter(),
  uploadMiddleware,
  inputGuard, // multipart text fields only exist after multer ran
  [uuidParam('taskId'), optionalText('description', { max: 1000 }), validateRequest],
  createTaskSubmission
);

export default router;

// Standalone submission download route: GET /api/submissions/:id/download
export function submissionDownloadRouter() {
  const r = Router();
  r.get('/:id/download', [uuidParam('id'), validateRequest], downloadSubmission);
  return r;
}
