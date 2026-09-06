import { PROFILES } from '@/data/profiles';
import { SKILL_INDEX } from '@/data/skills';
import { TRADES } from '@/data/exchanges';
import { Act } from './Act';
import styles from './Act.module.css';

interface ActProps {
  progress: number;
  static?: boolean;
}

// Act 04 — visible 0.75–1.0 (viewport 3–4). No fadeOut (stays to the end of the pin).
export const Community = ({ progress, static: isStatic }: ActProps) => {
  const recent = TRADES.slice(0, 6).map((t) => ({
    who: t.fromId === 'p.aria' ? 'Aria' : 'Mateo',
    did: 'traded',
    what: SKILL_INDEX[t.skillId]?.label ?? 'a skill',
  }));

  return (
    <Act
      progress={progress}
      window={[0.78, 0.98]}
      side="right"
      eyebrow="Act 04 — A community"
      headline={[
        { text: 'The' },
        { segments: [{ text: 'community.', italic: true }] },
      ]}
      static={isStatic}
    >
      <p className={styles.copy}>
        {PROFILES.length} people in this network so far. {TRADES.length} exchanges in the last month. New threads this week. Every line you see is an hour traded between two real people, learning and teaching.
      </p>
      <ul className={styles.tradeList}>
        {recent.map((r, i) => (
          <li key={i} className={styles.tradeItem}>
            <strong>{r.who}</strong> {r.did} 1 hr of <em>{r.what}</em>
          </li>
        ))}
      </ul>
    </Act>
  );
};
