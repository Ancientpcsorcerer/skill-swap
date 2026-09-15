import { Router } from 'express';
import { cryptoController } from './crypto.controller';
import { authenticateToken } from '../../middleware/auth';

export const cryptoRouter = Router();

cryptoRouter.post('/prekeys', authenticateToken, cryptoController.registerKeys.bind(cryptoController));
cryptoRouter.get('/prekey-bundle/:userId', authenticateToken, cryptoController.getPrekeyBundle.bind(cryptoController));
