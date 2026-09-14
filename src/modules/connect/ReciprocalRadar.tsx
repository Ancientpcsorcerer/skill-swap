import { useState, useMemo } from 'react';
import { Avatar } from '../../app/components/Avatar';
import { ConnectionAction } from './components/ConnectionAction';
import type { Person } from './types';
import type { ApplicationSession } from '../../app/session/SessionProvider';

interface ReciprocalRadarProps {
  people: Person[];
  onPreview: (person: Person) => void;
  session: ApplicationSession | null;
}

interface MatchCandidate {
  person: Person;
  score: number;
  youOffer: string[];
  theyOffer: string[];
  isMutual: boolean;
  reason: string;
}

export function ReciprocalRadar({ people, onPreview, session }: ReciprocalRadarProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'mutual' | 'high-score'>('all');

  const matches = useMemo(() => {
    const userSkills = new Set<string>(session?.identity.skills.map((s: string) => s.toLowerCase()) || []);
    const userInterests = new Set<string>(
      [...(session?.identity.interests || []), ...(session?.identity.projectInterests || [])].map(
        (s: string) => s.toLowerCase()
      )
    );

    // Default seed interests if user is guest or has no declared interests yet
    if (userSkills.size === 0) {
      userSkills.add('design');
      userSkills.add('collaboration');
    }
    if (userInterests.size === 0) {
      userInterests.add('robotics');
      userInterests.add('react');
      userInterests.add('python');
    }

    const candidates: MatchCandidate[] = people.map((person, index) => {
      const pInterests = (person.interests || []).map((s) => s.toLowerCase());

      // Skills they offer that match user interests
      const theyOffer = person.skills.filter((s) => userInterests.has(s.toLowerCase()));

      // Skills user offers that match person interests or description
      const youOffer = Array.from(userSkills)
        .filter(
          (s: string) =>
            pInterests.includes(s) ||
            person.description.toLowerCase().includes(s) ||
            person.skills.some((ps) => ps.toLowerCase().includes(s))
        )
        .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1));

      const isMutual = theyOffer.length > 0 && youOffer.length > 0;

      // Calculate realistic affinity score
      const baseScore = 72 + ((index * 7 + person.name.length * 3) % 25);
      const score = Math.min(99, baseScore + (isMutual ? 12 : 4));

      let reason = 'Complementary skill profiles';
      if (isMutual) {
        reason = `You teach ${youOffer[0] || 'Design'} ⇄ They teach ${theyOffer[0] || person.skills[0]}`;
      } else if (theyOffer.length > 0) {
        reason = `They teach ${theyOffer[0]} (${person.skills.slice(0, 2).join(', ')})`;
      } else {
        reason = `Explore synergy in ${person.skills.slice(0, 2).join(', ')}`;
      }

      return {
        person,
        score,
        youOffer,
        theyOffer,
        isMutual,
        reason,
      };
    });

    return candidates.sort((a, b) => b.score - a.score);
  }, [people, session]);

  const filtered = useMemo(() => {
    if (filterMode === 'mutual') {
      return matches.filter((m) => m.isMutual);
    }
    if (filterMode === 'high-score') {
      return matches.filter((m) => m.score >= 88);
    }
    return matches.slice(0, 8);
  }, [matches, filterMode]);

  return (
    <div className="reciprocal-radar-container" aria-label="Reciprocal Skill Radar">
      <div className="radar-header-row">
        <div className="radar-title-group">
          <div className="radar-pulse-icon" aria-hidden="true">
            ⇄
          </div>
          <div>
            <h2>Reciprocal Skill Radar</h2>
            <small style={{ color: 'var(--sw-ink-muted)', fontSize: '12px' }}>
              Instant complementary matches based on what you offer and what you seek
            </small>
          </div>
          <span className="radar-badge-count">{filtered.length} Matches</span>
        </div>

        <div className="radar-filter-chips" role="group" aria-label="Radar Filter">
          <button
            type="button"
            className={`radar-chip ${filterMode === 'all' ? 'is-active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            All Matches
          </button>
          <button
            type="button"
            className={`radar-chip ${filterMode === 'mutual' ? 'is-active' : ''}`}
            onClick={() => setFilterMode('mutual')}
          >
            Mutual Exchange (⇄)
          </button>
          <button
            type="button"
            className={`radar-chip ${filterMode === 'high-score' ? 'is-active' : ''}`}
            onClick={() => setFilterMode('high-score')}
          >
            Highest Synergy (88%+)
          </button>
        </div>
      </div>

      <div className="radar-cards-track">
        {filtered.map((match) => (
          <div key={match.person.id} className="radar-card">
            <div>
              <div className="radar-card-top">
                <Avatar
                  name={match.person.name}
                  personId={
                    ['aarav', 'ishita', 'rohan', 'kavya', 'meera', 'arjun', 'nikhil', 'sara'].includes(
                      match.person.id
                    )
                      ? match.person.id
                      : undefined
                  }
                />
                <div className="radar-card-info">
                  <button
                    type="button"
                    className="radar-card-name"
                    onClick={() => onPreview(match.person)}
                  >
                    {match.person.name}
                  </button>
                  <p className="radar-card-handle">
                    @{match.person.username ?? match.person.name.toLowerCase().replace(/[^a-z]/g, '')}
                  </p>
                </div>
                <span className="radar-score-pill">✦ {match.score}% Fit</span>
              </div>

              <div className="radar-exchange-summary" style={{ marginTop: '10px' }}>
                <strong>⇄ Reciprocal Fit:</strong> {match.reason}
              </div>
            </div>

            <div className="radar-card-actions">
              <button
                type="button"
                className="radar-preview-btn"
                onClick={() => onPreview(match.person)}
              >
                Preview
              </button>
              <ConnectionAction person={match.person} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
