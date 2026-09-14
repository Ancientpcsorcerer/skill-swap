import { Router } from 'express';
import { usersController } from '../modules/users/users.controller';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { searchUsersQuerySchema } from '../modules/users/users.validation';

export const usersRouter = Router();

usersRouter.get(
  '/',
  optionalAuth,
  validate({ query: searchUsersQuerySchema }),
  usersController.searchUsers.bind(usersController)
);

usersRouter.get(
  '/suggested',
  optionalAuth,
  usersController.getSuggestedUsers.bind(usersController)
);

usersRouter.get('/:id', optionalAuth, usersController.getUserById.bind(usersController));
