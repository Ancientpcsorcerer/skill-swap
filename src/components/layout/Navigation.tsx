import { navigation } from '../../data/content';

export function Navigation({ className = '', onNavigate }: { className?: string; onNavigate?: () => void }) {
  return (
    <nav className={className} aria-label="Primary">
      {navigation.map(item => item.href ? (
        <a key={item.label} href={item.href} onClick={onNavigate}>{item.label}</a>
      ) : (
        <button key={item.label} type="button" aria-disabled="true">{item.label}</button>
      ))}
    </nav>
  );
}
