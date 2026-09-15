import { Router } from 'express';
import { chatController } from './chat.controller';
import { authenticateToken } from '../../middleware/auth';

export const chatRouter = Router();

// Guard all chat routes: requires authenticated token
chatRouter.use(authenticateToken);

chatRouter.get('/conversations', chatController.getConversations.bind(chatController));
chatRouter.post('/conversations', chatController.getOrCreateConversation.bind(chatController));
chatRouter.get('/conversations/:id/messages', chatController.getMessages.bind(chatController));
chatRouter.post('/conversations/:id/messages', chatController.sendMessage.bind(chatController));
