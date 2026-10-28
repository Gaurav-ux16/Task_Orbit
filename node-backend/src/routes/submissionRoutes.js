import { Router } from 'express';
import multer from 'multer';
import {
  listSubmissions,
  createTaskSubmission,
  downloadSubmission,
} from '../controllers/submissionController.js';

const router = Router({ mergeParams: true });

// Memory storage for forwarding deliverable buffer to Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/zip',
      'application/x-zip-compressed',
      'multipart/x-zip',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/octet-stream',
    ];
    const allowedExts = ['.zip', '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.txt', '.tar', '.gz'];
    const hasAllowedExt = allowedExts.some((ext) => file.originalname.toLowerCase().endsWith(ext));

    if (allowedMimes.includes(file.mimetype) || hasAllowedExt) {
      cb(null, true);
    } else {
      cb(new Error('File type not permitted. Allowed formats: ZIP, PDF, images, Word documents, text files.'));
    }
  },
});

// Middleware wrapping multer to guarantee clean HTTP 400 JSON errors on upload violations
const uploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds maximum permitted limit (50 MB).',
        });
      }
      return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
};

// GET /api/tasks/:taskId/submissions
router.get('/', listSubmissions);

// POST /api/tasks/:taskId/submissions
router.post('/', uploadMiddleware, createTaskSubmission);

export default router;

// Standalone submission download route
export function submissionDownloadRouter() {
  const r = Router();
  r.get('/:id/download', downloadSubmission);
  return r;
}
