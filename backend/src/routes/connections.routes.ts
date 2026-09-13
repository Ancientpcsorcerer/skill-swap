import { Router } from 'express';
import { connectionsController } from '../modules/connections/connections.controller';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendConnectionSchema } from '../modules/connections/connections.validation';

export const connectionsRouter = Router();

connectionsRouter.use(authenticateToken);

connectionsRouter.get('/', connectionsController.getConnections.bind(connectionsController));
connectionsRouter.post(
  '/',
  validate({ body: sendConnectionSchema }),
  connectionsController.sendRequest.bind(connectionsController)
);
connectionsRouter.put('/:id/accept', connectionsController.acceptRequest.bind(connectionsController));
connectionsRouter.put('/:id/decline', connectionsController.declineRequest.bind(connectionsController));
connectionsRouter.delete('/:id', connectionsController.removeConnection.bind(connectionsController));
