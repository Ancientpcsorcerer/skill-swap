import type { ModuleId } from '../navigation';
export type IconName = ModuleId | 'chevron' | 'filter' | 'more' | 'arrow' | 'close' | 'template' | 'bulb' | 'pencil' | 'gear';
const paths: Record<IconName, string> = {
  profile: 'M8 6a4 4 0 1 0 8 0a4 4 0 1 0-8 0M3 22c0-9 18-9 18 0',
  connect: 'M6 7a3 3 0 1 0 6 0a3 3 0 1 0-6 0M15 5a3 3 0 0 1 0 6M2 22v-2c0-7 14-7 14 0v2M17 15c4 0 5 3 5 7',
  create: 'M12 2v20M2 12h20', learn: 'M12 5C8 2 4 2 2 4v17c4-2 7-2 10 0c3-2 6-2 10 0V4c-2-2-6-2-10 1v16',
  discover: 'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20M16 8l-3 6-5 2 3-6z',
  chevron: 'm6 9 6 6 6-6', filter: 'M3 6h18M3 12h18M3 18h18M8 3v6M16 9v6M10 15v6',
  more: 'M4 12h.01M12 12h.01M20 12h.01', arrow: 'M3 12h18m-6-6 6 6-6 6', close: 'm5 5 14 14M19 5 5 19',
  pencil: 'm4 16-1 5 5-1L21 7l-4-4zm10-10 4 4', gear: 'm9 2 6 0 1 3 3 1 3 3-2 3 2 3-3 3-3 1-1 3H9l-1-3-3-1-3-3 2-3-2-3 3-3 3-1zM8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
  template: 'm8 5-6 7 6 7M16 5l6 7-6 7M14 2l-4 20', bulb: 'M8 16c-9-9 1-19 8-12 5 6-1 10-1 12v4H9v-4M9 23h6',
};
export function Icon({ name }: { name: IconName }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={name === 'more' ? 3 : 1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>; }
