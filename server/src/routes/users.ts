import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { logActivity } from '../utils/helpers';
import { apiMutationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Departments: List all
router.get('/departments', async (_req: Request, res: Response): Promise<void> => {
  try {
    const list = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true, bookings: true },
        },
      },
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments.' });
  }
});

// Departments: Create new
router.post('/departments', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      res.status(400).json({ error: 'Department name and code are required.' });
      return;
    }

    const dept = await prisma.department.create({
      data: { name, code, description },
    });

    await logActivity(req.user!.id, 'CREATE_DEPARTMENT', 'DEPARTMENT', dept.id, `Created department ${name}`);
    res.status(201).json(dept);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create department.' });
  }
});

// Departments: Update department
router.put('/departments/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, code, description, status } = req.body;

    const updated = await prisma.department.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(code ? { code } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status ? { status } : {}),
      },
    });

    await logActivity(req.user!.id, 'UPDATE_DEPARTMENT', 'DEPARTMENT', id, `Updated department ${updated.name}`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update department.' });
  }
});

// Users: List all (Admin only)
router.get('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        department: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Users: Update user role / status
router.put('/:id', authenticate, requireRole('SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, status, departmentId } = req.body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      if (role && role !== 'SUPER_ADMIN') {
        const count = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
        if (count <= 1) {
          res.status(400).json({ error: 'Cannot demote the last remaining Super Admin.' });
          return;
        }
      }
      if (status === 'INACTIVE' && req.user!.id === targetUser.id) {
        res.status(400).json({ error: 'Cannot deactivate your own Super Admin account.' });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
        ...(departmentId !== undefined ? { departmentId: departmentId || null } : {}),
      },
    });

    await logActivity(req.user!.id, 'UPDATE_USER_ROLE', 'USER', id, `Updated role/status of ${user.name}`);
    res.json({ message: 'User updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// Users: Create new user (Super Admin only)
router.post('/', authenticate, requireRole('SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, departmentId, role, status } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and temporary password are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      res.status(400).json({ error: 'A user with this email address is already registered.' });
      return;
    }

    let finalDeptId: string | null = null;
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept) {
        res.status(400).json({ error: 'Selected department does not exist.' });
        return;
      }
      finalDeptId = dept.id;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        passwordHash,
        phone: phone || null,
        departmentId: finalDeptId,
        role: role || 'FACULTY',
        status: status || 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        department: true,
        _count: { select: { bookings: true } },
      },
    });

    await logActivity(req.user!.id, 'CREATE_USER', 'USER', newUser.id, `Created user ${newUser.name} (${newUser.role})`);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

export default router;
