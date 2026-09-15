import { Request, Response, NextFunction } from 'express';
import { chatService } from './chat.service';
import { UnauthorizedError, BadRequestError } from '../../utils/errors';

export class ChatController {
  async getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const conversations = await chatService.getConversations(req.user.userId);
      res.json({ success: true, data: { conversations } });
    } catch (err) {
      next(err);
    }
  }

  async getOrCreateConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { partnerId } = req.body;
      if (!partnerId) throw new BadRequestError('partnerId is required');
      const conversation = await chatService.getOrCreateConversation(req.user.userId, partnerId);
      res.json({ success: true, data: { conversation } });
    } catch (err) {
      next(err);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const messages = await chatService.getMessages(id, req.user.userId);
      res.json({ success: true, data: { messages } });
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { ciphertext, iv, authTag, ratchetHeader } = req.body;
      if (!ciphertext || !iv || !authTag) {
        throw new BadRequestError('Required encrypted fields: ciphertext, iv, and authTag');
      }
      const message = await chatService.sendMessage(id, req.user.userId, ciphertext, iv, authTag, ratchetHeader);
      res.status(201).json({ success: true, data: { message } });
    } catch (err) {
      next(err);
    }
  }
}

export const chatController = new ChatController();
