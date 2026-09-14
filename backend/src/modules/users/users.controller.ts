import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { UnauthorizedError } from '../../utils/errors';

export class UsersController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const profile = await usersService.getProfile(req.user.userId);
      res.status(200).json({
        success: true,
        data: { profile },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const updated = await usersService.updateProfile(req.user.userId, req.body);
      res.status(200).json({
        success: true,
        data: { profile: updated },
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await usersService.getUserById(id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }

  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query.q as string | undefined;
      const skill = req.query.skill as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      const result = await usersService.searchUsers(q, skill, limit, offset);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSuggestedUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const users = await usersService.getSuggestedUsers(req.user?.userId, limit);
      res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();
