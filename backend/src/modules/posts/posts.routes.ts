import { Router } from 'express';
import { postsController } from './posts.controller';
import { authenticateToken, optionalAuth } from '../../middleware/auth';

export const postsRouter = Router();

// Public list with optional auth
postsRouter.get('/', optionalAuth, postsController.listPosts.bind(postsController));

// Authenticated creation
postsRouter.post('/', authenticateToken, postsController.createPost.bind(postsController));
