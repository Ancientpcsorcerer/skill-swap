import styles from './Marquee.module.css';

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number; // seconds per loop
  direction?: 'left' | 'right';
  className?: string;
}

export const Marquee = ({ children, speed = 40, direction = 'left', className }: MarqueeProps) => {
  return (
    <div className={[styles.wrap, className ?? ''].filter(Boolean).join(' ')} aria-hidden>
      <div
        className={[styles.track, direction === 'right' ? styles.reverse : ''].join(' ')}
        style={{ animationDuration: `${speed}s` }}
      >
        <div className={styles.item}>{children}</div>
        <div className={styles.item}>{children}</div>
      </div>
    </div>
  );
};
