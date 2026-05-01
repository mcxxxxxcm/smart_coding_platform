import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, optionalAuth, authorize } from '../middleware/auth.middleware';
import { ProblemController } from '../controllers/problem.controller';
import { validate } from '../middleware/validate.middleware';
import { bindController } from '../middleware/async.middleware';

const router = Router();
const problem = bindController(new ProblemController());

router.get('/', optionalAuth, problem.getProblems);
router.get('/:id', optionalAuth, problem.getProblemById);
router.post('/', authenticate, authorize('teacher', 'admin'),
  validate([
    body('title').trim().notEmpty().withMessage('题目标题不能为空'),
    body('description').trim().notEmpty().withMessage('题目描述不能为空'),
    body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('无效的难度等级'),
    body('time_limit').optional().isInt({ min: 100 }).withMessage('时间限制最小100ms'),
    body('memory_limit').optional().isInt({ min: 16 }).withMessage('内存限制最小16MB')
  ]),
  problem.createProblem
);
router.put('/:id', authenticate, authorize('teacher', 'admin'), problem.updateProblem);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), problem.deleteProblem);

export default router;
