import { discoverConfig } from './config';
import frames from 'virtual:core-frames/discover';
import { SequenceCheckpoint, type CheckpointProps } from '../shared/SequenceCheckpoint';
import type { CoreDefinition } from '../shared/sequence';

export const discoverDefinition: CoreDefinition = {
  ...discoverConfig,
  available: frames.valid, issue: frames.issue,
};
export function DiscoverCheckpoint(props: CheckpointProps) {
  return <SequenceCheckpoint {...props} frames={frames} description="Discover: lettering within a dimensional architectural environment" />;
}
