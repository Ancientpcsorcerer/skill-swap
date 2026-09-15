export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl?: string | null;
  title: string;
  content: string;
  tags: string[];
  projectTag?: string;
  art: string;
  imageUrls?: string[];
  videoUrls?: string[];
  createdAt: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  tags?: string[];
  projectTag?: string;
  art?: string;
  imageUrls?: string[];
  videoUrls?: string[];
}
