import { Router } from 'express';
import { usersController } from '../modules/users/users.controller';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '../modules/users/users.validation';

export const profileRouter = Router();

profileRouter.get('/', authenticateToken, usersController.getProfile.bind(usersController));
profileRouter.put(
  '/',
  authenticateToken,
  validate({ body: updateProfileSchema }),
  usersController.updateProfile.bind(usersController)
);
profileRouter.post('/photo', authenticateToken, usersController.updatePhoto.bind(usersController));
profileRouter.delete('/photo', authenticateToken, usersController.removePhoto.bind(usersController));
