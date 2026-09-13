import { Request, Response, NextFunction } from 'express';
import { connectionsService } from './connections.service';
import { UnauthorizedError } from '../../utils/errors';

export class ConnectionsController {
  async getConnections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const connections = await connectionsService.getConnections(req.user.userId);
      res.status(200).json({
        success: true,
        data: { connections },
      });
    } catch (err) {
      next(err);
    }
  }

  async sendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const connection = await connectionsService.sendRequest(
        req.user.userId,
        req.body.addresseeId
      );
      res.status(201).json({
        success: true,
        data: { connection },
      });
    } catch (err) {
      next(err);
    }
  }

  async acceptRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const connection = await connectionsService.acceptRequest(id, req.user.userId);
      res.status(200).json({
        success: true,
        data: { connection },
      });
    } catch (err) {
      next(err);
    }
  }

  async declineRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const connection = await connectionsService.declineRequest(id, req.user.userId);
      res.status(200).json({
        success: true,
        data: { connection },
      });
    } catch (err) {
      next(err);
    }
  }

  async removeConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await connectionsService.removeConnection(id, req.user.userId);
      res.status(200).json({
        success: true,
        message: 'Connection removed',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const connectionsController = new ConnectionsController();
