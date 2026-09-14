import { Request, Response, NextFunction } from 'express';
import { discoverService } from './discover.service';
import { UnauthorizedError } from '../../utils/errors';

export class DiscoverController {
  async getTrending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const trending = await discoverService.getTrending(userId);
      res.status(200).json({
        success: true,
        data: trending,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCommunities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const communities = await discoverService.getCommunities(userId);
      res.status(200).json({
        success: true,
        data: { communities },
      });
    } catch (err) {
      next(err);
    }
  }

  async joinCommunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const communityId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await discoverService.joinCommunity(communityId, req.user.userId);
      res.status(200).json({
        success: true,
        message: 'Joined community',
      });
    } catch (err) {
      next(err);
    }
  }

  async leaveCommunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const communityId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await discoverService.leaveCommunity(communityId, req.user.userId);
      res.status(200).json({
        success: true,
        message: 'Left community',
      });
    } catch (err) {
      next(err);
    }
  }

  async getIdeas(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ideas = await discoverService.getIdeas();
      res.status(200).json({
        success: true,
        data: { ideas },
      });
    } catch (err) {
      next(err);
    }
  }

  async createIdea(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const idea = await discoverService.createIdea(req.user.userId, req.body);
      res.status(201).json({
        success: true,
        data: { idea },
      });
    } catch (err) {
      next(err);
    }
  }

  async getEvents(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await discoverService.getEvents();
      res.status(200).json({
        success: true,
        data: { events },
      });
    } catch (err) {
      next(err);
    }
  }

  async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const event = await discoverService.createEvent(req.user.userId, req.body);
      res.status(201).json({
        success: true,
        data: { event },
      });
    } catch (err) {
      next(err);
    }
  }

  async getSavedItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const items = await discoverService.getSavedItems(req.user.userId);
      res.status(200).json({
        success: true,
        data: { items },
      });
    } catch (err) {
      next(err);
    }
  }

  async saveItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const item = await discoverService.saveItem(
        req.user.userId,
        req.body.itemType,
        req.body.itemId
      );
      res.status(200).json({
        success: true,
        data: { item },
      });
    } catch (err) {
      next(err);
    }
  }

  async unsaveItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const itemType = req.params.itemType as 'project' | 'idea' | 'event';
      const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
      await discoverService.unsaveItem(req.user.userId, itemType, itemId);
      res.status(200).json({
        success: true,
        message: 'Item unsaved',
      });
    } catch (err) {
      next(err);
    }
  }

  async getActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const activity = await discoverService.getActivity(req.user.userId);
      res.status(200).json({
        success: true,
        data: { activity },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const discoverController = new DiscoverController();
