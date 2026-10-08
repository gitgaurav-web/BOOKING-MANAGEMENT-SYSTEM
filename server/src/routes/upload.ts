import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';
import { getJwtSecret } from '../utils/jwt';

const router = Router();

// Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
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

router.post('/', authenticate, upload.single('file'), (req: Request, res: Response): void => {
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

  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Requested file not found.' });
    return;
  }

  // Admins have campus-wide oversight
  if (decoded.role === 'ADMIN' || decoded.role === 'SUPER_ADMIN') {
    res.sendFile(filePath);
    return;
  }

  // Regular faculty/users: verify ownership via attached booking
  const attachedBooking = await prisma.booking.findFirst({
    where: { attachmentUrl: { contains: safeFilename } },
  });

  if (attachedBooking) {
    const isOwner = attachedBooking.userId === decoded.id;
    const isSameDept = Boolean(decoded.departmentId && attachedBooking.departmentId === decoded.departmentId);
    if (!isOwner && !isSameDept) {
      res.status(403).json({
        error: 'Access denied: You are not authorized to view permission documents belonging to other faculty or departments.',
      });
      return;
    }
  }

  res.sendFile(filePath);
}

// Authenticated document retrieval route
router.get('/file/:filename', handleAuthorizedFileDownload);

export default router;
