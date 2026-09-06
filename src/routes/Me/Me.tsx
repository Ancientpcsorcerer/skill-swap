import { Link } from 'react-router-dom';
import { useUser } from '@/store/user';
import { SKILL_INDEX } from '@/data/skills';
import { TRADES_DISPLAY } from '@/data/exchanges';
import { PROFILE_INDEX } from '@/data/profiles';
import { Button } from '@/components/primitives/Button';
import { Chip } from '@/components/primitives/Chip';
import { Avatar } from '@/components/primitives/Avatar';
import styles from './Me.module.css';

const Me = () => {
  const user = useUser((s) => s.user);
  const signOut = useUser((s) => s.signOut);

  if (!user) {
    return (
      <div className={styles.page}>
        <p>You're not signed in. <Link to="/onboard">Join the network</Link> to start trading.</p>
      </div>
    );
  }

  const teach = user.teaches.map((id) => SKILL_INDEX[id]).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const learn = user.learns.map((id) => SKILL_INDEX[id]).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const myTrades = TRADES_DISPLAY.filter((t) => t.fromId === 'p.aria' || t.toId === 'p.aria').slice(0, 5);

  return (
    <article className={styles.page}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Your profile</span>
        <h1 className={styles.title}>{user.name}</h1>
        <p className={styles.sub}>
          {user.email} · joined {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'just now'}
        </p>
      </header>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardHead}>You teach</h2>
          <div className={styles.chipRow}>
            {teach.map((s) => (
              <Chip key={s.id} variant="accent">{s.label}</Chip>
            ))}
          </div>
        </section>
        <section className={styles.card}>
          <h2 className={styles.cardHead}>You learn</h2>
          <div className={styles.chipRow}>
            {learn.map((s) => (
              <Chip key={s.id} variant="outline">{s.label}</Chip>
            ))}
          </div>
        </section>
        <section className={styles.card}>
          <h2 className={styles.cardHead}>Hours</h2>
          <div className={styles.statRow}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Given</span>
              <span className={styles.statVal}>{user.hoursGiven}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Received</span>
              <span className={styles.statVal}>{user.hoursReceived}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Trust</span>
              <span className={styles.statVal}>{user.trust}</span>
            </div>
          </div>
        </section>
        <section className={styles.card}>
          <h2 className={styles.cardHead}>Next step</h2>
          <p className={styles.cardCopy}>
            You haven't traded yet. Find someone in the network who can complete the circle.
          </p>
          <Link to="/discover" style={{ alignSelf: 'flex-start' }}>
            <Button>Find a match →</Button>
          </Link>
        </section>
      </div>

      <section className={styles.recent}>
        <h2 className={styles.cardHead}>What others are doing</h2>
        <ol className={styles.tradeList}>
          {myTrades.map((t) => {
            const other = PROFILE_INDEX[t.fromId === 'p.aria' ? t.toId : t.fromId];
            if (!other) return null;
            return (
              <li key={t.id} className={styles.tradeItem}>
                <Avatar initials={other.initials} hue={other.hue} size={32} />
                <span className={styles.tradeText}>{t.blurb}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className={styles.signOutRow}>
        <Button type="button" variant="ghost" onClick={signOut}>Sign out</Button>
      </div>
    </article>
  );
};

export default Me;
export { Me };
