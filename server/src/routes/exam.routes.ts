import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ExamController } from '../controllers/exam.controller';
import { validate } from '../middleware/validate.middleware';
import { bindController } from '../middleware/async.middleware';

const router = Router();
const exam = bindController(new ExamController());

router.get('/', authenticate, exam.getExams);
router.get('/history', authenticate, exam.getExamHistory);
router.get('/wrong-questions', authenticate, exam.getWrongQuestions);
router.get('/problems', authenticate, authorize('teacher', 'admin'), exam.getAvailableProblems);
router.get('/:id', authenticate, exam.getExamById);
router.get('/:id/analytics', authenticate, authorize('teacher', 'admin'), exam.getExamAnalytics);
router.get('/submission/:attemptId', authenticate, exam.getExamSubmissionDetail);
router.post('/:id/submit', authenticate,
  validate([
    body('answers').isArray({ min: 1 }).withMessage('答案列表不能为空'),
    body('answers.*.problem_id').isInt().withMessage('题目ID必须是整数'),
    body('answers.*.language').notEmpty().withMessage('语言不能为空'),
    body('answers.*.code').notEmpty().withMessage('代码不能为空')
  ]),
  exam.submitExam
);
router.post('/', authenticate, authorize('teacher', 'admin'),
  validate([
    body('title').trim().notEmpty().withMessage('考试标题不能为空'),
    body('description').trim().notEmpty().withMessage('考试描述不能为空'),
    body('duration').isInt({ min: 1 }).withMessage('考试时长必须大于0'),
    body('total_score').isInt({ min: 1 }).withMessage('总分必须大于0'),
    body('passing_score').isInt({ min: 0 }).withMessage('及格分数不能为负')
  ]),
  exam.createExam
);
router.put('/:id', authenticate, authorize('teacher', 'admin'), exam.updateExam);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), exam.deleteExam);

export default router;
