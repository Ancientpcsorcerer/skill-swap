import { Header } from '../components/layout/Header';
import { Hero } from '../components/landing/Hero';

export function LandingSection({ onSignup, signupOpen }: { onSignup: () => void; signupOpen: boolean }) {
  return (
    <section className="stage" aria-label="Skill Swap landing">
      <Header onSignup={onSignup} signupOpen={signupOpen} />
      <Hero onSignup={onSignup} signupOpen={signupOpen} />
    </section>
  );
}
