import { Request, Response, NextFunction } from 'express';
import { teachingService } from './teaching.service';
import { zoomService } from './zoom.service';
import { env } from '../../config/env';
import { UnauthorizedError, BadRequestError } from '../../utils/errors';

export class TeachingController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const profile = await teachingService.getProfile(req.user.userId);
      res.json({ success: true, data: { profile } });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const profile = await teachingService.updateProfile(req.user.userId, req.body);
      res.json({ success: true, data: { profile } });
    } catch (err) {
      next(err);
    }
  }

  async listTeachers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skill = typeof req.query.skill === 'string' ? req.query.skill : undefined;
      const teachers = await teachingService.listTeachers(skill);
      res.json({ success: true, data: { teachers } });
    } catch (err) {
      next(err);
    }
  }

  async listRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const requests = await teachingService.listRequests(req.user.userId);
      res.json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  }

  async createRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const request = await teachingService.createRequest(req.user.userId, req.body);
      res.status(201).json({ success: true, data: { request } });
    } catch (err) {
      next(err);
    }
  }

  async acceptRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const request = await teachingService.respondRequest(req.user.userId, id, 'accepted');
      res.json({ success: true, data: { request } });
    } catch (err) {
      next(err);
    }
  }

  async declineRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const request = await teachingService.respondRequest(req.user.userId, id, 'declined');
      res.json({ success: true, data: { request } });
    } catch (err) {
      next(err);
    }
  }

  async listStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const students = await teachingService.listStudents(req.user.userId);
      res.json({ success: true, data: { students } });
    } catch (err) {
      next(err);
    }
  }

  async listClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classes = await teachingService.listClasses(req.user?.userId);
      res.json({ success: true, data: { classes } });
    } catch (err) {
      next(err);
    }
  }

  async createClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const createdClass = await teachingService.createClass(req.user.userId, req.body);
      res.status(201).json({ success: true, data: { class: createdClass } });
    } catch (err) {
      next(err);
    }
  }

  async joinClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await teachingService.joinClass(req.user.userId, id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async leaveClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await teachingService.leaveClass(req.user.userId, id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trackId = typeof req.query.trackId === 'string' ? req.query.trackId : undefined;
      const sessions = await teachingService.listSessions(req.user?.userId, trackId);
      res.json({ success: true, data: { sessions } });
    } catch (err) {
      next(err);
    }
  }

  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const session = await teachingService.createSession(req.user.userId, req.body);
      res.status(201).json({ success: true, data: { session } });
    } catch (err) {
      next(err);
    }
  }

  async updateSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const session = await teachingService.updateSession(req.user.userId, id, req.body);
      res.json({ success: true, data: { session } });
    } catch (err) {
      next(err);
    }
  }

  async cancelSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const session = await teachingService.cancelSession(req.user.userId, id);
      res.json({ success: true, data: { session } });
    } catch (err) {
      next(err);
    }
  }

  async getZoomStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const status = await zoomService.getZoomStatus(req.user.userId);
      res.json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  }

  async getZoomAuthorizeUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const url = zoomService.getAuthorizeUrl(req.user.userId);
      res.json({ success: true, data: { url } });
    } catch (err) {
      next(err);
    }
  }

  async handleZoomCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    const frontendBase = env.CORS_ORIGIN || 'https://skill-swap-xi-lake.vercel.app';
    try {
      const code = typeof req.query.code === 'string' ? req.query.code : undefined;
      const state = typeof req.query.state === 'string' ? req.query.state : undefined;

      if (!code || !state) {
        throw new BadRequestError('Missing code or state in Zoom callback');
      }

      await zoomService.handleCallback(code, state);
      res.redirect(`${frontendBase}/#/app/teaching?section=availability&zoom=connected`);
    } catch (err: any) {
      console.error('Zoom callback failed:', err.message);
      res.redirect(
        `${frontendBase}/#/app/teaching?section=availability&zoom=error&message=${encodeURIComponent(
          err.message || 'Failed to authorize with Zoom'
        )}`
      );
    }
  }

  async disconnectZoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      await zoomService.disconnect(req.user.userId);
      res.json({ success: true, message: 'Zoom integration disconnected successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const teachingController = new TeachingController();

