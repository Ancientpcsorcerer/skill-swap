import { PROFILE_INDEX } from '@/data/profiles';
import { SKILL_INDEX } from '@/data/skills';
import { TRADES } from '@/data/exchanges';
import { Act } from './Act';
import styles from './Act.module.css';

interface ActProps {
  progress: number;
  static?: boolean;
}

// Act 03 — visible 0.50–0.75 (viewport 2–3).
export const Exchange = ({ progress, static: isStatic }: ActProps) => {
  const trade = TRADES.find((t) => t.fromId === 'p.aria' && t.toId === 'p.mateo');
  if (!trade) return null;
  const aria = PROFILE_INDEX['p.aria'];
  const mateo = PROFILE_INDEX['p.mateo'];
  const skill = SKILL_INDEX[trade.skillId];
  if (!aria || !mateo || !skill) return null;

  return (
    <Act
      progress={progress}
      window={[0.53, 0.72]}
      eyebrow="Act 03 — A connection"
      headline={[
        { text: 'An' },
        { segments: [{ text: 'exchange.', italic: true }] },
      ]}
      static={isStatic}
    >
      <p className={styles.copy}>
        Aria has what Mateo wants. Mateo has what Aria wants. The two find each other, and a line forms between them. An hour of sourdough for an hour of generative art. No money changes hands. The network grows by one thread.
      </p>
      <div className={styles.exchangeCard}>
        <div className={styles.exchangeRow}>
          <span className={styles.exchangePerson}>{aria.name}</span>
          <span className={styles.exchangeSkill}>gives · 1 hr · {skill.label}</span>
        </div>
        <div className={styles.exchangeDivider} aria-hidden>
          <span>↕</span>
        </div>
        <div className={styles.exchangeRow}>
          <span className={styles.exchangePerson}>{mateo.name}</span>
          <span className={styles.exchangeSkill}>gives · 1 hr · {SKILL_INDEX['design.generative']?.label}</span>
        </div>
      </div>
    </Act>
  );
};
