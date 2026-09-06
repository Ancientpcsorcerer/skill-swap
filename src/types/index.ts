// Core domain types — single source of truth

export type SkillCategory =
  | 'design'
  | 'code'
  | 'music'
  | 'cooking'
  | 'language'
  | 'movement'
  | 'writing'
  | 'craft';

export interface Skill {
  id: string;
  label: string;
  category: SkillCategory;
  blurb?: string;
}

export type TrustBand = 'new' | 'established' | 'trusted';

export interface Profile {
  id: string;
  name: string;
  initials: string;
  hue: number; // 0–360, deterministic accent
  location: string;
  timezone: string;
  bio: string;
  teaches: string[]; // skill ids
  learns: string[]; // skill ids
  hoursGiven: number;
  hoursReceived: number;
  trust: TrustBand;
  joinedAt: string; // ISO
  nextAvailable?: string; // ISO
}

export interface Trade {
  id: string;
  fromId: string;
  toId: string;
  skillId: string;
  hours: number;
  timestamp: string; // ISO
  blurb: string;
}

export type RelationStatus = 'proposed' | 'accepted' | 'completed' | 'declined';

export interface Relation {
  id: string;
  fromId: string;
  toId: string;
  status: RelationStatus;
  proposedAt: string;
  scheduledFor?: string;
  hoursOffered: number;
  hoursWanted: number;
  skillOffered: string;
  skillWanted: string;
  message?: string;
}

export interface GraphNode {
  profileId: string;
  position: [number, number, number];
  size: number;
  focus?: number;            // 0–1, brighter for "protagonist" nodes
}

export interface GraphEdge {
  from: string; // profileId
  to: string; // profileId
  type: 'exchange' | 'wants-to-learn' | 'could-teach';
}

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  design: 'Design',
  code: 'Code',
  music: 'Music',
  cooking: 'Cooking',
  language: 'Language',
  movement: 'Movement',
  writing: 'Writing',
  craft: 'Craft',
};
