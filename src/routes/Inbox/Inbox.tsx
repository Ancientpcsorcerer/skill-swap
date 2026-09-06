import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTrades } from '@/store/trades';
import { useUser } from '@/store/user';
import { PROFILE_INDEX } from '@/data/profiles';
import { SKILL_INDEX } from '@/data/skills';
import { Avatar } from '@/components/primitives/Avatar';
import { Button } from '@/components/primitives/Button';
import { Chip } from '@/components/primitives/Chip';
import styles from './Inbox.module.css';

type Tab = 'proposed' | 'accepted' | 'completed';

const Inbox = () => {
  const user = useUser((s) => s.user);
  const proposed = useTrades((s) => s.proposed);
  const relations = useTrades((s) => s.relations);
  const accept = useTrades((s) => s.accept);
  const decline = useTrades((s) => s.decline);
  const complete = useTrades((s) => s.complete);
  const [tab, setTab] = useState<Tab>('proposed');

  // The "you" identity in the inbox is whoever is viewing. If no one is
  // signed in, we still show seed proposals addressed to "me" so the
  // page feels alive on first visit (the join flow is the onboarding CTA).
  const viewerId = user?.id ?? 'me';
  const myProposed = proposed.filter((r) => r.fromId === viewerId || r.toId === viewerId);
  const myCompleted = relations.filter((r) => r.fromId === viewerId || r.toId === viewerId);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Inbox</span>
        <h1 className={styles.title}>Your exchanges</h1>
        <p className={styles.lede}>
          {myProposed.length} active · {myCompleted.length} completed
        </p>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Inbox tabs">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'proposed'}
          className={[styles.tab, tab === 'proposed' ? styles.active : ''].join(' ')}
          onClick={() => setTab('proposed')}
        >
          Proposed <span className={styles.count}>{myProposed.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'accepted'}
          className={[styles.tab, tab === 'accepted' ? styles.active : ''].join(' ')}
          onClick={() => setTab('accepted')}
        >
          Accepted
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'completed'}
          className={[styles.tab, tab === 'completed' ? styles.active : ''].join(' ')}
          onClick={() => setTab('completed')}
        >
          Completed <span className={styles.count}>{myCompleted.length}</span>
        </button>
      </div>

      {tab === 'proposed' && (
        <ul className={styles.list} role="list">
          {myProposed.length === 0 && (
            <li className={styles.empty}>
              <p>No pending proposals. Browse the <Link to="/discover">network</Link> to start one.</p>
            </li>
          )}
          {myProposed.map((r) => {
            const other = PROFILE_INDEX[r.fromId === viewerId ? r.toId : r.fromId];
            if (!other) return null;
            const youOffered = r.fromId === viewerId ? r.skillOffered : r.skillWanted;
            const youGot = r.fromId === viewerId ? r.skillWanted : r.skillOffered;
            return (
              <li key={r.id} className={styles.item}>
                <Avatar initials={other.initials} hue={other.hue} size={48} />
                <div className={styles.itemBody}>
                  <p className={styles.itemWho}>
                    With <strong>{other.name}</strong>
                  </p>
                  <p className={styles.itemDetail}>
                    You give <Chip size="sm" variant="accent">{SKILL_INDEX[youOffered]?.label}</Chip>{' '}
                    for <Chip size="sm" variant="outline">{SKILL_INDEX[youGot]?.label}</Chip>
                  </p>
                  <p className={styles.itemMeta}>
                    Proposed {new Date(r.proposedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' · '}
                    <span className={styles.statusTag}>{r.status}</span>
                  </p>
                </div>
                <div className={styles.itemActions}>
                  {r.status === 'proposed' && r.toId === viewerId && (
                    <>
                      <Button type="button" onClick={() => accept(r.id)} size="sm">Accept</Button>
                      <Button type="button" variant="ghost" onClick={() => decline(r.id)} size="sm">Decline</Button>
                    </>
                  )}
                  {r.status === 'accepted' && (
                    <Button type="button" onClick={() => complete(r.id)} size="sm">Mark complete</Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'accepted' && (
        <p className={styles.muted}>Accepted proposals move to <strong>Completed</strong> after both sides confirm the trade.</p>
      )}

      {tab === 'completed' && (
        <ul className={styles.list} role="list">
          {myCompleted.slice(0, 12).map((r) => {
            const other = PROFILE_INDEX[r.fromId === viewerId ? r.toId : r.fromId];
            if (!other) return null;
            return (
              <li key={r.id} className={styles.item}>
                <Avatar initials={other.initials} hue={other.hue} size={48} />
                <div className={styles.itemBody}>
                  <p className={styles.itemWho}>
                    With <strong>{other.name}</strong>
                  </p>
                  <p className={styles.itemDetail}>
                    {SKILL_INDEX[r.skillOffered]?.label}
                    {' ↔ '}
                    {SKILL_INDEX[r.skillWanted]?.label}
                  </p>
                  <p className={styles.itemMeta}>
                    {new Date(r.proposedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <Chip variant="outline" size="sm">completed</Chip>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Inbox;
export { Inbox };
