import { Router } from 'express';
import { mediaController } from './media.controller';
import { authenticateToken } from '../../middleware/auth';

export const mediaRouter = Router();

// Guarded media upload route
mediaRouter.post('/upload', authenticateToken, mediaController.upload.bind(mediaController));

// Guarded private media access gateway
mediaRouter.get('/access/:id', authenticateToken, mediaController.getAccess.bind(mediaController));
