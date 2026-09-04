import { Router, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { getDb } from '../db/database.js';
import { authenticate, requireAdmin, signToken, type AuthRequest } from '../middleware/auth.middleware.js';
import { verifyPassword, hashPassword } from '../lib/password.js';
import { unauthorized, notFound, badRequest, forbidden } from '../lib/errors.js';
import { loginSchema, createUserSchema, updateUserSchema } from '../validation/schemas.js';
import { recordAudit, ensureAdminUser } from '../services/audit.service.js';
import { loginRateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

type UserDoc = {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  passwordHash?: string;
  tokenVersion?: number;
};

const usersCollection = () => getDb().collection('users');

const toPublicUser = (user: UserDoc) => ({
  id: String(user._id),
  email: user.email,
  name: user.name,
  role: user.role,
});

router.post(
  '/login',
  loginRateLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = (await usersCollection().findOne({ email })) as UserDoc | null;
      if (!user?.passwordHash) throw unauthorized('Invalid credentials');
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) throw unauthorized('Invalid credentials');

      const token = signToken({
        userId: String(user._id),
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion ?? 0,
      });

      await usersCollection().updateOne(
        { _id: user._id },
        { $set: { lastLoginAt: new Date().toISOString() } }
      );
      await recordAudit({ req, action: 'login', resource: 'auth', resourceId: String(user._id) });

      res.json({ success: true, data: { token, user: toPublicUser(user) } });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/me',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = (await usersCollection().findOne({ _id: String(req.user!.userId) })) as UserDoc | null;
      if (!user) throw notFound('User not found');
      res.json({ success: true, data: { user: toPublicUser(user) } });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/logout', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Stateless JWT logout: client discards token. Bump tokenVersion to revoke.
    await usersCollection().updateOne(
      { _id: String(req.user!.userId) },
      { $inc: { tokenVersion: 1 } }
    );
    await recordAudit({ req, action: 'logout', resource: 'auth' });
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    next(error);
  }
});

// ---------------- Account self-service (password change) ----------------
// The Users management UI has been removed; only the authenticated update of a
// user record (used by Settings → Change Password) remains.

router.put(
  '/users/:id',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const input = updateUserSchema.parse(req.body);
      const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (input.name !== undefined) set.name = input.name;
      if (input.password !== undefined) {
        set.passwordHash = await hashPassword(input.password);
        const current = await usersCollection().findOne({ _id: String(req.params.id) });
        set.tokenVersion = (current?.tokenVersion ?? 0) + 1;
      }
      const result = await usersCollection().findOneAndUpdate(
        { _id: String(req.params.id) },
        { $set: set },
        { returnDocument: 'after', projection: { passwordHash: 0 } }
      );
      if (!result) throw notFound('User not found');
      await recordAudit({ req, action: 'update_user', resource: 'users', resourceId: String(req.params.id) });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
