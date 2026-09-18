import { Request, Response, NextFunction } from 'express';
import { commentsService } from './comments.service';
import { UnauthorizedError, BadRequestError } from '../../utils/errors';

export class CommentsController {
  async listComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetType = (req.query.targetType || req.query.target_type) as 'post' | 'project';
      const targetId = (req.query.targetId || req.query.target_id) as string;

      if (!targetType || !targetId) {
        throw new BadRequestError('targetType and targetId are required query parameters');
      }

      if (targetType !== 'post' && targetType !== 'project') {
        throw new BadRequestError('targetType must be "post" or "project"');
      }

      const currentUserId = req.user?.userId;
      const result = await commentsService.listComments(targetType, targetId, currentUserId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { targetType, target_type, targetId, target_id, body, parentCommentId, parent_comment_id } = req.body;
      const finalType = (targetType || target_type) as 'post' | 'project';
      const finalTargetId = targetId || target_id;
      const finalParentId = parentCommentId || parent_comment_id || null;

      if (!finalType || !finalTargetId) {
        throw new BadRequestError('targetType and targetId are required');
      }

      if (finalType !== 'post' && finalType !== 'project') {
        throw new BadRequestError('targetType must be "post" or "project"');
      }

      const comment = await commentsService.createComment(
        finalType,
        finalTargetId,
        req.user.userId,
        body,
        finalParentId
      );
      res.status(201).json({ success: true, data: { comment } });
    } catch (err) {
      next(err);
    }
  }

  async updateComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { body } = req.body;
      const comment = await commentsService.updateComment(id, req.user.userId, body);
      res.json({ success: true, data: { comment } });
    } catch (err) {
      next(err);
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await commentsService.deleteComment(id, req.user.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async likeComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await commentsService.likeComment(id, req.user.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async unlikeComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await commentsService.unlikeComment(id, req.user.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async reportComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { reason } = req.body;
      const result = await commentsService.reportComment(id, req.user.userId, reason);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const commentsController = new CommentsController();
