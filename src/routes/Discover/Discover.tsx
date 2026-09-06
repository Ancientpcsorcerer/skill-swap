import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PROFILES } from '@/data/profiles';
import { SKILL_INDEX, SKILLS_BY_CATEGORY } from '@/data/skills';
import { SKILL_CATEGORY_LABELS, type SkillCategory } from '@/types';
import { useUser } from '@/store/user';
import { Avatar } from '@/components/primitives/Avatar';
import { Chip } from '@/components/primitives/Chip';
import { Button } from '@/components/primitives/Button';
import styles from './Discover.module.css';

type SortKey = 'match' | 'recent' | 'active' | 'name';

const Discover = () => {
  const [activeCategory, setActiveCategory] = useState<SkillCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('match');
  const user = useUser((s) => s.user);

  const filtered = useMemo(() => {
    const list = PROFILES.filter((p) => {
      if (user && p.id === 'me') return false;
      if (search) {
        const q = search.toLowerCase();
        const inName = p.name.toLowerCase().includes(q);
        const inBio = p.bio.toLowerCase().includes(q);
        const inSkill = [...p.teaches, ...p.learns].some(
          (id) => SKILL_INDEX[id]?.label.toLowerCase().includes(q),
        );
        if (!inName && !inBio && !inSkill) return false;
      }
      if (activeCategory !== 'all') {
        const inCat =
          p.teaches.some((id) => SKILL_INDEX[id]?.category === activeCategory) ||
          p.learns.some((id) => SKILL_INDEX[id]?.category === activeCategory);
        if (!inCat) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sort === 'match' && user) {
      // Score: bidirectional match = teaches what user learns + learns what user teaches
      sorted.sort((a, b) => scoreMatch(b, user) - scoreMatch(a, user));
    } else if (sort === 'recent') {
      sorted.sort((a, b) => (a.joinedAt < b.joinedAt ? 1 : -1));
    } else if (sort === 'active') {
      sorted.sort((a, b) => b.hoursGiven - a.hoursGiven);
    } else if (sort === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [search, activeCategory, sort, user]);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>The network</span>
          <h1 className={styles.title}>
            {filtered.length} {filtered.length === 1 ? 'person' : 'people'} in the network
          </h1>
          <p className={styles.lede}>
            A small, intentional roster. Every person has something to teach and something to learn. Filter by category, search by skill, sort by match.
          </p>
        </div>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1" />
            <line x1="9" y1="9" x2="13" y2="13" stroke="currentColor" strokeWidth="1" />
          </svg>
          <input
            type="search"
            placeholder="Search a name, a skill, a place…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.search}
            aria-label="Search the network"
          />
        </div>

        <div className={styles.filters} role="tablist" aria-label="Filter by category">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'all'}
            className={[styles.filterChip, activeCategory === 'all' ? styles.active : ''].join(' ')}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          {(Object.keys(SKILLS_BY_CATEGORY) as SkillCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat}
              className={[styles.filterChip, activeCategory === cat ? styles.active : ''].join(' ')}
              onClick={() => setActiveCategory(cat)}
            >
              {SKILL_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className={styles.sortRow}>
          <span className={styles.sortLabel}>Sort</span>
          <select
            className={styles.sort}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort people"
          >
            <option value="match">Best match</option>
            <option value="recent">Recently joined</option>
            <option value="active">Most active</option>
            <option value="name">A → Z</option>
          </select>
        </div>
      </div>

      <ul className={styles.grid} role="list">
        {filtered.map((p) => {
          const teachSkills = p.teaches
            .map((id) => SKILL_INDEX[id])
            .filter((s): s is NonNullable<typeof s> => Boolean(s));
          const learnSkills = p.learns
            .map((id) => SKILL_INDEX[id])
            .filter((s): s is NonNullable<typeof s> => Boolean(s));
          const match = user ? scoreMatch(p, user) : 0;
          return (
            <li key={p.id} className={styles.cardWrap}>
              <article className={styles.card}>
                <div className={styles.cardTop}>
                  <Avatar initials={p.initials} hue={p.hue} size={56} />
                  <div>
                    <h3 className={styles.cardName}>
                      <Link to={`/people/${p.id}`}>{p.name}</Link>
                    </h3>
                    <p className={styles.cardLoc}>
                      {p.location} · {p.timezone}
                    </p>
                  </div>
                  {user && match > 0 && (
                    <span className={styles.matchTag} aria-label={`Match score ${match}`}>
                      {match} match
                    </span>
                  )}
                </div>

                <p className={styles.cardBio}>{p.bio}</p>

                <div className={styles.cardGroup}>
                  <span className={styles.cardLabel}>Teaches</span>
                  <div className={styles.cardChips}>
                    {teachSkills.map((s) => (
                      <Chip key={s.id} size="sm" variant="accent">
                        {s.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className={styles.cardGroup}>
                  <span className={styles.cardLabel}>Wants to learn</span>
                  <div className={styles.cardChips}>
                    {learnSkills.map((s) => (
                      <Chip key={s.id} size="sm" variant="outline">
                        {s.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className={styles.cardFoot}>
                  <span className={styles.meta}>
                    {p.hoursGiven} given · {p.hoursReceived} received
                  </span>
                  <Link to={`/people/${p.id}`} className={styles.cardLink}>
                    View profile →
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className={styles.empty}>
            <p>No matches yet. Try a different category, or a different word.</p>
            <Button type="button" variant="ghost" onClick={() => { setSearch(''); setActiveCategory('all'); }}>
              Clear filters
            </Button>
          </li>
        )}
      </ul>
    </div>
  );
};

const scoreMatch = (
  p: { id: string; teaches: string[]; learns: string[] },
  user: { teaches: string[]; learns: string[] },
): number => {
  if (p.id === 'me') return 0;
  const aTeachesBLearns = p.teaches.filter((s) => user.learns.includes(s)).length;
  const bTeachesALearns = user.teaches.filter((s) => p.learns.includes(s)).length;
  // Bidirectional match weighs more
  if (aTeachesBLearns > 0 && bTeachesALearns > 0) return aTeachesBLearns + bTeachesALearns + 1;
  return aTeachesBLearns + bTeachesALearns;
};

export default Discover;
export { Discover };
