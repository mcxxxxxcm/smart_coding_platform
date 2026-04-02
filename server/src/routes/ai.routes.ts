import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { AIController } from '../controllers/ai.controller';

const router = Router();
const aiController = new AIController();

router.post('/chat', authenticate, aiController.chat);
router.post('/explain', authenticate, aiController.explainCode);
router.post('/debug', authenticate, aiController.debugCode);
router.post('/optimize', authenticate, aiController.optimizeCode);
router.post('/hint', authenticate, aiController.getHint);

export default router;
