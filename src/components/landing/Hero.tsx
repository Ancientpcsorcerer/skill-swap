import { content } from '../../data/content';
import { PrimaryCTA } from '../ui/PrimaryCTA';

export function Hero({ onSignup, signupOpen }: { onSignup: () => void; signupOpen: boolean }) {
  return (
    <div className="hero">
      <h1 className="headline">{content.title}</h1>
      <PrimaryCTA className="pill-cta" onClick={onSignup} expanded={signupOpen} />
    </div>
  );
}
