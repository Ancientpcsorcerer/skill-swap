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
  repost_count?: number;
  has_reposted?: boolean;
  repost_id?: string | null;
  reposted_by?: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    created_at: string;
  } | null;
  created_at: string;
  updated_at: string;
}
export interface LearningPath { id: string; title: string; description: string; category: string; topics: string[]; art: string; mentorIds: string[]; resources: number }
export interface Community { id: string; name: string; description: string; category: string; members: string; art: string }
export interface Activity { id: string; title: string; description: string; kind: 'project' | 'learning' | 'profile' }
export interface LearningRecord { pathId: string; status: 'In Progress' | 'Saved' | 'Completed'; progress: number }
export interface ExplorationItem { id: string; kind: 'Ideas' | 'Events'; title: string; description: string; tags: string[]; art: string }

export interface TeachingProfile {
  user_id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  headline: string;
  bio: string;
  hourly_rate: string;
  status: 'available' | 'busy' | 'paused';
  availability_slots: Array<{ day: string; time: string }>;
  skills: string[];
}

export interface TeachingRequest {
  id: string;
  student_id: string;
  student_name: string;
  student_username: string;
  student_avatar_url: string | null;
  teacher_id: string;
  teacher_name: string;
  teacher_username: string;
  teacher_avatar_url: string | null;
  skill: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ClassItem {
  id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_username: string;
  teacher_avatar_url: string | null;
  title: string;
  description: string;
  skill: string;
  schedule: string;
  meeting_url: string | null;
  max_students: number;
  member_count: number;
  is_enrolled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentItem {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  relationship_type: 'direct' | 'class';
  skill: string;
  connected_at: string;
}

export interface ClassSession {
  id: string;
  class_id: string | null;
  class_title: string | null;
  teacher_id: string;
  teacher_name: string;
  teacher_avatar_url: string | null;
  student_id: string | null;
  student_name: string | null;
  track_id: string | null;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
}

