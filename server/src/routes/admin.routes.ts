import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AdminController } from '../controllers/admin.controller';

const router = Router();
const adminController = new AdminController();

// All routes require authentication and admin role
router.use(authenticate, authorize('admin'));

// Stats
router.get('/stats', adminController.getSystemStats);
router.get('/roles', adminController.getRoles);

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Course review
router.get('/courses', adminController.getCoursesForReview);
router.put('/courses/:id/review', adminController.reviewCourse);

// Problem review
router.get('/problems', adminController.getProblemsForReview);
router.put('/problems/:id/review', adminController.reviewProblem);

// Community moderation
router.get('/community', adminController.getPostsForReview);
router.put('/community/:id', adminController.moderatePost);

// System settings
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// Security settings
router.get('/security', adminController.getSecuritySettings);
router.put('/security', adminController.updateSecuritySettings);

// Operation logs
router.get('/logs', adminController.getOperationLogs);

// Database maintenance
router.get('/database', adminController.getDatabaseStats);
router.post('/database/optimize', adminController.optimizeDatabase);

export default router;
