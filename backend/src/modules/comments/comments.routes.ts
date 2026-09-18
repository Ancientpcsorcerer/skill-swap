import { Router } from 'express';
import { commentsController } from './comments.controller';
import { authenticateToken, optionalAuth } from '../../middleware/auth';

export const commentsRouter = Router();

// List comments for post or project (public or authenticated)
commentsRouter.get('/', optionalAuth, commentsController.listComments.bind(commentsController));

// Mutate operations require authentication
commentsRouter.post('/', authenticateToken, commentsController.createComment.bind(commentsController));
commentsRouter.put('/:id', authenticateToken, commentsController.updateComment.bind(commentsController));
commentsRouter.delete('/:id', authenticateToken, commentsController.deleteComment.bind(commentsController));
commentsRouter.post('/:id/like', authenticateToken, commentsController.likeComment.bind(commentsController));
commentsRouter.delete('/:id/like', authenticateToken, commentsController.unlikeComment.bind(commentsController));
commentsRouter.post('/:id/report', authenticateToken, commentsController.reportComment.bind(commentsController));
