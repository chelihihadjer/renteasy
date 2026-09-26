import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { UPLOAD_DIR } from '../config/paths.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXTENSIONS[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    if (EXTENSIONS[file.mimetype]) cb(null, true);
    else cb(new HttpError(400, 'Formats acceptés : JPEG, PNG, WebP'));
  },
});

const router = Router();

router.post('/', requireAuth, requireRole('owner'), (req, res, next) => {
  upload.array('images', 6)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Image trop lourde (5 Mo maximum)'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
          ? '6 images maximum par envoi'
          : "Échec de l'envoi des images";
      return next(new HttpError(400, message));
    }
    if (err) return next(err);
    if (!req.files?.length) return next(new HttpError(400, 'Aucune image reçue'));
    res.status(201).json({ urls: req.files.map((f) => `/uploads/${path.basename(f.path)}`) });
  });
});

export default router;
