export type CoreCheckpointId = 'connect' | 'create' | 'learn' | 'discover';
export type CoreStartState = 'CONNECT_CHECKPOINT_START' | 'CREATE_CHECKPOINT_START'
  | 'LEARN_CHECKPOINT_START' | 'DISCOVER_CHECKPOINT_START';
export type PostZoomPhase = 'FRAME_ZOOM' | 'POST_ZOOM_LIGHT' | 'CONNECT_REVEAL' | 'CONNECT_CHECKPOINT_START';

export interface PostZoomSnapshot {
  phase: PostZoomPhase;
  revealProgress: number;
}

export interface CoreCheckpointBoundary {
  id: CoreCheckpointId;
  startState: CoreStartState;
  next: CoreCheckpointId | null;
  // A null animation range keeps an unauthored checkpoint inactive.
  animationRange: { start: number; end: number } | null;
}
