export type Skill = string;
export type Interest = string;
export interface User { id: string; name: string; username: string; email: string; bio: string; location: string; skills: Skill[]; interests: Interest[]; projectInterests: string[] }
export interface Project { id: string; title: string; description: string; vision: string; type: string; requiredSkills: Skill[]; creatorId: string; collaboratorIds: string[]; status: 'Ongoing' | 'Completed' | 'Draft'; art: string; tags: string[]; members: number; rating?: number; files: { name: string; size: number }[] }
export interface LearningPath { id: string; title: string; description: string; category: string; topics: string[]; art: string; mentorIds: string[]; resources: number }
export interface Community { id: string; name: string; description: string; category: string; members: string; art: string }
export interface Activity { id: string; title: string; description: string; kind: 'project' | 'learning' | 'profile' }
export interface LearningRecord { pathId: string; status: 'In Progress' | 'Saved' | 'Completed'; progress: number }
export interface ExplorationItem { id: string; kind: 'Ideas' | 'Events'; title: string; description: string; tags: string[]; art: string }
