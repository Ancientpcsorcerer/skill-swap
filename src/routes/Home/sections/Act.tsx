import type { ReactNode, CSSProperties } from 'react';
import styles from './Act.module.css';

export type ActSide = 'left' | 'right';

// One segment of a headline line. Plain text or italic + accent.
export interface HeadlineSegment {
  text: string;
  italic?: boolean;
}

export interface ActLine {
  // For line 1, just text. For line 2, can be a list of segments with optional italic.
  text?: string;
  segments?: HeadlineSegment[];
}

export interface ActProps {
  progress: number;
  // [fadeInStart, fadeOutEnd] — when the act is fully visible.
  // Pass [0, 0] for first act (always visible at top).
  window: [number, number];
  side?: ActSide;
  eyebrow: string;
  headline: [ActLine, ActLine];
  children: ReactNode;
}

const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const clamp = (v: number, a: number, b: number): number =>
  Math.max(a, Math.min(b, v));

/**
 * Single Act shell used by all four scenes on the homepage.
 * Owns: panel surface, accent line, eyebrow, headline, opacity/y animation.
 * Children: scene-specific body (paragraphs, tag lists, cards, etc.).
 *
 * Pass `static` (e.g. for reduced-motion users) to skip the opacity/y
 * animation and render the panel fully visible at all times.
 */
export const Act = ({
  progress,
  window: [fadeInEnd, fadeOutStart],
  side = 'left',
  eyebrow,
  headline,
  children,
  static: isStatic = false,
}: ActProps & { static?: boolean }) => {
  const fadeIn = isStatic ? 1 : smoothstep(0, fadeInEnd, progress);
  const fadeOut = isStatic ? 1 : 1 - smoothstep(fadeOutStart, fadeOutStart + 0.03, progress);
  const opacity = clamp(Math.min(fadeIn, fadeOut), 0, 1);
  const y = isStatic ? 0 : (1 - fadeIn) * 24;

  const sectionStyle: CSSProperties = {
    opacity,
    transform: `translateY(${y}px)`,
  };

  return (
    <section
      className={styles.act}
      data-side={side}
      style={sectionStyle}
      aria-hidden={isStatic ? false : opacity < 0.3}
    >
      <div className={styles.panel}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2 className={styles.headline}>
          <HeadlineLine line={headline[0]} />
          <HeadlineLine line={headline[1]} />
        </h2>
        <div className={styles.body}>{children}</div>
      </div>
    </section>
  );
};

const HeadlineLine = ({ line }: { line: ActLine }) => {
  if (line.segments) {
    return (
      <span>
        {line.segments.map((seg, i) =>
          seg.italic ? <em key={i}>{seg.text}</em> : <span key={i}>{seg.text}</span>,
        )}
      </span>
    );
  }
  return <span>{line.text}</span>;
};
