import styles from './Masthead.module.css';

export const Masthead = () => {
  return (
    <section className={styles.masthead}>
      <div className={styles.topbar}>
        <span className={styles.eyebrow} data-reveal="1">
          Issue 01 · Vol. I · August 2026
        </span>
        <span className={styles.eyebrow} data-reveal="2">
          A network of human knowledge
        </span>
      </div>

      <h1 className={styles.title} data-reveal="3">
        <span className={styles.line}>Everyone</span>
        <span className={styles.line}>
          knows <em>something.</em>
        </span>
      </h1>

      <p className={styles.lede} data-reveal="4">
        Skill Swap is a living constellation of what people know, and what they want to learn. Trade an hour of what you can teach for an hour of what you cannot. No money, no points — just an economy of attention.
      </p>

      <div className={styles.byline} data-reveal="5">
        <span>A reading-and-doing experience</span>
        <span aria-hidden>·</span>
        <span>Read time: 60 seconds</span>
      </div>

      <p className={styles.scrollHint} data-reveal="6">
        <span>Scroll to enter the network</span>
        <svg width="14" height="22" viewBox="0 0 14 22" aria-hidden>
          <line x1="7" y1="0" x2="7" y2="18" stroke="currentColor" strokeWidth="1" />
          <path d="M2 14 L7 19 L12 14" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </p>
    </section>
  );
};
