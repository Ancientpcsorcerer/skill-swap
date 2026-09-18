import { Router } from 'express';
import { postsController } from './posts.controller';
import { authenticateToken, optionalAuth } from '../../middleware/auth';

export const postsRouter = Router();

// Public list with optional auth
postsRouter.get('/', optionalAuth, postsController.listPosts.bind(postsController));

// Authenticated creation
postsRouter.post('/', authenticateToken, postsController.createPost.bind(postsController));

// Single post retrieval
postsRouter.get('/:id', optionalAuth, postsController.getPostById.bind(postsController));

// Post update and delete (owner only)
postsRouter.put('/:id', authenticateToken, postsController.updatePost.bind(postsController));
postsRouter.delete('/:id', authenticateToken, postsController.deletePost.bind(postsController));

// Post interactions: Like / Unlike
postsRouter.post('/:id/like', authenticateToken, postsController.likePost.bind(postsController));
postsRouter.delete('/:id/like', authenticateToken, postsController.unlikePost.bind(postsController));

// Post interactions: Save / Unsave
postsRouter.post('/:id/save', authenticateToken, postsController.savePost.bind(postsController));
postsRouter.delete('/:id/save', authenticateToken, postsController.unsavePost.bind(postsController));

// Post interactions: Repost / Unrepost
postsRouter.post('/:id/repost', authenticateToken, postsController.repostPost.bind(postsController));
postsRouter.delete('/:id/repost', authenticateToken, postsController.unrepostPost.bind(postsController));

// Post moderation: Report
postsRouter.post('/:id/report', authenticateToken, postsController.reportPost.bind(postsController));
