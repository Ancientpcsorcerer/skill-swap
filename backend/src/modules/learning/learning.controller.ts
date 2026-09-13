import { Request, Response, NextFunction } from 'express';
import { learningService } from './learning.service';
import { UnauthorizedError } from '../../utils/errors';

export class LearningController {
  async getLearningState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const data = await learningService.getLearningState(req.user.userId);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const pathId = Array.isArray(req.params.pathId) ? req.params.pathId[0] : req.params.pathId;
      const record = await learningService.updateRecord(
        req.user.userId,
        pathId,
        req.body.status,
        req.body.progress
      );
      res.status(200).json({
        success: true,
        data: { record },
      });
    } catch (err) {
      next(err);
    }
  }

  async addGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const goal = await learningService.addGoal(req.user.userId, req.body.goal);
      res.status(201).json({
        success: true,
        data: { goal },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await learningService.deleteGoal(req.user.userId, id);
      res.status(200).json({
        success: true,
        message: 'Goal deleted',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const learningController = new LearningController();
