import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { AIController } from '../controllers/ai.controller';

const router = Router();
const aiController = new AIController();

// All AI routes require authentication
router.use(authenticate);

router.post('/chat', aiController.chat);
router.post('/explain', aiController.explainCode);
router.post('/debug', aiController.debugCode);
router.post('/optimize', aiController.optimizeCode);
router.post('/hint', aiController.getHint);

export default router;
