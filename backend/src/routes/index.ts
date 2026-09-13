import { Router } from 'express';
import { authRouter } from './auth.routes';
import { profileRouter } from './profile.routes';
import { usersRouter } from './users.routes';
import { connectionsRouter } from './connections.routes';
import { projectsRouter } from './projects.routes';
import { learningRouter } from './learning.routes';
import { discoverRouter } from './discover.routes';
import { healthRouter } from './health';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/connections', connectionsRouter);
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/learning', learningRouter);
apiRouter.use('/', discoverRouter);
apiRouter.use(healthRouter);
