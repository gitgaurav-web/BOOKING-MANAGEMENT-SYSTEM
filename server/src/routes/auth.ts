import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/helpers';
import { getJwtSecret } from '../utils/jwt';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Register
router.post('/register', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, departmentId } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'Please provide a valid institutional email address.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      res.status(400).json({ error: 'Password must contain at least one letter and one number.' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      res.status(400).json({ error: 'A user with this email address is already registered.' });
      return;
    }

    // Domain verification if institutional email domain restriction is configured
    const domainSetting = await prisma.systemSetting.findUnique({ where: { key: 'allowedEmailDomain' } });
    if (domainSetting?.value) {
      const allowedDomain = domainSetting.value.trim().toLowerCase().replace(/^@/, '');
      if (allowedDomain && !cleanEmail.endsWith(`@${allowedDomain}`)) {
        res.status(400).json({
          error: `Registration is restricted to institutional accounts ending with @${allowedDomain}.`,
        });
        return;
      }
    }

    let finalDeptId: string | null = null;
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept || dept.status !== 'ACTIVE') {
        res.status(400).json({ error: 'Selected department does not exist or is inactive.' });
        return;
      }
      finalDeptId = dept.id;
    }

    const approvalSetting = await prisma.systemSetting.findUnique({ where: { key: 'requireUserApproval' } });
    // Default to true (safe-by-default for institutional access) unless explicitly configured otherwise
    const requireApproval = approvalSetting ? approvalSetting.value === 'true' : true;
    
    // Security Guard: Anyone registering with a department requesting FACULTY role,
    // or when requireUserApproval is enabled, must be reviewed and activated by an administrator.
    const isFacultyRequest = Boolean(finalDeptId);
    const initialStatus = (requireApproval || isFacultyRequest) ? 'INACTIVE' : 'ACTIVE';
    const assignedRole = finalDeptId ? 'FACULTY' : 'USER';

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        phone: phone ? phone.trim() : null,
        departmentId: finalDeptId,
        role: assignedRole,
        status: initialStatus,
      },
      include: { department: true },
    });

    await logActivity(user.id, 'REGISTER', 'USER', user.id, `User ${user.name} registered (${assignedRole}, ${initialStatus}).`);

    if (initialStatus === 'INACTIVE') {
      res.status(201).json({
        message: 'Account registered successfully! An administrator must activate your account before you can log in.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department?.name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

// Login
router.post('/login', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { department: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Your account is disabled. Please contact administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    await logActivity(user.id, 'LOGIN', 'USER', user.id, `User ${user.name} logged in.`);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department?.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

// Get Current User Profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { department: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      departmentId: user.departmentId,
      status: user.status,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

export default router;
