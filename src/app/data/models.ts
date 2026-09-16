export type Skill = string;
export type Interest = string;
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  location: string;
  skills: Skill[];
  interests: Interest[];
  projectInterests: string[];
  avatarUrl?: string | null;
  avatar_url?: string | null;
}
export interface Project {
  id: string;
  title: string;
  description: string;
  vision: string;
  type: string;
  requiredSkills: Skill[];
  creatorId: string;
  collaboratorIds: string[];
  status: 'Ongoing' | 'Completed' | 'Draft';
  art: string;
  tags: string[];
  members: number;
  rating?: number;
  files: { name: string; size: number }[];
  visibility?: 'public' | 'private';
  coverImageUrl?: string;
  cover_image_url?: string;
  recreated_from_id?: string | null;
  is_following?: boolean;
  imageUrls?: string[];
  videoUrls?: string[];
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_avatar_url: string | null;
  title: string;
  body: string;
  image_urls: string[];
  video_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface PostItem {
  id: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_avatar_url: string | null;
  title: string;
  content: string;
  tags: string[];
  project_tag: string | null;
  art: string;
  image_urls: string[];
  video_urls: string[];
  created_at: string;
  updated_at: string;
}
export interface LearningPath { id: string; title: string; description: string; category: string; topics: string[]; art: string; mentorIds: string[]; resources: number }
export interface Community { id: string; name: string; description: string; category: string; members: string; art: string }
export interface Activity { id: string; title: string; description: string; kind: 'project' | 'learning' | 'profile' }
export interface LearningRecord { pathId: string; status: 'In Progress' | 'Saved' | 'Completed'; progress: number }
export interface ExplorationItem { id: string; kind: 'Ideas' | 'Events'; title: string; description: string; tags: string[]; art: string }
