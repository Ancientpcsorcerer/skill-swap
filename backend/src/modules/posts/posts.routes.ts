import { Router } from 'express';
import { postsController } from './posts.controller';
import { authenticateToken, optionalAuth } from '../../middleware/auth';

export const postsRouter = Router();

// Public list with optional auth
postsRouter.get('/', optionalAuth, postsController.listPosts.bind(postsController));

// Authenticated creation
postsRouter.post('/', authenticateToken, postsController.createPost.bind(postsController));

// Authenticated repost and unrepost
postsRouter.post('/:id/repost', authenticateToken, postsController.repostPost.bind(postsController));
postsRouter.delete('/:id/repost', authenticateToken, postsController.unrepostPost.bind(postsController));

