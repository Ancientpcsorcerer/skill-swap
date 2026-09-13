import type { NavigationItem } from '../types/experience';

export const content = {
  title: 'Skill Swap',
  primaryAction: 'Get Started',
  signupTitle: 'Join Skill Swap',
  signupDescription: 'Create your profile and find people to build with.',
} as const;

// Add CEO-approved destinations here; do not invent routes or contact details.
export const navigation: readonly NavigationItem[] = [
  { label: 'About us' },
  { label: 'Contact' },
];
