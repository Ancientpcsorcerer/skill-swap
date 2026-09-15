import { Request, Response, NextFunction } from 'express';
import { mediaService } from './media.service';
import { BadRequestError, UnauthorizedError } from '../../utils/errors';

export class MediaController {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required to upload media');
      }

      const { filename, mimeType, base64Data, isPrivate, projectId } = req.body;

      if (!filename || !mimeType || !base64Data) {
        throw new BadRequestError('Required fields: filename, mimeType, and base64Data');
      }

      // Strip data:image/...;base64, prefix if present
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      // Determine base URL from host or request protocol
      const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3001';
      const baseUrl = `${proto}://${host}`;

      const media = await mediaService.processUpload(
        req.user.userId,
        buffer,
        filename,
        mimeType,
        baseUrl,
        Boolean(isPrivate),
        projectId
      );

      res.status(201).json({
        success: true,
        data: { media },
      });
    } catch (err) {
      next(err);
    }
  }

  async getAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { filePath, mimeType } = await mediaService.getMediaFile(id, req.user?.userId);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Content-Type', mimeType);
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }
}

export const mediaController = new MediaController();
