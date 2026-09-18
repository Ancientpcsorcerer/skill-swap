import { Request, Response, NextFunction } from 'express';
import { postsService } from './posts.service';
import { UnauthorizedError, BadRequestError } from '../../utils/errors';

export class PostsController {
  async listPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authorId = typeof req.query.authorId === 'string' ? req.query.authorId : undefined;
      const currentUserId = req.user?.userId;
      const posts = await postsService.listPosts(authorId, currentUserId);
      res.json({ success: true, data: { posts } });
    } catch (err) {
      next(err);
    }
  }

  async getPostById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const currentUserId = req.user?.userId;
      const post = await postsService.getPostById(id, currentUserId);
      res.json({ success: true, data: { post } });
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

  async updatePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const post = await postsService.updatePost(id, req.user.userId, req.body);
      res.json({ success: true, data: { post } });
    } catch (err) {
      next(err);
    }
  }

  async deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await postsService.deletePost(id, req.user.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async likePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await postsService.likePost(req.user.userId, id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async unlikePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await postsService.unlikePost(req.user.userId, id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async savePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await postsService.savePost(req.user.userId, id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async unsavePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await postsService.unsavePost(req.user.userId, id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async reportPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { reason } = req.body;
      const result = await postsService.reportPost(req.user.userId, id, reason);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async repostPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await postsService.repost(req.user.userId, postId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async unrepostPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await postsService.unrepost(req.user.userId, postId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const postsController = new PostsController();
