import { Request, Response, NextFunction } from 'express';
import { postsService } from './posts.service';
import { UnauthorizedError } from '../../utils/errors';

export class PostsController {
  async listPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authorId = typeof req.query.authorId === 'string' ? req.query.authorId : undefined;
      const posts = await postsService.listPosts(authorId);
      res.json({ success: true, data: { posts } });
    } catch (err) {
      next(err);
    }
  }

  async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const post = await postsService.createPost(req.user.userId, req.body);
      res.status(201).json({ success: true, data: { post } });
    } catch (err) {
      next(err);
    }
  }
}

export const postsController = new PostsController();
