import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ProblemController } from '../controllers/problem.controller';

const router = Router();
const problemController = new ProblemController();

router.get('/', problemController.getProblems);
router.get('/:id', problemController.getProblemById);
router.post('/', authenticate, authorize('teacher', 'admin'), problemController.createProblem);
router.put('/:id', authenticate, authorize('teacher', 'admin'), problemController.updateProblem);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), problemController.deleteProblem);

export default router;
