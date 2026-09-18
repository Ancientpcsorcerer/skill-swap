import { Router } from 'express';
import { authRouter } from './auth.routes';
import { profileRouter } from './profile.routes';
import { usersRouter } from './users.routes';
import { connectionsRouter } from './connections.routes';
import { projectsRouter } from './projects.routes';
import { learningRouter } from './learning.routes';
import { discoverRouter } from './discover.routes';
import { chatRouter } from '../modules/chat/chat.routes';
import { postsRouter } from '../modules/posts/posts.routes';
import { mediaRouter } from '../modules/media/media.routes';
import { cryptoRouter } from '../modules/crypto/crypto.routes';
import { teachingRouter } from '../modules/teaching/teaching.routes';
import { commentsRouter } from '../modules/comments/comments.routes';
import { healthRouter } from './health';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/connections', connectionsRouter);
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/learning', learningRouter);
apiRouter.use('/teaching', teachingRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/posts', postsRouter);
apiRouter.use('/comments', commentsRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/crypto', cryptoRouter);
apiRouter.use('/', discoverRouter);

