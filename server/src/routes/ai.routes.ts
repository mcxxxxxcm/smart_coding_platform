import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { AIController } from '../controllers/ai.controller';
import { validate } from '../middleware/validate.middleware';
import { bindController } from '../middleware/async.middleware';

const router = Router();
const ai = bindController(new AIController());

router.use(authenticate);

router.post('/chat',
  validate([
    body('message').trim().notEmpty().withMessage('消息不能为空')
  ]),
  ai.chat
);
router.post('/explain',
  validate([
    body('code').trim().notEmpty().withMessage('代码不能为空')
  ]),
  ai.explainCode
);
router.post('/debug',
  validate([
    body('code').trim().notEmpty().withMessage('代码不能为空')
  ]),
  ai.debugCode
);
router.post('/optimize',
  validate([
    body('code').trim().notEmpty().withMessage('代码不能为空')
  ]),
  ai.optimizeCode
);
router.post('/hint',
  validate([
    body('problemId').isInt().withMessage('题目ID必须是整数')
  ]),
  ai.getHint
);

export default router;
