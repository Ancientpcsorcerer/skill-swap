import { Router } from 'express';
import { usersController } from '../modules/users/users.controller';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { searchUsersQuerySchema } from '../modules/users/users.validation';

export const usersRouter = Router();

usersRouter.get(
  '/',
  validate({ query: searchUsersQuerySchema }),
  usersController.searchUsers.bind(usersController)
);

usersRouter.get(
  '/suggested',
  authenticateToken,
  usersController.getSuggestedUsers.bind(usersController)
);

usersRouter.get('/:id', usersController.getUserById.bind(usersController));
