import { communityRepository } from '../repositories/community.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middleware/error.middleware';

export class CommunityService {
  async getPosts(params: { page: number; limit: number; category?: string; search?: string }) {
    return communityRepository.listPosts(params);
  }

  async getPostById(id: number | string) {
    const post = await communityRepository.findPostById(id);
    if (!post) throw new AppError('帖子不存在', 404);
    await communityRepository.incrementViewCount(id);
    return post;
  }

  async createPost(data: { title: string; content: string; author_id: number; category: string; tags?: any }) {
    if (!data.title || !data.content) {
      throw new AppError('标题和内容不能为空', 400);
    }

    const postId = await communityRepository.createPost({ ...data, tags: data.tags || [] });
    await userRepository.addExperience(data.author_id, 5, 2);
    return { id: postId };
  }

  async updatePost(id: number | string, userId: number, userRole: string, data: Record<string, any>) {
    const authorId = await communityRepository.getPostAuthorId(id);
    if (!authorId) throw new AppError('帖子不存在', 404);

    if (userRole !== 'admin' && userRole !== 'teacher' && authorId !== userId) {
      throw new AppError('无权修改该帖子', 403);
    }

    await communityRepository.updatePost(id, data);
  }

  async deletePost(id: number | string, userId: number, userRole: string) {
    const authorId = await communityRepository.getPostAuthorId(id);
    if (!authorId) throw new AppError('帖子不存在', 404);

    if (userRole !== 'admin' && authorId !== userId) {
      throw new AppError('无权删除该帖子', 403);
    }

    await communityRepository.deletePost(id);
  }

  async likePost(postId: number | string, userId: number) {
    const post = await communityRepository.findPostById(postId);
    if (!post) throw new AppError('帖子不存在', 404);
    const liked = await communityRepository.togglePostLike(postId, userId);
    return { liked };
  }

  async togglePinPost(postId: number | string, userId: number, userRole: string) {
    if (userRole !== 'admin' && userRole !== 'teacher') {
      throw new AppError('无权置顶帖子', 403);
    }
    const isPinned = await communityRepository.togglePinPost(postId);
    if (isPinned === null) throw new AppError('帖子不存在', 404);
    return { is_pinned: isPinned };
  }

  async getComments(postId: number | string, page: number, limit: number) {
    return communityRepository.getComments(postId, page, limit);
  }

  async createComment(data: { post_id: number | string; user_id: number; parent_id: number | null; content: string }) {
    if (!data.content) throw new AppError('评论内容不能为空', 400);
    const commentId = await communityRepository.createComment(data);
    await userRepository.addExperience(data.user_id, 2, 1);
    return { id: commentId };
  }

  async deleteComment(commentId: number | string, userId: number, userRole: string) {
    const result = await communityRepository.deleteComment(commentId);
    if (!result) throw new AppError('评论不存在', 404);

    if (userRole !== 'admin' && result.userId !== userId) {
      throw new AppError('无权删除该评论', 403);
    }
  }

  async likeComment(commentId: number | string, userId: number) {
    const liked = await communityRepository.toggleCommentLike(commentId, userId);
    return { liked };
  }

  async togglePinComment(commentId: number | string, userId: number, userRole: string) {
    if (userRole !== 'admin' && userRole !== 'teacher') {
      throw new AppError('无权置顶评论', 403);
    }
    const isPinned = await communityRepository.togglePinComment(commentId);
    if (isPinned === null) throw new AppError('评论不存在', 404);
    return { is_pinned: isPinned };
  }
}

export const communityService = new CommunityService();
