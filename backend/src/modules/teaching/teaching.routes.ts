import { Router } from 'express';
import { teachingController } from './teaching.controller';
import { authenticateToken, optionalAuth } from '../../middleware/auth';

export const teachingRouter = Router();

// Profile
teachingRouter.get('/profile', authenticateToken, teachingController.getProfile.bind(teachingController));
teachingRouter.put('/profile', authenticateToken, teachingController.updateProfile.bind(teachingController));

// Directory of teachers
teachingRouter.get('/teachers', optionalAuth, teachingController.listTeachers.bind(teachingController));

// Requests
teachingRouter.get('/requests', authenticateToken, teachingController.listRequests.bind(teachingController));
teachingRouter.post('/requests', authenticateToken, teachingController.createRequest.bind(teachingController));
teachingRouter.post('/requests/:id/accept', authenticateToken, teachingController.acceptRequest.bind(teachingController));
teachingRouter.post('/requests/:id/decline', authenticateToken, teachingController.declineRequest.bind(teachingController));

// Students
teachingRouter.get('/students', authenticateToken, teachingController.listStudents.bind(teachingController));

// Classes
teachingRouter.get('/classes', optionalAuth, teachingController.listClasses.bind(teachingController));
teachingRouter.post('/classes', authenticateToken, teachingController.createClass.bind(teachingController));
teachingRouter.post('/classes/:id/join', authenticateToken, teachingController.joinClass.bind(teachingController));
teachingRouter.post('/classes/:id/leave', authenticateToken, teachingController.leaveClass.bind(teachingController));

// Sessions
teachingRouter.get('/sessions', optionalAuth, teachingController.listSessions.bind(teachingController));
teachingRouter.post('/sessions', authenticateToken, teachingController.createSession.bind(teachingController));
teachingRouter.put('/sessions/:id', authenticateToken, teachingController.updateSession.bind(teachingController));
teachingRouter.post('/sessions/:id/cancel', authenticateToken, teachingController.cancelSession.bind(teachingController));
teachingRouter.delete('/sessions/:id', authenticateToken, teachingController.cancelSession.bind(teachingController));

// Zoom Integration
teachingRouter.get('/zoom/status', authenticateToken, teachingController.getZoomStatus.bind(teachingController));
teachingRouter.get('/zoom/authorize', authenticateToken, teachingController.getZoomAuthorizeUrl.bind(teachingController));
teachingRouter.get('/zoom/callback', teachingController.handleZoomCallback.bind(teachingController));
teachingRouter.post('/zoom/disconnect', authenticateToken, teachingController.disconnectZoom.bind(teachingController));
