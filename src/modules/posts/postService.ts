import { api } from '../../lib/api';
import type { Post, CreatePostInput } from './types';

const POSTS_CACHE_KEY = 'skill-swap.posts.v1';
const POST_UPDATE_EVENT = 'skill-swap:post-updated';

// Sample platform posts from known creators to seed the ecosystem alongside live posts
const initialSamplePosts: Post[] = [
  {
    id: 'post-sample-1',
    authorId: 'aarav',
    authorName: 'Aarav Patel',
    authorUsername: 'aarav',
    title: 'Testing our 3D-printed bionic tendon mechanism',
    content: 'Just finished the 5th iteration of the tendon actuation system for the Modular Robotic Hand. Reduced latency by 40ms using lightweight braided nylon cables. Looking for feedback from anyone with embedded C experience on ESP32!',
    tags: ['Robotics', 'Hardware', 'Prototyping'],
    projectTag: 'Modular Robotic Hand',
    art: 'product',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'post-sample-2',
    authorId: 'ishita',
    authorName: 'Ishita Sharma',
    authorUsername: 'ishita',
    title: 'Design principles for decentralized collaboration',
    content: 'Writing a short manifesto on how minimal friction and high trust create lasting open-source teams. Would love to swap notes with product designers and community organizers.',
    tags: ['Design', 'Open Source', 'Collaboration'],
    projectTag: 'Decentralized Identity UI',
    art: 'idea',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'post-sample-3',
    authorId: 'rohan',
    authorName: 'Rohan Verma',
    authorUsername: 'rohan',
    title: 'Deploying our off-grid solar telemetry monitor',
    content: 'First field test complete in a remote village near Pune. Sensors captured 14 days of battery cycle data without packet drops over LoRaWAN. Open-sourcing the schematic next week!',
    tags: ['CleanTech', 'IoT', 'Electronics'],
    projectTag: 'Smart Microgrid Monitor',
    art: 'event',
    createdAt: new Date(Date.now() - 3600000 * 32).toISOString(),
  },
  {
    id: 'post-sample-4',
    authorId: 'kavya',
    authorName: 'Kavya Nair',
    authorUsername: 'kavya',
    title: 'Why learning through building beats passive tutorials',
    content: 'Every great skill I have picked up—from neural network optimization to audio DSP—came from attempting a broken project with someone smarter than me. That is the whole spirit of Skill Swap.',
    tags: ['Learning', 'Philosophy', 'Skills'],
    art: 'idea',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

function loadLocalPosts(): Post[] {
  try {
    const raw = localStorage.getItem(POSTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // ignore parse error
  }
  return [];
}

function saveLocalPosts(posts: Post[]): void {
  try {
    localStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(posts));
    window.dispatchEvent(new CustomEvent(POST_UPDATE_EVENT));
  } catch {
    // ignore
  }
}

let cachedPostsRaw: string | null = null;
let cachedAllPosts: Post[] = [];

export const postService = {
  subscribe(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener(POST_UPDATE_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(POST_UPDATE_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  },

  getAllPosts(): Post[] {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(POSTS_CACHE_KEY);
    } catch {
      // ignore
    }

    if (raw === cachedPostsRaw && cachedAllPosts.length > 0) {
      return cachedAllPosts;
    }

    cachedPostsRaw = raw;
    const local = loadLocalPosts();
    const all = [...local];
    for (const sample of initialSamplePosts) {
      if (!all.some((p) => p.id === sample.id)) {
        all.push(sample);
      }
    }
    cachedAllPosts = all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Asynchronously fetch live posts from PostgreSQL backend
    api.posts.list().then((serverPosts) => {
      if (serverPosts && serverPosts.length > 0) {
        const merged = [...cachedAllPosts];
        for (const sp of serverPosts) {
          const mapped: Post = {
            id: sp.id,
            authorId: sp.author_id,
            authorName: sp.author_name,
            authorUsername: sp.author_username,
            authorAvatarUrl: sp.author_avatar_url,
            title: sp.title,
            content: sp.content,
            tags: sp.tags,
            projectTag: sp.project_tag || undefined,
            art: sp.art,
            imageUrls: sp.image_urls,
            videoUrls: sp.video_urls,
            createdAt: sp.created_at,
          };
          if (!merged.some((p) => p.id === mapped.id)) {
            merged.push(mapped);
          }
        }
        cachedAllPosts = merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        window.dispatchEvent(new CustomEvent(POST_UPDATE_EVENT));
      }
    }).catch(() => {});

    return cachedAllPosts;
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
    const now = new Date().toISOString();
    const tags = [...(input.tags || [])];
    if (input.projectTag && !tags.includes(input.projectTag)) {
      tags.push(input.projectTag);
    }

    let createdPost: Post = {
      id: crypto.randomUUID(),
      authorId: author.id,
      authorName: author.name,
      authorUsername: author.username,
      authorAvatarUrl: author.avatarUrl,
      title: input.title.trim(),
      content: input.content.trim(),
      tags,
      projectTag: input.projectTag,
      art: input.art || 'idea',
      imageUrls: input.imageUrls || [],
      videoUrls: input.videoUrls || [],
      createdAt: now,
    };

    // Save to PostgreSQL via apiClient
    try {
      const serverRecord = await api.posts.create({
        title: createdPost.title,
        content: createdPost.content,
        tags: createdPost.tags,
        project_tag: createdPost.projectTag,
        art: createdPost.art,
        image_urls: createdPost.imageUrls,
        video_urls: createdPost.videoUrls,
      });

      if (serverRecord) {
        createdPost = {
          id: serverRecord.id,
          authorId: serverRecord.author_id,
          authorName: serverRecord.author_name,
          authorUsername: serverRecord.author_username,
          authorAvatarUrl: serverRecord.author_avatar_url,
          title: serverRecord.title,
          content: serverRecord.content,
          tags: serverRecord.tags,
          projectTag: serverRecord.project_tag || undefined,
          art: serverRecord.art,
          imageUrls: serverRecord.image_urls,
          videoUrls: serverRecord.video_urls,
          createdAt: serverRecord.created_at,
        };
      }
    } catch (err) {
      console.warn('Backend post creation failed, falling back to local:', err);
    }

    // Save locally
    const current = loadLocalPosts();
    saveLocalPosts([createdPost, ...current]);
    cachedAllPosts = [createdPost, ...cachedAllPosts];
    window.dispatchEvent(new CustomEvent(POST_UPDATE_EVENT));

    return createdPost;
  },
};
