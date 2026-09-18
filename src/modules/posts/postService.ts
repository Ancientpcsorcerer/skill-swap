import { api } from '../../lib/api';
import type { Post, CreatePostInput } from './types';

const POST_UPDATE_EVENT = 'skill-swap:post-updated';

let inMemoryPosts: Post[] = [];
let hasFetchedPosts = false;
let isFetchingPosts = false;

async function fetchServerPosts(): Promise<Post[]> {
  if (isFetchingPosts) return inMemoryPosts;
  isFetchingPosts = true;
  try {
    const serverPosts = await api.posts.list();
    if (Array.isArray(serverPosts)) {
      inMemoryPosts = serverPosts.map((sp) => ({
        id: sp.id,
        authorId: sp.author_id,
        authorName: sp.author_name,
        authorUsername: sp.author_username,
        authorAvatarUrl: sp.author_avatar_url,
        title: sp.title,
        content: sp.content,
        tags: sp.tags || [],
        projectTag: sp.project_tag || undefined,
        art: sp.art || 'idea',
        imageUrls: sp.image_urls || [],
        videoUrls: sp.video_urls || [],
        repostCount: sp.repost_count || 0,
        hasReposted: Boolean(sp.has_reposted),
        repostId: sp.repost_id || null,
        repostedBy: sp.reposted_by
          ? {
              id: sp.reposted_by.id,
              name: sp.reposted_by.name,
              username: sp.reposted_by.username,
              avatarUrl: sp.reposted_by.avatar_url,
              createdAt: sp.reposted_by.created_at,
            }
          : null,
        createdAt: sp.created_at,
      }));
      hasFetchedPosts = true;
      window.dispatchEvent(new CustomEvent(POST_UPDATE_EVENT));
    }
  } catch (err) {
    console.error('Failed to fetch posts from backend:', err);
  } finally {
    isFetchingPosts = false;
  }
  return inMemoryPosts;
}


export const postService = {
  subscribe(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener(POST_UPDATE_EVENT, handler);
    return () => {
      window.removeEventListener(POST_UPDATE_EVENT, handler);
    };
  },

  getAllPosts(): Post[] {
    if (!hasFetchedPosts && !isFetchingPosts) {
      void fetchServerPosts();
    }
    return inMemoryPosts;
  },

  async refreshPosts(): Promise<Post[]> {
    return await fetchServerPosts();
  },

  getPostsByAuthor(authorId: string): Post[] {
    return this.getAllPosts().filter(
      (p) =>
        p.authorId === authorId ||
        p.authorUsername.toLowerCase() === authorId.toLowerCase()
    );
  },

  async createPost(
    author: { id: string; name: string; username: string; avatarUrl?: string | null },
    input: CreatePostInput
  ): Promise<Post> {
    const tags = [...(input.tags || [])];
    if (input.projectTag && !tags.includes(input.projectTag)) {
      tags.push(input.projectTag);
    }

    const imageUrls = input.imageUrls || [];
    const videoUrls = input.videoUrls || [];

    if (imageUrls.length > 7) {
      throw new Error('Limit exceeded: A post may contain at most 7 images.');
    }
    if (videoUrls.length > 2) {
      throw new Error('Limit exceeded: A post may contain at most 2 videos.');
    }

    // Save strictly to PostgreSQL via backend API
    const serverRecord = await api.posts.create({
      title: input.title.trim(),
      content: input.content.trim(),
      tags,
      project_tag: input.projectTag,
      art: input.art || 'idea',
      image_urls: imageUrls,
      video_urls: videoUrls,
    });

    if (!serverRecord || !serverRecord.id) {
      throw new Error('Backend failed to create and persist post.');
    }

    const createdPost: Post = {
      id: serverRecord.id,
      authorId: serverRecord.author_id || author.id,
      authorName: serverRecord.author_name || author.name,
      authorUsername: serverRecord.author_username || author.username,
      authorAvatarUrl: serverRecord.author_avatar_url || author.avatarUrl,
      title: serverRecord.title,
      content: serverRecord.content,
      tags: serverRecord.tags || tags,
      projectTag: serverRecord.project_tag || undefined,
      art: serverRecord.art || input.art || 'idea',
      imageUrls: serverRecord.image_urls || imageUrls,
      videoUrls: serverRecord.video_urls || videoUrls,
      createdAt: serverRecord.created_at || new Date().toISOString(),
    };

    inMemoryPosts = [createdPost, ...inMemoryPosts.filter((p) => p.id !== createdPost.id)];
    window.dispatchEvent(new CustomEvent(POST_UPDATE_EVENT));

    return createdPost;
  },

  async repostPost(postId: string): Promise<{ success: boolean; repostCount: number; hasReposted: boolean }> {
    const result = await api.posts.repost(postId);
    inMemoryPosts = inMemoryPosts.map((p) =>
      p.id === postId
        ? { ...p, repostCount: result.repostCount, hasReposted: true }
        : p
    );
    window.dispatchEvent(new CustomEvent(POST_UPDATE_EVENT));
    return result;
  },

  async unrepostPost(postId: string): Promise<{ success: boolean; repostCount: number; hasReposted: boolean }> {
    const result = await api.posts.unrepost(postId);
    inMemoryPosts = inMemoryPosts.map((p) =>
      p.id === postId
        ? { ...p, repostCount: result.repostCount, hasReposted: false }
        : p
    );
    window.dispatchEvent(new CustomEvent(POST_UPDATE_EVENT));
    return result;
  },
};

