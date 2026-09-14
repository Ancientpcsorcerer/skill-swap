import { Router } from 'express';
import { projectsController } from '../modules/projects/projects.controller';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createProjectSchema,
  updateProjectSchema,
  searchProjectsQuerySchema,
  addMemberSchema,
} from '../modules/projects/projects.validation';

export const projectsRouter = Router();

// Guard all project routes: requires valid JWT Bearer token
projectsRouter.use(authenticateToken);

projectsRouter.get(
  '/',
  validate({ query: searchProjectsQuerySchema }),
  projectsController.listProjects.bind(projectsController)
);

projectsRouter.get('/:id', projectsController.getProjectById.bind(projectsController));

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
