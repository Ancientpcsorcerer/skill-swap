import { learnConfig } from './config';
import frames from 'virtual:core-frames/learn';
import { SequenceCheckpoint, type CheckpointProps } from '../shared/SequenceCheckpoint';
import type { CoreDefinition } from '../shared/sequence';

export const learnDefinition: CoreDefinition = {
  ...learnConfig,
  available: frames.valid, issue: frames.issue,
};
export function LearnCheckpoint(props: CheckpointProps) {
  return <SequenceCheckpoint {...props} frames={frames} description="Learn: plants and dimensional lettering among architectural panels" />;
}
