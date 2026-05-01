import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { SubmissionController } from '../controllers/submission.controller';
import { validate } from '../middleware/validate.middleware';
import { bindController } from '../middleware/async.middleware';

const router = Router();
const submission = bindController(new SubmissionController());

router.post('/', authenticate,
  validate([
    body('problem_id').isInt().withMessage('题目ID必须是整数'),
    body('language').isIn(['python', 'cpp', 'c', 'c++']).withMessage('不支持的语言'),
    body('code').trim().notEmpty().withMessage('代码不能为空')
  ]),
  submission.submit
);
router.get('/:id', authenticate, submission.getSubmission);
router.get('/', authenticate, submission.getUserSubmissions);

export default router;
