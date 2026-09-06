import { PROFILE_INDEX, PROFILES } from '@/data/profiles';
import { SKILL_INDEX } from '@/data/skills';
import { Act } from './Act';
import styles from './Act.module.css';

interface ActProps {
  progress: number;
  static?: boolean;
}

// Act 01 — visible 0–0.25 (viewport 0–1). No fade-in, fades out at 0.20–0.25.
export const KnowsSomething = ({ progress, static: isStatic }: ActProps) => {
  const hero = PROFILE_INDEX['p.aria'];
  if (!hero) return null;
  const firstSkill = hero.teaches[0] ? SKILL_INDEX[hero.teaches[0]] : null;

  return (
    <Act
      progress={progress}
      window={[0, 0.25]}
      eyebrow="Act 01 — A person in the network"
      headline={[
        { text: 'Everyone' },
        { segments: [{ text: 'knows ' }, { text: 'something.', italic: true }] },
      ]}
      static={isStatic}
    >
      <p className={styles.copy}>
        Aria is a baker in Mexico City. She knows sourdough, knife work, and how to coax a starter back to life. In the network, she is a single point of light. So are the other <strong>{PROFILES.length - 1}</strong> people you can scroll into view.
      </p>
      <p className={styles.who}>
        <span className={styles.whoLabel}>Currently in view</span>
        <span className={styles.whoName}>
          {hero.name} · {firstSkill?.label}
        </span>
      </p>
    </Act>
  );
};
