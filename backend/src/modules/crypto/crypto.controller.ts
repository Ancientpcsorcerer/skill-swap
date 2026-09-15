import { Request, Response, NextFunction } from 'express';
import { cryptoService } from './crypto.service';
import { BadRequestError, UnauthorizedError } from '../../utils/errors';

export class CryptoController {
  async registerKeys(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      await cryptoService.registerKeys(req.user.userId, req.body);
      res.status(200).json({ success: true, message: 'Keys registered successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getPrekeyBundle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      if (!userId) throw new BadRequestError('userId is required');
      const bundle = await cryptoService.getPrekeyBundle(userId);
      res.json({ success: true, data: { bundle } });
    } catch (err) {
      next(err);
    }
  }
}

export const cryptoController = new CryptoController();
