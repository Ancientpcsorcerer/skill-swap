import { Link } from 'react-router-dom';
import { JoinForm } from './JoinForm';
import styles from './BeOneOfThem.module.css';

/**
 * Act 05 framing for the homepage: the join form wrapped in the
 * "Yours is one of them" narrative. The /onboard route renders the
 * same form with its own framing.
 */
export const BeOneOfThem = () => (
  <section className={styles.section} id="be-one-of-them">
    <div className={styles.head}>
      <span className={styles.eyebrow}>Act 05 — Be one of them</span>
      <h2 className={styles.headline}>
        <span>Yours is</span>
        <span><em>one of them.</em></span>
      </h2>
      <p className={styles.copy}>
        Tell us your name, what you can teach, and what you want to learn. We'll introduce you to the people in the network who can complete the circle. No emails to verify, no accounts to set up — just an hour and an open mind.
      </p>
    </div>

    <JoinForm />

    <div className={styles.altRow}>
      <span>Don't want to sign up? That's fine.</span>
      <Link to="/discover" className={styles.altLink}>
        Browse the network →
      </Link>
    </div>
  </section>
);
