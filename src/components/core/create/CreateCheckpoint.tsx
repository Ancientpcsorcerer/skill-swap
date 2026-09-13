import { createConfig } from './config';
import frames from 'virtual:core-frames/create';
import type { CheckpointProps } from '../shared/SequenceCheckpoint';
import type { CoreDefinition } from '../shared/sequence';

// Deliberately unavailable until the actual keycap sequence has been inspected.
// Current Create folders duplicate Connect. Never render them under a Create identity.
export const createDefinition: CoreDefinition = {
  ...createConfig, available: false,
  issue: frames.issue ?? 'Create artwork and CLICK TO ENTER keycap geometry await inspection.',
};
export function CreateCheckpoint(_props: CheckpointProps) { return null; }
