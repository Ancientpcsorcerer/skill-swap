import { CONNECT_SCROLL_VIEWPORTS } from './connect/config';
import { createConfig } from './create/config';
import { learnConfig } from './learn/config';
import { discoverConfig } from './discover/config';
import { layoutCores } from './shared/sequence';

// Each checkpoint supplies its own duration. Offsets are only scroll bookkeeping.
export const plannedCoreRanges = layoutCores([
  { id: 'connect', label: 'Connect', scrollViewports: CONNECT_SCROLL_VIEWPORTS, holdViewports: 0, available: true },
  createConfig, learnConfig, discoverConfig,
]);
