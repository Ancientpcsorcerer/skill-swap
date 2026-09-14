import { useRef, useState } from 'react';
import { LandingSection } from '../sections/LandingSection';
import { HeroMedia } from '../components/landing/HeroMedia';
import { SignupModal } from '../components/auth/SignupModal';
import { FrameTransition } from '../components/frame/FrameTransition';
import { CoreExperience } from '../components/core/CoreExperience';
import { CinematicJourney } from '../components/landing/CinematicJourney';
import { samplePostZoom } from '../lib/checkpoints';
import type { AuthState, ExperienceState } from '../types/experience';

export function App({ onEnterConnect }: { onEnterConnect?: (targetCore?: string) => void }) {
  const [authState] = useState<AuthState>('guest');
  const [signupOpen, setSignupOpen] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const track = useRef<HTMLElement>(null);

  const handleFrameClick = () => {
    if (isEntering) return;
    setIsEntering(true);
    // Smooth cinematic zoom into portal (680ms), then unveil the Cinematic Journey!
    setTimeout(() => {
      setShowJourney(true);
    }, 680);
  };

  const handleEnterCore = (targetCore = 'connect') => {
    onEnterConnect?.(targetCore);
  };

  const frameProgress = 0;
  const transitionProgress = 0;
  const checkpoint = samplePostZoom(0, 0);
  const experience: ExperienceState = isEntering ? 'post-zoom-light' : 'landing';

  return (
    <div className="app-shell" data-auth-state={authState} data-experience-state={experience}
      data-checkpoint-state={checkpoint.phase} data-entering={isEntering ? 'true' : 'false'}>
      <main>
        <section ref={track} id="landing" className="experience-track" aria-label="Skill Swap experience"
          data-progress={frameProgress.toFixed(4)} data-transition-progress={transitionProgress.toFixed(6)}>
          <div id="frame" className="frame-checkpoint" aria-hidden="true" />
          <FrameTransition progress={frameProgress} checkpoint={checkpoint} isEntering={isEntering}
            media={<HeroMedia onFrameClick={handleFrameClick} isEntering={isEntering} />}
            landing={<LandingSection onSignup={() => setSignupOpen(true)} signupOpen={signupOpen} />}>
            <CoreExperience position={0} active={false} available={false} />
          </FrameTransition>
        </section>
      </main>

      {/* Cinematic Narrative Journey: Features, Live Examples, Masteries & Core Gateway */}
      {showJourney && (
        <CinematicJourney
          onEnterCore={handleEnterCore}
          onExitJourney={() => {
            setShowJourney(false);
            setIsEntering(false);
          }}
        />
      )}

      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} />
    </div>
  );
}
