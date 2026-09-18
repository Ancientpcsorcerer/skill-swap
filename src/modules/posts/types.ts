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
  likeCount?: number;
  hasLiked?: boolean;
  commentCount?: number;
  repostCount?: number;
  hasReposted?: boolean;
  hasSaved?: boolean;
  repostId?: string | null;
  repostedBy?: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
    createdAt: string;
  } | null;
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
