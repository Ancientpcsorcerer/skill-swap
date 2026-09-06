import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.inner}>
      <div className={styles.brandCol}>
        <p className={styles.lockup}>
          <span className={styles.lockupMark} aria-hidden>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <circle cx="7" cy="12" r="3" fill="currentColor" />
              <circle cx="17" cy="8" r="2" fill="currentColor" />
              <circle cx="18" cy="16" r="1.5" fill="currentColor" />
              <line x1="7" y1="12" x2="17" y2="8" stroke="var(--accent)" strokeWidth="1" />
              <line x1="7" y1="12" x2="18" y2="16" stroke="var(--accent)" strokeWidth="1" />
            </svg>
          </span>
          <span>Skill Swap</span>
        </p>
        <p className={styles.tagline}>
          Everyone knows something.
          <br />
          Everyone wants to learn something.
        </p>
      </div>

      <div className={styles.cols}>
        <div>
          <h4 className={styles.colHead}>The product</h4>
          <ul className={styles.colList}>
            <li>
              <Link to="/discover">Discover people</Link>
            </li>
            <li>
              <Link to="/onboard">Join the network</Link>
            </li>
            <li>
              <Link to="/me">Your profile</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className={styles.colHead}>The idea</h4>
          <ul className={styles.colList}>
            <li>
              <a href="#how-it-works">How an exchange works</a>
            </li>
            <li>
              <a href="#community">The community</a>
            </li>
            <li>
              <a href="#principles">What we believe</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className={styles.colHead}>The credits</h4>
          <ul className={styles.colList}>
            <li>1 hour = 1 hour.</li>
            <li>No cash. No points. No crypto.</li>
            <li>Just people.</li>
          </ul>
        </div>
      </div>
    </div>

    <div className={styles.colophon}>
      <span>Issue 01 — Vol. I</span>
      <span className={styles.dot} aria-hidden>
        ·
      </span>
      <span>Set in Fraunces &amp; Inter</span>
      <span className={styles.dot} aria-hidden>
        ·
      </span>
      <span>Built with care, 2026</span>
    </div>
  </footer>
);
