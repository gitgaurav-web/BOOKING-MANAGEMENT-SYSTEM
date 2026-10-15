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

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getUploadDirectory());
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

// Security: Verify file signature (magic bytes) to prevent extension spoofing
function verifyFileSignature(filePath: string, ext: string): boolean {
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    const cleanExt = ext.toLowerCase();

    // PDF: %PDF- (0x25 0x50 0x44 0x46)
    if (cleanExt === '.pdf') {
      return buffer.slice(0, 4).toString('ascii') === '%PDF';
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (cleanExt === '.png') {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    }

    // JPEG / JPG: FF D8 FF
    if (cleanExt === '.jpg' || cleanExt === '.jpeg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    // DOCX (ZIP container: 50 4B 03 04)
    if (cleanExt === '.docx') {
      return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    }

    // Legacy DOC (Compound File Binary Format: D0 CF 11 E0)
    if (cleanExt === '.doc') {
      return buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;
    }

    return false;
  } catch (err) {
    console.error('Error verifying file signature:', err);
    return false;
  }
}

import { apiMutationRateLimiter } from '../middleware/rateLimiter';

router.post('/', authenticate, apiMutationRateLimiter, upload.single('file'), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const isValidSignature = verifyFileSignature(req.file.path, ext);

    if (!isValidSignature) {
      // Security: Clean up spoofed / suspicious file immediately
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupErr) {
        console.error('Failed to cleanup rejected file:', cleanupErr);
      }
      res.status(400).json({
        error: 'Invalid file content: The file content does not match its declared document type or signature.',
      });
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
  const filePath = path.join(getUploadDirectory(), safeFilename);

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
