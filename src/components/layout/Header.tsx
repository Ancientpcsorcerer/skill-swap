import { useEffect, useRef, useState } from 'react';
import { BrandMark } from '../ui/BrandMark';
import { PrimaryCTA } from '../ui/PrimaryCTA';
import { Navigation } from './Navigation';
import { useModalDialog } from '../../hooks/useModalDialog';

interface Props { onSignup: () => void; signupOpen: boolean }

export function Header({ onSignup, signupOpen }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef<HTMLDialogElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  useModalDialog(menu, menuOpen);

  useEffect(() => {
    const portrait = window.matchMedia('(max-aspect-ratio: 11/10)');
    const closeOnLandscape = () => { if (!portrait.matches) setMenuOpen(false); };
    portrait.addEventListener('change', closeOnLandscape);
    return () => portrait.removeEventListener('change', closeOnLandscape);
  }, []);

  // Tear down menu focus/scroll lock before opening the shared signup dialog.
  const signupFromMenu = () => {
    setMenuOpen(false);
    requestAnimationFrame(() => {
      burger.current?.focus({ preventScroll: true });
      onSignup();
    });
  };

  return (
    <>
      <header className="topbar">
        <a className="brand" href="#landing" aria-label="Home"><BrandMark /></a>
        <Navigation className="links" />
        <PrimaryCTA className="pill-nav" onClick={onSignup} expanded={signupOpen} />
        <button ref={burger} className="burger" type="button" aria-label="Open menu"
          aria-expanded={menuOpen} aria-controls="mobile-menu" aria-haspopup="dialog" onClick={() => setMenuOpen(true)}>
          <i /><i />
        </button>
      </header>
      <dialog ref={menu} id="mobile-menu" className="mobile-menu" aria-labelledby="menu-title"
        onCancel={event => { event.preventDefault(); setMenuOpen(false); }}
        onClose={() => setMenuOpen(false)}>
        <button className="icon-button menu-close" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} autoFocus>
          <span aria-hidden="true">×</span>
        </button>
        <div className="menu-inner">
          <p id="menu-title" className="menu-eyebrow">Menu</p>
          <Navigation className="menu-links" onNavigate={() => setMenuOpen(false)} />
          <PrimaryCTA className="menu-cta" onClick={signupFromMenu} expanded={signupOpen} />
        </div>
      </dialog>
    </>
  );
}
