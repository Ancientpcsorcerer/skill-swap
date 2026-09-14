import { Icon } from '../../app/components/Icon';

interface LearnHeroProps {
  activeMode: 'explore' | 'progress';
  onSelectMode: (mode: 'explore' | 'progress') => void;
  activeCount: number;
}

export function LearnHero({ activeMode, onSelectMode, activeCount }: LearnHeroProps) {
  return (
    <header className="learn-hero">
      <div className="learn-hero-badge">Learn Core &middot; Two-Path Craft</div>
      <h1 className="learn-hero-title">
        Learn from people.
        <br />
        Build skills through human collaboration.
      </h1>
      <p className="learn-hero-desc">
        Find what to learn, connect with experienced mentors, and cultivate real-world craft through authentic human exchange.
      </p>
      <div className="learn-hero-actions">
        <button
          type="button"
          className={`learn-branch-btn ${activeMode === 'explore' ? 'active' : ''}`}
          aria-pressed={activeMode === 'explore'}
          onClick={() => onSelectMode('explore')}
        >
          <Icon name="bulb" />
          <span>Explore Skills</span>
        </button>

        <button
          type="button"
          className={`learn-branch-btn ${activeMode === 'progress' ? 'active' : ''}`}
          aria-pressed={activeMode === 'progress'}
          onClick={() => onSelectMode('progress')}
        >
          <Icon name="connect" />
          <span>My Progress</span>
          {activeCount > 0 && (
            <span className="learn-counter-badge" aria-label={`${activeCount} active paths`}>
              {activeCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
