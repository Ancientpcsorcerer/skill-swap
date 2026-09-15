import { Request, Response, NextFunction } from 'express';
import { projectsService } from './projects.service';
import { UnauthorizedError, BadRequestError } from '../../utils/errors';

export class ProjectsController {
  async listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query.q as string | undefined;
      const tag = req.query.tag as string | undefined;
      const type = req.query.type as string | undefined;
      const skill = req.query.skill as string | undefined;
      const status = req.query.status as string | undefined;
      const creatorId = req.query.creatorId as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      const currentUserId = req.user?.userId;

      const result = await projectsService.listProjects(
        {
          q,
          tag,
          type,
          skill,
          status,
          creatorId,
          limit,
          offset,
        },
        currentUserId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const currentUserId = req.user?.userId;
      const project = await projectsService.getProjectById(id, currentUserId);
      res.status(200).json({
        success: true,
        data: { project },
      });
    } catch (err) {
      next(err);
    }
  }

  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const project = await projectsService.createProject(req.user.userId, req.body);
      res.status(201).json({
        success: true,
        data: { project },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const project = await projectsService.updateProject(id, req.user.userId, req.body);
      res.status(200).json({
        success: true,
        data: { project },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await projectsService.deleteProject(id, req.user.userId);
      res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  // Cover Image Selection (Bug F3)
  async setCoverImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { cover_image_url } = req.body;
      if (!cover_image_url) throw new BadRequestError('cover_image_url is required');
      const project = await projectsService.setCoverImage(id, req.user.userId, cover_image_url);
      res.json({ success: true, data: { project } });
    } catch (err) {
      next(err);
    }
  }

  // Visibility Toggle (Bug F8, F10)
  async updateVisibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { visibility } = req.body;
      if (visibility !== 'public' && visibility !== 'private') {
        throw new BadRequestError('visibility must be either "public" or "private"');
      }
      const project = await projectsService.updateVisibility(id, req.user.userId, visibility);
      res.json({ success: true, data: { project } });
    } catch (err) {
      next(err);
    }
  }

  // Follow vs Join (Bug F6)
  async followProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await projectsService.followProject(id, req.user.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async unfollowProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await projectsService.unfollowProject(id, req.user.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async joinProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await projectsService.joinProject(id, req.user.userId);
      res.json({ success: true, message: 'Joined project team as collaborator' });
    } catch (err) {
      next(err);
    }
  }

  // Recreate Project (Bug F7)
  async recreateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const project = await projectsService.recreateProject(id, req.user.userId);
      res.status(201).json({ success: true, data: { project } });
    } catch (err) {
      next(err);
    }
  }

  // Project Updates (Bug F4, F5, F9)
  async addProjectUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const update = await projectsService.addProjectUpdate(id, req.user.userId, req.body);
      res.status(201).json({ success: true, data: { update } });
    } catch (err) {
      next(err);
    }
  }

  async getProjectUpdates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const currentUserId = req.user?.userId;
      const updates = await projectsService.getProjectUpdates(id, currentUserId);
      res.json({ success: true, data: { updates } });
    } catch (err) {
      next(err);
    }
  }

  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await projectsService.addMember(id, req.user.userId, req.body.userId, req.body.role);
      res.status(200).json({
        success: true,
        message: 'Member added or invited',
      });
    } catch (err) {
      next(err);
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      await projectsService.removeMember(projectId, req.user.userId, targetUserId);
      res.status(200).json({
        success: true,
        message: 'Member removed',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const projectsController = new ProjectsController();
