
interface LearnHeroProps {
  activeCount: number;
}

export function LearnHero({ activeCount }: LearnHeroProps) {
  return (
    <header className="learn-hero">
      <div className="learn-hero-badge">
        ✦ LEARN DIRECTORY &middot; {activeCount > 0 ? `${activeCount} Active Tracks` : 'Curated Roadmaps'}
      </div>
      <h1 className="learn-hero-title">
        Learn from people.
        <br />
        Build skills through human collaboration.
      </h1>
      <p className="learn-hero-desc">
        Find what to learn, connect with experienced mentors, and cultivate real-world craft through authentic human exchange.
      </p>
    </header>
  );
}
