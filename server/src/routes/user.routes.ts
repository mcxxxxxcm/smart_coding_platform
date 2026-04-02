import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { UserController } from '../controllers/user.controller';

const router = Router();
const userController = new UserController();

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/password', authenticate, userController.changePassword);
router.get('/progress', authenticate, userController.getProgress);
router.get('/submissions', authenticate, userController.getSubmissions);
router.get('/:id', userController.getUserById);

export default router;
