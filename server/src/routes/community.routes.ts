import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { CommunityController } from '../controllers/community.controller';

const router = Router();
const communityController = new CommunityController();

router.get('/posts', communityController.getPosts);
router.get('/posts/:id', communityController.getPostById);
router.post('/posts', authenticate, communityController.createPost);
router.put('/posts/:id', authenticate, communityController.updatePost);
router.delete('/posts/:id', authenticate, communityController.deletePost);
router.post('/posts/:id/like', authenticate, communityController.likePost);
router.patch('/posts/:id/pin', authenticate, communityController.togglePinPost);

router.get('/posts/:postId/comments', communityController.getComments);
router.post('/posts/:postId/comments', authenticate, communityController.createComment);
router.delete('/comments/:id', authenticate, communityController.deleteComment);
router.post('/comments/:id/like', authenticate, communityController.likeComment);
router.patch('/comments/:id/pin', authenticate, communityController.togglePinComment);

export default router;
