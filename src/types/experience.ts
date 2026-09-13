export type AuthState = 'guest' | 'authenticated';
export type ExperienceState = 'landing' | 'frame-transition' | 'post-zoom-light' | 'connect-reveal' | 'core';

export interface ExperienceSnapshot {
  frameProgress: number;
  transitionProgress: number;
  connectProgress: number;
  connectDirection: 'forward' | 'reverse';
  experience: ExperienceState;
}

export interface NavigationItem {
  label: string;
  href?: string;
}



