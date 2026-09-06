import { PROFILE_INDEX } from '@/data/profiles';
import { SKILL_INDEX } from '@/data/skills';
import { Act } from './Act';
import styles from './Act.module.css';

interface ActProps {
  progress: number;
  static?: boolean;
}

// Act 02 — visible 0.25–0.50 (viewport 1–2).
export const WantsToLearn = ({ progress, static: isStatic }: ActProps) => {
  const hero = PROFILE_INDEX['p.aria'];
  if (!hero) return null;
  const learnList = hero.learns
    .map((id) => SKILL_INDEX[id])
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <Act
      progress={progress}
      window={[0.28, 0.47]}
      side="right"
      eyebrow="Act 02 — The want"
      headline={[
        { text: 'Everyone' },
        { segments: [{ text: 'wants to learn ' }, { text: 'something.', italic: true }] },
      ]}
      static={isStatic}
    >
      <p className={styles.copy}>
        Aria wants to learn generative art and pottery. The two skills hang beside her, like satellites. In the network, every person has both: a list of what they know, and a list of what they don't. The exchange happens in the gap between them.
      </p>
      <ul className={styles.tagList}>
        {learnList.map((s) => (
          <li key={s.id} className={styles.tag}>
            {s.label}
          </li>
        ))}
      </ul>
    </Act>
  );
};
