interface LearnModeSwitcherProps {
  activeMode: 'explore' | 'progress' | 'teaching';
  onSelectMode: (mode: 'explore' | 'progress' | 'teaching') => void;
  totalExplorePaths?: number;
  activeProgressCount?: number;
  pendingRequestCount?: number;
}

export function LearnModeSwitcher({
  activeMode,
  onSelectMode,
  activeProgressCount = 0,
  pendingRequestCount = 0,
}: LearnModeSwitcherProps) {
  return (
    <div className="learn-mode-bar">
      <div className="learn-segmented-tabs" role="tablist" aria-label="Learn navigation modes">
        <button
          type="button"
          id="tab-explore"
          role="tab"
          aria-selected={activeMode === 'explore'}
          aria-controls="panel-explore"
          className="learn-segmented-tab"
          onClick={() => onSelectMode('explore')}
        >
          Explore Skills
        </button>

        <button
          type="button"
          id="tab-progress"
          role="tab"
          aria-selected={activeMode === 'progress'}
          aria-controls="panel-progress"
          className="learn-segmented-tab"
          onClick={() => onSelectMode('progress')}
        >
          My Progress
          {activeProgressCount > 0 && (
            <span className="learn-counter-badge" aria-label={`${activeProgressCount} paths in progress`}>
              {activeProgressCount}
            </span>
          )}
        </button>

        <button
          type="button"
          id="tab-teaching"
          role="tab"
          aria-selected={activeMode === 'teaching'}
          aria-controls="panel-teaching"
          className="learn-segmented-tab"
          onClick={() => onSelectMode('teaching')}
        >
          Teaching Studio
          {pendingRequestCount > 0 && (
            <span className="learn-counter-badge" aria-label={`${pendingRequestCount} pending requests`}>
              {pendingRequestCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

