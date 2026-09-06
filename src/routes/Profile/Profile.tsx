import { Link, useParams } from 'react-router-dom';
import { PROFILE_INDEX } from '@/data/profiles';
import { SKILL_INDEX } from '@/data/skills';
import { TRADES_DISPLAY } from '@/data/exchanges';
import { Avatar } from '@/components/primitives/Avatar';
import { Chip } from '@/components/primitives/Chip';
import { Button } from '@/components/primitives/Button';
import { NotFound } from '@/routes/NotFound/NotFound';
import styles from './Profile.module.css';

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const profile = id ? PROFILE_INDEX[id] : undefined;

  if (!profile) return <NotFound />;

  const teachSkills = profile.teaches
    .map((id) => SKILL_INDEX[id])
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const learnSkills = profile.learns
    .map((id) => SKILL_INDEX[id])
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const myTrades = TRADES_DISPLAY.filter(
    (t) => t.fromId === profile.id || t.toId === profile.id,
  ).slice(0, 6);

  return (
    <article className={styles.page}>
      <Link to="/discover" className={styles.back}>
        ← Back to the network
      </Link>

      <header className={styles.head}>
        <Avatar initials={profile.initials} hue={profile.hue} size={120} />
        <div className={styles.headInfo}>
          <span className={styles.eyebrow}>Profile</span>
          <h1 className={styles.name}>{profile.name}</h1>
          <p className={styles.loc}>
            {profile.location} · {profile.timezone}
          </p>
          <p className={styles.bio}>{profile.bio}</p>

          <div className={styles.headMeta}>
            <span className={styles.metaItem}>
              <span className={styles.metaLabel}>Hours given</span>
              <span className={styles.metaVal}>{profile.hoursGiven}</span>
            </span>
            <span className={styles.metaItem}>
              <span className={styles.metaLabel}>Hours received</span>
              <span className={styles.metaVal}>{profile.hoursReceived}</span>
            </span>
            <span className={styles.metaItem}>
              <span className={styles.metaLabel}>Trust</span>
              <span className={styles.metaVal}>{profile.trust}</span>
            </span>
            <span className={styles.metaItem}>
              <span className={styles.metaLabel}>Joined</span>
              <span className={styles.metaVal}>
                {new Date(profile.joinedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </span>
          </div>
        </div>
        <div className={styles.cta}>
          <Link to={`/exchange/new?with=${profile.id}`}>
            <Button>Propose an exchange →</Button>
          </Link>
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.section}>
          <h2 className={styles.sectionHead}>
            <span>Teaches</span>
            <span className={styles.sectionCount}>{teachSkills.length}</span>
          </h2>
          <ul className={styles.skillList}>
            {teachSkills.map((s) => (
              <li key={s.id}>
                <Chip variant="accent">{s.label}</Chip>
                {s.blurb && <p className={styles.skillBlurb}>{s.blurb}</p>}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>
            <span>Wants to learn</span>
            <span className={styles.sectionCount}>{learnSkills.length}</span>
          </h2>
          <ul className={styles.skillList}>
            {learnSkills.map((s) => (
              <li key={s.id}>
                <Chip variant="outline">{s.label}</Chip>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={styles.section} style={{ marginTop: 'var(--s-9)' }}>
        <h2 className={styles.sectionHead}>
          <span>Recent trades</span>
          <span className={styles.sectionCount}>{myTrades.length}</span>
        </h2>
        <ol className={styles.tradeList}>
          {myTrades.map((t) => (
            <li key={t.id} className={styles.tradeItem}>
              <span className={styles.tradeDate}>
                {new Date(t.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className={styles.tradeBlurb}>{t.blurb}</span>
            </li>
          ))}
          {myTrades.length === 0 && (
            <li className={styles.tradeEmpty}>No trades yet — be the first to propose.</li>
          )}
        </ol>
      </section>
    </article>
  );
};

export default Profile;
export { Profile };
