import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';
import { getJwtSecret } from '../utils/jwt';

const router = Router();

// Ensure uploads folder exists (Configurable via UPLOADS_DIR for persistent volumes)
export const getUploadDirectory = (): string => {
  const dir = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const uploadDir = getUploadDirectory();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname);
    const uploaderId = req.user?.id || 'anon';
    const uniqueSuffix = `u-${uploaderId}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const ext = path.extname(file.originalname).toLowerCase();
    const isExtAllowed = allowedExts.includes(ext);
    const isMimeAllowed = allowedMimes.includes(file.mimetype.toLowerCase());

    if (isExtAllowed && isMimeAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, and DOC files are permitted.'));
    }
  },
});

import { apiMutationRateLimiter } from '../middleware/rateLimiter';

router.post('/', authenticate, apiMutationRateLimiter, upload.single('file'), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: fileUrl,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'File upload failed.' });
  }
});

import { prisma } from '../prisma';

export async function handleAuthorizedFileDownload(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.split(' ')[1] 
    : (req.query.token as string);

  if (!token) {
    res.status(401).json({ error: 'Authentication required to access permission documents.' });
    return;
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch {
    res.status(403).json({ error: 'Invalid or expired authentication token.' });
    return;
  }

  // Confirm user account is active in database
  const dbUser = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, role: true, status: true, departmentId: true },
  });

  if (!dbUser || dbUser.status !== 'ACTIVE') {
    res.status(403).json({ error: 'User account is inactive or not found.' });
    return;
  }

  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Requested file not found.' });
    return;
  }

  // Admins have campus-wide oversight
  if (dbUser.role === 'ADMIN' || dbUser.role === 'SUPER_ADMIN') {
    res.sendFile(filePath);
    return;
  }

  // Verify ownership via attached booking if already saved
  const attachedBooking = await prisma.booking.findFirst({
    where: { attachmentUrl: { contains: safeFilename } },
  });

  if (attachedBooking) {
    const isOwner = attachedBooking.userId === dbUser.id;
    const isSameDept = Boolean(dbUser.departmentId && attachedBooking.departmentId === dbUser.departmentId);
    if (!isOwner && !isSameDept) {
      res.status(403).json({
        error: 'Access denied: You are not authorized to view permission documents belonging to other faculty or departments.',
      });
      return;
    }
    res.sendFile(filePath);
    return;
  }

  // For unattached files, verify that the requester is the original uploader (encoded in filename prefix)
  if (safeFilename.startsWith(`u-${dbUser.id}-`)) {
    res.sendFile(filePath);
    return;
  }

  res.status(403).json({
    error: 'Access denied: You are not authorized to access this permission document.',
  });
}

// Authenticated document retrieval route
router.get('/file/:filename', handleAuthorizedFileDownload);

export default router;
