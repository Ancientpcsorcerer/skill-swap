import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../utils/errors';

const COOKIE_NAME = 'refreshToken';

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  };
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userAgent = req.headers['user-agent'];
      const ip = req.ip;

      const { user, accessToken, refreshToken } = await authService.register(
        req.body,
        userAgent,
        ip
      );

      res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());

      res.status(201).json({
        success: true,
        data: {
          user,
          accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userAgent = req.headers['user-agent'];
      const ip = req.ip;

      const { user, accessToken, refreshToken } = await authService.login(
        req.body.identifier,
        req.body.password,
        userAgent,
        ip
      );

      res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawToken = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;

      if (!rawToken) {
        throw new UnauthorizedError('No refresh token provided');
      }

      const userAgent = req.headers['user-agent'];
      const ip = req.ip;

      const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(
        rawToken,
        userAgent,
        ip
      );

      res.cookie(COOKIE_NAME, newRefreshToken, getCookieOptions());

      res.status(200).json({
        success: true,
        data: {
          accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawToken = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;

      if (rawToken) {
        await authService.logout(rawToken);
      }

      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/api/v1/auth',
      });

      res.status(200).json({
        success: true,
        message: 'Successfully logged out',
      });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const user = await authService.getCurrentUser(req.user.userId);

      res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
