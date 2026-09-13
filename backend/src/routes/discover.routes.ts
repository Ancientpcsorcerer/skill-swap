import { Router } from 'express';
import { discoverController } from '../modules/discover/discover.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createIdeaSchema,
  createEventSchema,
  saveItemSchema,
} from '../modules/discover/discover.validation';

export const discoverRouter = Router();

// Communities
discoverRouter.get('/communities', optionalAuth, discoverController.getCommunities.bind(discoverController));
discoverRouter.post('/communities/:id/join', authenticateToken, discoverController.joinCommunity.bind(discoverController));
discoverRouter.delete('/communities/:id/leave', authenticateToken, discoverController.leaveCommunity.bind(discoverController));

// Ideas
discoverRouter.get('/ideas', discoverController.getIdeas.bind(discoverController));
discoverRouter.post(
  '/ideas',
  authenticateToken,
  validate({ body: createIdeaSchema }),
  discoverController.createIdea.bind(discoverController)
);

// Events
discoverRouter.get('/events', discoverController.getEvents.bind(discoverController));
discoverRouter.post(
  '/events',
  authenticateToken,
  validate({ body: createEventSchema }),
  discoverController.createEvent.bind(discoverController)
);

// Saved Items
discoverRouter.get('/saved', authenticateToken, discoverController.getSavedItems.bind(discoverController));
discoverRouter.post(
  '/saved',
  authenticateToken,
  validate({ body: saveItemSchema }),
  discoverController.saveItem.bind(discoverController)
);
discoverRouter.delete('/saved/:itemType/:itemId', authenticateToken, discoverController.unsaveItem.bind(discoverController));

// Activity
discoverRouter.get('/activity', authenticateToken, discoverController.getActivity.bind(discoverController));
