import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ExamController } from '../controllers/exam.controller';

const router = Router();
const examController = new ExamController();

router.get('/', authenticate, examController.getExams);
router.get('/history', authenticate, examController.getExamHistory);
router.get('/wrong-questions', authenticate, examController.getWrongQuestions);
router.get('/problems', authenticate, authorize('teacher', 'admin'), examController.getAvailableProblems);
router.get('/:id', authenticate, examController.getExamById);
router.get('/:id/analytics', authenticate, authorize('teacher'), examController.getExamAnalytics);
router.get('/submission/:attemptId', authenticate, examController.getExamSubmissionDetail);
router.post('/:id/submit', authenticate, examController.submitExam);
router.post('/', authenticate, authorize('teacher', 'admin'), examController.createExam);
router.put('/:id', authenticate, authorize('teacher', 'admin'), examController.updateExam);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), examController.deleteExam);

export default router;
