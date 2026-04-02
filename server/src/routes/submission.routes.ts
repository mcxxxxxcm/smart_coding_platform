import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { SubmissionController } from '../controllers/submission.controller';

const router = Router();
const submissionController = new SubmissionController();

router.post('/', authenticate, submissionController.submit);
router.get('/:id', authenticate, submissionController.getSubmission);
router.get('/', authenticate, submissionController.getUserSubmissions);

export default router;
