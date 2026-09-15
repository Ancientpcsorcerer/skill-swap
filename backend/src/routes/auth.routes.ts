import { Router } from 'express';
import { authController } from '../modules/auth/auth.controller';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../modules/auth/auth.validation';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/auth';

export const authRouter = Router();

authRouter.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  authController.register.bind(authController)
);

authRouter.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  authController.login.bind(authController)
);

authRouter.post('/refresh', authController.refresh.bind(authController));
authRouter.post('/logout', authController.logout.bind(authController));
authRouter.post('/oauth', authLimiter, authController.oauth.bind(authController));
authRouter.get('/me', authenticateToken, authController.me.bind(authController));
