import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { CommunityController } from '../controllers/community.controller';
import { validate } from '../middleware/validate.middleware';
import { bindController } from '../middleware/async.middleware';

const router = Router();
const community = bindController(new CommunityController());

router.get('/posts', community.getPosts);
router.get('/posts/:id', community.getPostById);
router.post('/posts', authenticate,
  validate([
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('标题长度1-200个字符'),
    body('content').trim().notEmpty().withMessage('内容不能为空'),
    body('category').isIn(['question', 'article', 'discussion']).withMessage('无效的分类')
  ]),
  community.createPost
);
router.put('/posts/:id', authenticate, community.updatePost);
router.delete('/posts/:id', authenticate, community.deletePost);
router.post('/posts/:id/like', authenticate, community.likePost);
router.patch('/posts/:id/pin', authenticate, community.togglePinPost);

router.get('/posts/:postId/comments', community.getComments);
router.post('/posts/:postId/comments', authenticate,
  validate([
    body('content').trim().notEmpty().withMessage('评论内容不能为空')
  ]),
  community.createComment
);
router.delete('/comments/:id', authenticate, community.deleteComment);
router.post('/comments/:id/like', authenticate, community.likeComment);
router.patch('/comments/:id/pin', authenticate, community.togglePinComment);

export default router;
