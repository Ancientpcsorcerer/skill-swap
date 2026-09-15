import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken, AuthTokenPayload } from '../utils/tokens';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { queryOne } from '../db/client';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

async function resolveToken(token: string): Promise<AuthTokenPayload | null> {
  // 1. Try application internal JWT
  try {
    const payload = verifyAccessToken(token);
    return payload;
  } catch {
    // Continue to external / Firebase verification
  }

  // 2. Decode Firebase ID token or OAuth provider token
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && (decoded.iss?.includes('securetoken.google.com') || (decoded.sub && decoded.email))) {
      const cleanEmail = decoded.email?.toLowerCase().trim();
      if (cleanEmail) {
        let dbUser = await queryOne<{ id: string; email: string }>(
          `SELECT id, email FROM users WHERE email = $1 AND deleted_at IS NULL`,
          [cleanEmail]
        );

        if (!dbUser) {
          const cleanName = decoded.name?.trim() || cleanEmail.split('@')[0] || 'User';
          const baseUsername =
            cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '').slice(0, 20) +
            '_' +
            Math.floor(1000 + Math.random() * 9000);
          dbUser = await queryOne<{ id: string; email: string }>(
            `INSERT INTO users (name, username, email, avatar_url)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (email) DO UPDATE SET avatar_url = COALESCE(users.avatar_url, EXCLUDED.avatar_url)
             RETURNING id, email`,
            [cleanName, baseUsername, cleanEmail, decoded.picture || null]
          );
        }

        if (dbUser) {
          return {
            userId: dbUser.id,
            email: dbUser.email,
            role: 'member',
          };
        }
      }
    }
  } catch {
    // ignore decode error
  }

  return null;
}

export async function authenticateToken(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next(new UnauthorizedError('Missing Authorization header'));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(new UnauthorizedError('Invalid Authorization header format. Expected "Bearer <token>"'));
  }

  const token = parts[1];
  try {
    const payload = await resolveToken(token);
    if (!payload) {
      return next(new UnauthorizedError('Invalid or expired token'));
    }
    req.user = payload;
    next();
  } catch (err) {
    next(new UnauthorizedError('Authentication verification failed'));
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    try {
      const payload = await resolveToken(parts[1]);
      if (payload) {
        req.user = payload;
      }
    } catch {
      // Ignored for optional auth
    }
  }
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
}
