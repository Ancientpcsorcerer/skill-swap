import { Router } from 'express';
import { learningController } from '../modules/learning/learning.controller';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  updateLearningRecordSchema,
  addLearningGoalSchema,
} from '../modules/learning/learning.validation';

export const learningRouter = Router();

learningRouter.use(authenticateToken);

learningRouter.get('/', learningController.getLearningState.bind(learningController));

learningRouter.put(
  '/records/:pathId',
  validate({ body: updateLearningRecordSchema }),
  learningController.updateRecord.bind(learningController)
);

learningRouter.post(
  '/goals',
  validate({ body: addLearningGoalSchema }),
  learningController.addGoal.bind(learningController)
);

learningRouter.delete(
  '/goals/:id',
  learningController.deleteGoal.bind(learningController)
);
