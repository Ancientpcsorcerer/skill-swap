import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PROFILE_INDEX } from '@/data/profiles';
import { SKILL_INDEX } from '@/data/skills';
import { useTrades } from '@/store/trades';
import { useUser } from '@/store/user';
import { Button } from '@/components/primitives/Button';
import { Field, TextArea } from '@/components/primitives/Field';
import { Avatar } from '@/components/primitives/Avatar';
import { Chip } from '@/components/primitives/Chip';
import styles from './Exchange.module.css';

const Exchange = () => {
  const [params] = useSearchParams();
  const withId = params.get('with') ?? '';
  const other = PROFILE_INDEX[withId];
  const user = useUser((s) => s.user);
  const navigate = useNavigate();
  const propose = useTrades((s) => s.propose);

  const [offered, setOffered] = useState<string>('');
  const [wanted, setWanted] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  // Defaults: pre-fill first mutual match
  const initialOffer = useMemo(() => {
    if (!other || !user) return '';
    const overlap = other.learns.find((s) => user.teaches.includes(s));
    return overlap ?? user.teaches[0] ?? '';
  }, [other, user]);

  const initialWant = useMemo(() => {
    if (!other) return '';
    const overlap = other.teaches.find((s) => user?.learns.includes(s));
    return overlap ?? other.teaches[0] ?? '';
  }, [other, user]);

  // If no `other` is selected, prompt the visitor to pick a partner.
  if (!other) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Propose an exchange</h1>
        <p>Pick a person from the <a href="/discover">network</a> first.</p>
      </div>
    );
  }

  // "You" defaults to the current user, or to the 'me' placeholder so
  // visitors can try the exchange flow without onboarding first. The
  // trade still saves to the trades store.
  const viewer = user ?? {
    id: 'me',
    name: 'You',
    email: '',
    teaches: [],
    learns: [],
    hoursGiven: 0,
    hoursReceived: 0,
    trust: 'new' as const,
    joinedAt: new Date().toISOString(),
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const useOffered = offered || initialOffer;
    const useWanted = wanted || initialWant;
    if (!useOffered || !useWanted) return;
    propose({
      fromId: viewer.id,
      toId: other.id,
      hoursOffered: 1,
      hoursWanted: 1,
      skillOffered: useOffered,
      skillWanted: useWanted,
      ...(time ? { scheduledFor: new Date(time).toISOString() } : {}),
      ...(message ? { message } : {}),
    });
    setSubmitted(true);
    setTimeout(() => navigate('/inbox'), 1200);
  };

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Propose an exchange</span>
        <h1 className={styles.title}>
          One hour of <em>what you know</em>,<br />
          for one hour of <em>what they know.</em>
        </h1>
      </header>

      <div className={styles.table}>
        <div className={styles.row}>
          <div className={styles.col}>
            <div className={styles.who}>
              <Avatar
                initials={viewer.name.split(' ').map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase() || 'ME'}
                hue={28}
                size={56}
              />
              <div>
                <p className={styles.whoLabel}>You</p>
                <p className={styles.whoName}>{viewer.name}</p>
              </div>
            </div>
            <div className={styles.skillGroup}>
              <span className={styles.skillLabel}>You give</span>
              <div className={styles.chipRow}>
                {viewer.teaches.length > 0
                  ? viewer.teaches.map((sId) => (
                      <button
                        key={sId}
                        type="button"
                        className={[
                          styles.choiceChip,
                          (offered || initialOffer) === sId ? styles.active : '',
                        ].join(' ')}
                        onClick={() => setOffered(sId)}
                      >
                        {SKILL_INDEX[sId]?.label}
                      </button>
                    ))
                  : other.teaches.map((sId) => (
                      <button
                        key={`mirror-${sId}`}
                        type="button"
                        className={[
                          styles.choiceChip,
                          (offered || initialOffer) === sId ? styles.active : '',
                        ].join(' ')}
                        onClick={() => setOffered(sId)}
                        title={`What ${other.name.split(' ')[0]} can teach`}
                      >
                        {SKILL_INDEX[sId]?.label}
                      </button>
                    ))}
              </div>
            </div>
          </div>

          <div className={styles.divider} aria-hidden>
            <span>⇆</span>
          </div>

          <div className={styles.col}>
            <div className={styles.who}>
              <Avatar initials={other.initials} hue={other.hue} size={56} />
              <div>
                <p className={styles.whoLabel}>Them</p>
                <p className={styles.whoName}>{other.name}</p>
              </div>
            </div>
            <div className={styles.skillGroup}>
              <span className={styles.skillLabel}>They give</span>
              <div className={styles.chipRow}>
                {other.teaches.map((sId) => (
                  <button
                    key={sId}
                    type="button"
                    className={[
                      styles.choiceChip,
                      (wanted || initialWant) === sId ? styles.active : '',
                    ].join(' ')}
                    onClick={() => setWanted(sId)}
                  >
                    {SKILL_INDEX[sId]?.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.row2}>
          <Field
            type="datetime-local"
            label="When? (optional)"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <TextArea
          label="A short message (optional)"
          placeholder={`Hi ${other.name.split(' ')[0]}, I've been wanting to learn ${SKILL_INDEX[initialWant]?.label ?? '…'} for a while…`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className={styles.submitRow}>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit">Send proposal →</Button>
        </div>

        {submitted && (
          <p className={styles.success} role="status">
            <Chip variant="accent">Sent</Chip> We'll let you know when {other.name.split(' ')[0]} responds.
          </p>
        )}
      </form>
    </div>
  );
};

export default Exchange;
export { Exchange };
