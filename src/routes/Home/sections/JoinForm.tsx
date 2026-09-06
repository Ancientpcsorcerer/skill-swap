import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/store/user';
import { Button } from '@/components/primitives/Button';
import { Field, TextArea } from '@/components/primitives/Field';
import { Chip } from '@/components/primitives/Chip';
import { SKILLS_BY_CATEGORY, SKILL_INDEX } from '@/data/skills';
import { SKILL_CATEGORY_LABELS, type SkillCategory } from '@/types';
import styles from './BeOneOfThem.module.css';

const toggle = (
  setter: React.Dispatch<React.SetStateAction<string[]>>,
  current: string[],
  id: string,
) => {
  setter(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
};

/**
 * The 3-step join form, without any framing. Used by both the
 * homepage "Yours is one of them" act and the /onboard route.
 */
export const JoinForm = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [teaches, setTeaches] = useState<string[]>([]);
  const [learns, setLearns] = useState<string[]>([]);
  const [blurb, setBlurb] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const setUser = useUser((s) => s.setUser);
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (teaches.length === 0 || learns.length === 0) {
      setError('Pick at least one skill you can teach and one you want to learn.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setUser({
        id: 'me',
        name: name.trim(),
        email: email.trim(),
        teaches,
        learns,
        hoursGiven: 0,
        hoursReceived: 0,
        trust: 'new',
        joinedAt: new Date().toISOString(),
        onboardedAt: new Date().toISOString(),
      });
      setSubmitting(false);
      navigate('/discover');
    }, 350);
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} aria-label="Join the network">
      <ol className={styles.steps}>
        <li className={[styles.step, step === 1 ? styles.active : ''].join(' ')}>
          <span className={styles.stepNum}>01</span>
          <span className={styles.stepLabel}>Who you are</span>
        </li>
        <li className={[styles.step, step === 2 ? styles.active : ''].join(' ')}>
          <span className={styles.stepNum}>02</span>
          <span className={styles.stepLabel}>What you teach</span>
        </li>
        <li className={[styles.step, step === 3 ? styles.active : ''].join(' ')}>
          <span className={styles.stepNum}>03</span>
          <span className={styles.stepLabel}>What you learn</span>
        </li>
      </ol>

      {step === 1 && (
        <div className={styles.stepPanel}>
          <div className={styles.row}>
            <Field
              label="Your name"
              placeholder="e.g. Aria Mendes"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
                if (nameError) setNameError(null);
              }}
              onBlur={() => {
                if (!name.trim()) setNameError('Name is required.');
              }}
              error={nameError ?? undefined}
              autoComplete="name"
              required
            />
            <Field
              label="Email"
              type="email"
              placeholder="you@somewhere.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
                if (emailError) setEmailError(null);
              }}
              onBlur={() => {
                if (!email.trim()) setEmailError('Email is required.');
              }}
              error={emailError ?? undefined}
              autoComplete="email"
              required
            />
          </div>
          <TextArea
            label="A line about you (optional)"
            placeholder="I'm a baker, I ferment slowly, I am learning to throw pots…"
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
          />
          {error && (
            <p role="alert" style={{ color: 'var(--accent)', fontSize: 'var(--t-body-s)', margin: 0 }}>
              {error}
            </p>
          )}
          <div className={styles.navRow}>
            <Button type="button" variant="ghost" onClick={() => navigate('/discover')}>
              Just browsing
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!name.trim() || !email.trim()) {
                  setError('Name and email are required to continue.');
                  return;
                }
                setStep(2);
              }}
              disabled={!name.trim() || !email.trim()}
            >
              Continue →
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={styles.stepPanel}>
          <p className={styles.stepHelp}>Pick one or more. The more honest, the better the match.</p>
          <div className={styles.categoryGrid}>
            {(Object.keys(SKILLS_BY_CATEGORY) as SkillCategory[]).map((cat) => (
              <div key={cat} className={styles.catBlock}>
                <h4 className={styles.catHead}>{SKILL_CATEGORY_LABELS[cat]}</h4>
                <div className={styles.chipRow}>
                  {SKILLS_BY_CATEGORY[cat].map((s) => {
                    const active = teaches.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggle(setTeaches, teaches, s.id)}
                        className={[styles.choiceChip, active ? styles.active : ''].join(' ')}
                        aria-pressed={active}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.navRow}>
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button type="button" onClick={() => setStep(3)} disabled={teaches.length === 0}>
              Continue →
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={styles.stepPanel}>
          <p className={styles.stepHelp}>And what would you like to learn? Aim for two or three.</p>
          <div className={styles.categoryGrid}>
            {(Object.keys(SKILLS_BY_CATEGORY) as SkillCategory[]).map((cat) => (
              <div key={cat} className={styles.catBlock}>
                <h4 className={styles.catHead}>{SKILL_CATEGORY_LABELS[cat]}</h4>
                <div className={styles.chipRow}>
                  {SKILLS_BY_CATEGORY[cat].map((s) => {
                    const active = learns.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggle(setLearns, learns, s.id)}
                        className={[styles.choiceChip, active ? styles.active : ''].join(' ')}
                        aria-pressed={active}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.summary}>
            <span className={styles.summaryLabel}>You teach</span>
            <div className={styles.chipRow}>
              {teaches.map((id) => (
                <Chip key={id} variant="accent" size="sm">
                  {SKILL_INDEX[id]?.label}
                </Chip>
              ))}
            </div>
            <span className={styles.summaryLabel} style={{ marginTop: '1rem' }}>
              You learn
            </span>
            <div className={styles.chipRow}>
              {learns.map((id) => (
                <Chip key={id} variant="default" size="sm">
                  {SKILL_INDEX[id]?.label}
                </Chip>
              ))}
            </div>
          </div>
          {error && (
            <p role="alert" style={{ color: 'var(--accent)', fontSize: 'var(--t-body-s)' }}>
              {error}
            </p>
          )}
          <div className={styles.navRow}>
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Joining the network…' : 'Join the network →'}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};
