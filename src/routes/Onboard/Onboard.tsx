import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/store/user';
import { JoinForm } from '@/routes/Home/sections/JoinForm';
import { Button } from '@/components/primitives/Button';
import styles from './Onboard.module.css';

const Onboard = () => {
  const user = useUser((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.onboardedAt) {
      navigate('/me', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <span className={styles.eyebrow}>Join the network</span>
        <h1 className={styles.title}>
          Three steps.
          <br />
          One hour. <em>Yours.</em>
        </h1>
        <p className={styles.copy}>
          We'll set up your profile, find the people in the network who can teach what you want to learn (and want to learn what you can teach), and introduce you. No passwords to remember, no newsletters to unsubscribe from later.
        </p>
      </div>
      <div className={styles.formWrap}>
        <JoinForm />
        <div className={styles.altRow}>
          <span>Not ready yet?</span>
          <Button type="button" variant="ghost" onClick={() => navigate('/discover')}>
            Browse the network
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboard;
export { Onboard };
