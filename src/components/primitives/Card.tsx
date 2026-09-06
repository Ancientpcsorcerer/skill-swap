import type { HTMLAttributes } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'flat';
  interactive?: boolean;
}

export const Card = ({
  variant = 'default',
  interactive,
  className,
  children,
  ...rest
}: CardProps) => (
  <div
    className={[
      styles.card,
      styles[`v-${variant}`],
      interactive ? styles.interactive : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    {children}
  </div>
);
