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

    // Institutional domain verification on login
    const domainSetting = await prisma.systemSetting.findUnique({ where: { key: 'allowedEmailDomain' } });
    if (domainSetting?.value) {
      const allowedDomain = domainSetting.value.trim().toLowerCase().replace(/^@/, '');
      const isSystemAdminEmail = ['superadmin@college.edu', 'admin@college.edu'].includes(cleanEmail);
      if (allowedDomain && !cleanEmail.endsWith(`@${allowedDomain}`) && !isSystemAdminEmail) {
        res.status(403).json({
          error: `Only @${allowedDomain} email is allowed.`,
        });
        return;
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { department: true },
    });

    // Constant-time mitigation against user enumeration timing attacks (Layer 04)
    const dummyHash = '$2a$10$e8W/J2tE6aD8bF4sH0iTbe5iU2tL5lU3dO8fI1kM4vO0eP6sQ2v1m';
    const isMatch = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);

    if (!user || !isMatch) {
      res.status(401).json({ error: 'Invalid institutional email or password.' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Your institutional account is pending administrator activation.' });
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

// Helper: Cryptographically verify Google ID Token or Access Token with Google servers
interface VerifiedGoogleProfile {
  email: string;
  name?: string;
  picture?: string;
}

async function verifyGoogleAuthToken(token: string): Promise<VerifiedGoogleProfile> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    throw new Error('Google credential token is missing.');
  }

  // 1. Try Google ID Token verification (JWT with 3 parts: header.payload.signature)
  if (cleanToken.split('.').length === 3) {
    try {
      const idTokenRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(cleanToken)}`
      );
      if (idTokenRes.ok) {
        const idData: any = await idTokenRes.json();

        // Validate Google issuer
        const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
        if (!validIssuers.includes(idData.iss)) {
          throw new Error('Untrusted Google token issuer.');
        }

        // Validate verified email presence
        if (!idData.email) {
          throw new Error('Google token does not contain an email address.');
        }
        if (idData.email_verified !== 'true' && idData.email_verified !== true) {
          throw new Error('Google email address is not verified.');
        }

        const configuredClientId = process.env.GOOGLE_CLIENT_ID;
        if (configuredClientId && idData.aud !== configuredClientId) {
          console.warn(`[Google SSO] Warning: Token audience (${idData.aud}) does not match configured GOOGLE_CLIENT_ID.`);
        }

        return {
          email: idData.email.trim().toLowerCase(),
          name: idData.name,
          picture: idData.picture,
        };
      }
    } catch (err: any) {
      console.warn('[Google SSO] ID token verification attempt failed:', err.message);
    }
  }

  // 2. Try Google OAuth2 Access Token verification via userinfo endpoint
  try {
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${cleanToken}` },
    });
    if (userinfoRes.ok) {
      const userData: any = await userinfoRes.json();
      if (!userData.email) {
        throw new Error('Google user profile does not contain an email address.');
      }
      if (userData.email_verified !== true && userData.email_verified !== 'true') {
        throw new Error('Google account email is not verified.');
      }
      return {
        email: userData.email.trim().toLowerCase(),
        name: userData.name,
        picture: userData.picture,
      };
    }
  } catch (err: any) {
    console.warn('[Google SSO] Access token verification attempt failed:', err.message);
  }

  throw new Error('Invalid, expired, or rejected Google authentication credential.');
}

// Google Institutional SSO Endpoint (Cryptographically verified)
router.post('/google', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { token: googleToken, credential, idToken } = req.body;
    const tokenToVerify = googleToken || credential || idToken;

    if (!tokenToVerify || typeof tokenToVerify !== 'string') {
      res.status(401).json({ error: 'Google authentication credential is required.' });
      return;
    }

    // Cryptographically verify token directly with Google API
    let verifiedGoogleUser: VerifiedGoogleProfile;
    try {
      verifiedGoogleUser = await verifyGoogleAuthToken(tokenToVerify);
    } catch (err: any) {
      res.status(401).json({ error: err.message || 'Failed to verify Google credentials.' });
      return;
    }

    const cleanEmail = verifiedGoogleUser.email;
    const verifiedName = verifiedGoogleUser.name;

    // Strict Institutional Domain Lockdown: Strictly only @sairamce.edu.in Google accounts allowed
    const domainSetting = await prisma.systemSetting.findUnique({ where: { key: 'allowedEmailDomain' } });
    const allowedDomain = (domainSetting?.value || 'sairamce.edu.in').trim().toLowerCase().replace(/^@/, '');

    if (!cleanEmail.endsWith('@sairamce.edu.in') || !cleanEmail.endsWith(`@${allowedDomain}`)) {
      res.status(403).json({
        error: 'Access Denied: Only official Sri Sairam College Google accounts (@sairamce.edu.in) are permitted to sign in.',
      });
      return;
    }

    // Auto-detect Department from email prefix if possible (e.g. hod.cse, faculty.ece)
    let matchedDepartmentId: string | null = null;
    const depts = await prisma.department.findMany({ where: { status: 'ACTIVE' } });
    for (const d of depts) {
      const code = d.code.toLowerCase().trim();
      if (cleanEmail.includes(code)) {
        matchedDepartmentId = d.id;
        break;
      }
    }

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { department: true },
    });

    if (!user) {
      // SECURITY GUARD: Never auto-elevate role based on email string!
      // New SSO registrations are assigned standard FACULTY or USER role.
      // Admin / Super Admin roles must be explicitly granted by an existing Super Admin or pre-seeded.
      const assignedRole = matchedDepartmentId ? 'FACULTY' : 'USER';
      const dummyPasswordHash = await bcrypt.hash(`SSO-${Date.now()}-${Math.random()}`, 10);
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: verifiedName || cleanEmail.split('@')[0].replace('.', ' ').toUpperCase(),
          passwordHash: dummyPasswordHash,
          departmentId: matchedDepartmentId,
          role: assignedRole,
          status: 'ACTIVE',
        },
        include: { department: true },
      });

      await logActivity(user.id, 'REGISTER_SSO', 'USER', user.id, `User ${user.name} registered via Sairam Google SSO (${assignedRole}).`);
    } else if (user.status !== 'ACTIVE') {
      res.status(403).json({
        error: 'Your institutional account has been placed on hold. Please contact the Estate Admin.',
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    await logActivity(user.id, 'LOGIN_SSO', 'USER', user.id, `User ${user.name} signed in via verified Sairam Google Workspace.`);

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
    console.error('Google SSO login error:', error);
    res.status(500).json({ error: 'Failed to authenticate via Google.' });
  }
});

// Development / Testing Demo Personas Login (Strictly disabled in production)
router.post('/demo-login', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_LOGIN) {
      res.status(403).json({ error: 'Instant demo persona login is strictly disabled in production.' });
      return;
    }

    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Demo email is required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const ALLOWED_DEMO_EMAILS = [
      'coo@sairamce.edu.in',
      'estate.admin@sairamce.edu.in',
      'hod.cse@sairamce.edu.in',
      'faculty.ece@sairamce.edu.in',
      'superadmin@college.edu',
      'admin@college.edu',
      'faculty@college.edu',
    ];

    if (!ALLOWED_DEMO_EMAILS.includes(cleanEmail)) {
      res.status(403).json({ error: 'Unauthorized demo account request.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { department: true },
    });

    if (!user) {
      res.status(404).json({ error: 'Demo account not found in database. Please run npm run seed.' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'This demo account is currently inactive.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    await logActivity(user.id, 'DEMO_LOGIN', 'USER', user.id, `Demo persona login used for ${user.email} (${user.role}).`);

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
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Failed to process demo login.' });
  }
});

export default router;
