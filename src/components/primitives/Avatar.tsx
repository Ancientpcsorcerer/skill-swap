import styles from './Avatar.module.css';

interface AvatarProps {
  initials: string;
  hue?: number;
  size?: number;
  className?: string;
}

// SVG-based avatar: a circle in a deterministic hue + initials.
// We avoid raster photos to keep performance high and design consistent.
export const Avatar = ({ initials, hue = 0, size = 40, className }: AvatarProps) => {
  const bg = `hsl(${hue} 35% 88%)`;
  const fg = `hsl(${hue} 45% 22%)`;
  return (
    <div
      className={[styles.avatar, className ?? ''].filter(Boolean).join(' ')}
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: size * 0.36,
      }}
      aria-hidden
    >
      <span className={styles.initials}>{initials}</span>
    </div>
  );
};
