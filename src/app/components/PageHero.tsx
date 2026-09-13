import type { ReactNode } from 'react';
import { Artwork } from './Artwork';
export function PageHero({ core, title, description, children }: { core: 'connect'|'create'|'learn'|'discover'; title: ReactNode; description: string; children?: ReactNode }) {
  return <header className="module-hero"><div className="module-hero-copy"><p className="module-label">{core.toUpperCase()}<span /></p><h1>{title}</h1><p className="module-description">{description}</p>{children}</div><Artwork art={core+'Hero'} className="module-hero-art" /></header>;
}
