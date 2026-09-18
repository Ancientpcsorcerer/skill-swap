import { Router } from 'express';
import { projectsController } from '../modules/projects/projects.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createProjectSchema,
  updateProjectSchema,
  searchProjectsQuerySchema,
  addMemberSchema,
} from '../modules/projects/projects.validation';

export const projectsRouter = Router();

// Public / Guest accessible routes (filtered by visibility)
projectsRouter.get(
  '/',
  optionalAuth,
  validate({ query: searchProjectsQuerySchema }),
  projectsController.listProjects.bind(projectsController)
);

projectsRouter.get('/:id', optionalAuth, projectsController.getProjectById.bind(projectsController));
projectsRouter.get('/:id/updates', optionalAuth, projectsController.getProjectUpdates.bind(projectsController));

// Protected mutation routes (require authenticated JWT)
projectsRouter.post(
  '/',
  authenticateToken,
  validate({ body: createProjectSchema }),
  projectsController.createProject.bind(projectsController)
);

projectsRouter.put(
  '/:id',
  authenticateToken,
  validate({ body: updateProjectSchema }),
  projectsController.updateProject.bind(projectsController)
);

projectsRouter.delete(
  '/:id',
  authenticateToken,
  projectsController.deleteProject.bind(projectsController)
);

// Cover image selection (Bug F3)
projectsRouter.post('/:id/cover', authenticateToken, projectsController.setCoverImage.bind(projectsController));

// Visibility toggle (Bug F8, F10)
projectsRouter.patch('/:id/visibility', authenticateToken, projectsController.updateVisibility.bind(projectsController));

// Follow vs Join (Bug F6)
projectsRouter.post('/:id/follow', authenticateToken, projectsController.followProject.bind(projectsController));
projectsRouter.delete('/:id/follow', authenticateToken, projectsController.unfollowProject.bind(projectsController));
projectsRouter.post('/:id/join', authenticateToken, projectsController.joinProject.bind(projectsController));

// Project interactions: Like / Unlike
projectsRouter.post('/:id/like', authenticateToken, projectsController.likeProject.bind(projectsController));
projectsRouter.delete('/:id/like', authenticateToken, projectsController.unlikeProject.bind(projectsController));

// Project interactions: Repost / Unrepost
projectsRouter.post('/:id/repost', authenticateToken, projectsController.repostProject.bind(projectsController));
projectsRouter.delete('/:id/repost', authenticateToken, projectsController.unrepostProject.bind(projectsController));

// Project moderation: Report
projectsRouter.post('/:id/report', authenticateToken, projectsController.reportProject.bind(projectsController));

// Recreate Completed Project (Bug F7)
projectsRouter.post('/:id/recreate', authenticateToken, projectsController.recreateProject.bind(projectsController));

// Project Updates (Bug F4, F5)
projectsRouter.post('/:id/updates', authenticateToken, projectsController.addProjectUpdate.bind(projectsController));

// Members
projectsRouter.post(
  '/:id/members',
  authenticateToken,
  validate({ body: addMemberSchema }),
  projectsController.addMember.bind(projectsController)
);

projectsRouter.delete(
  '/:id/members/:userId',
  authenticateToken,
  projectsController.removeMember.bind(projectsController)
);
