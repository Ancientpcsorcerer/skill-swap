interface LearnModeSwitcherProps {
  activeMode: 'explore' | 'progress';
  onSelectMode: (mode: 'explore' | 'progress') => void;
  totalExplorePaths?: number;
  activeProgressCount?: number;
}

export function LearnModeSwitcher({
  activeMode,
  onSelectMode,
  activeProgressCount = 0,
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
      </div>
    </div>
  );
}


