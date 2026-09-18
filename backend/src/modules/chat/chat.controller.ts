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
      const { ciphertext, iv, authTag, ratchetHeader, reply_to_message_id, replyToMessageId } = req.body;
      if (!ciphertext || !iv || !authTag) {
        throw new BadRequestError('Required encrypted fields: ciphertext, iv, and authTag');
      }
      const replyId = reply_to_message_id || replyToMessageId || null;
      const message = await chatService.sendMessage(id, req.user.userId, ciphertext, iv, authTag, ratchetHeader, replyId);
      res.status(201).json({ success: true, data: { message } });
    } catch (err) {
      next(err);
    }
  }

  async editMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { ciphertext, iv, authTag, ratchetHeader } = req.body;
      if (!ciphertext || !iv || !authTag) {
        throw new BadRequestError('Required encrypted fields: ciphertext, iv, and authTag');
      }
      const message = await chatService.editMessage(req.user.userId, id, ciphertext, iv, authTag, ratchetHeader);
      res.json({ success: true, data: { message } });
    } catch (err) {
      next(err);
    }
  }

  async deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const message = await chatService.deleteMessage(req.user.userId, id);
      res.json({ success: true, data: { message } });
    } catch (err) {
      next(err);
    }
  }

  async forwardMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { targetConversationId, ciphertext, iv, authTag, ratchetHeader } = req.body;
      if (!targetConversationId) {
        throw new BadRequestError('targetConversationId is required');
      }
      const message = await chatService.forwardMessage(
        req.user.userId,
        id,
        targetConversationId,
        ciphertext,
        iv,
        authTag,
        ratchetHeader
      );
      res.status(201).json({ success: true, data: { message } });
    } catch (err) {
      next(err);
    }
  }

  async getClassConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
      const conversation = await chatService.getClassConversation(classId, req.user.userId);
      res.json({ success: true, data: { conversation } });
    } catch (err) {
      next(err);
    }
  }
}

export const chatController = new ChatController();

