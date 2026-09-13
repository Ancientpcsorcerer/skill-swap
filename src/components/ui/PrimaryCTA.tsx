import { content } from '../../data/content';

interface Props {
  className?: string;
  onClick: () => void;
  expanded?: boolean;
}

export function PrimaryCTA({ className = '', onClick, expanded = false }: Props) {
  return (
    <button type="button" className={`pill ${className}`} onClick={onClick}
      aria-haspopup="dialog" aria-controls="signup-modal" aria-expanded={expanded}>
      <span>{content.primaryAction}</span>
    </button>
  );
}
