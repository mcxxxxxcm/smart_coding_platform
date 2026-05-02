import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { bindController } from '../middleware/async.middleware';
import { LessonCommentController } from '../controllers/lesson-comment.controller';

const router = Router();
const ctrl = bindController(new LessonCommentController());

router.get('/lessons/:lessonId/comments', ctrl.getComments);

router.post('/lessons/:lessonId/comments',
  authenticate,
  validate([
    body('content').trim().notEmpty().withMessage('评论内容不能为空')
  ]),
  ctrl.createComment
);

router.delete('/lesson-comments/:id',
  authenticate,
  ctrl.deleteComment
);

router.post('/lesson-comments/:id/like',
  authenticate,
  ctrl.likeComment
);

router.get('/teacher/analytics',
  authenticate,
  ctrl.getTeacherAnalytics
);

router.post('/teacher/ai-insight',
  authenticate,
  ctrl.getAiInsight
);

export default router;
