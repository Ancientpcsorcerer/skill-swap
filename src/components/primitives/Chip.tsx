import type { HTMLAttributes } from 'react';
import styles from './Chip.module.css';

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'outline';
  size?: 'sm' | 'md';
}

export const Chip = ({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...rest
}: ChipProps) => (
  <span
    className={[
      styles.chip,
      styles[`v-${variant}`],
      styles[`s-${size}`],
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    {children}
  </span>
);
