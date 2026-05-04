import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
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

router.get('/learning-path', ai.getLearningPath);
router.get('/wrong-analysis', ai.analyzeWrongAnswers);
router.post('/generate-problem', ai.generateProblem);
router.post('/smart-search', ai.smartSearch);
router.post('/moderate', ai.moderateContent);
router.get('/student-dashboard', ai.getStudentDashboard);

router.get('/operations-analytics', authorize('admin'), ai.getOperationsAnalytics);
router.get('/problem-quality/batch', authorize('admin', 'teacher'), ai.batchCheckProblemQuality);
router.get('/problem-quality/:id', authorize('admin', 'teacher'), ai.checkProblemQuality);

export default router;
