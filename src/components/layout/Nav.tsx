import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from './Nav.module.css';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/discover', label: 'Discover' },
  { to: '/inbox', label: 'Inbox' },
  { to: '/me', label: 'Me' },
];

export const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className={[styles.header, scrolled ? styles.scrolled : ''].join(' ')}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} aria-label="Skill Swap home">
          <span className={styles.mark} aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22">
              <circle cx="7" cy="12" r="3" fill="currentColor" />
              <circle cx="17" cy="8" r="2" fill="currentColor" />
              <circle cx="18" cy="16" r="1.5" fill="currentColor" />
              <line x1="7" y1="12" x2="17" y2="8" stroke="var(--accent)" strokeWidth="1" />
              <line x1="7" y1="12" x2="18" y2="16" stroke="var(--accent)" strokeWidth="1" />
            </svg>
          </span>
          <span className={styles.wordmark}>skill swap</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <ul className={styles.list}>
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    [styles.link, isActive ? styles.active : ''].join(' ')
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.cta}>
          <Link to="/onboard" className={styles.ctaLink}>
            Join
          </Link>
        </div>

        <button
          className={styles.menuBtn}
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((s) => !s)}
        >
          <span className={styles.menuBar} />
          <span className={styles.menuBar} />
        </button>
      </div>

      {open && (
        <div className={styles.drawer} role="dialog" aria-label="Menu">
          <ul>
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    [styles.drawerLink, isActive ? styles.drawerLinkActive : ''].join(' ')
                  }
                >
                  <span>{l.label}</span>
                  {l.to === '/onboard' && null}
                </NavLink>
              </li>
            ))}
            <li>
              <NavLink
                to="/onboard"
                className={({ isActive }) =>
                  [styles.drawerLink, isActive ? styles.drawerLinkActive : ''].join(' ')
                }
              >
                Join
              </NavLink>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};
