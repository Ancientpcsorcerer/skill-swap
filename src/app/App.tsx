import { CinematicEntry } from './CinematicEntry';
import { useRef, useState, type CSSProperties } from 'react';
import { CORE_SCROLL_VIEWPORTS } from '../components/core/CoreSystem';
import { LandingSection } from '../sections/LandingSection';
import { HeroMedia } from '../components/landing/HeroMedia';
import { SignupModal } from '../components/auth/SignupModal';
import { FrameTransition } from '../components/frame/FrameTransition';
import { CoreExperience } from '../components/core/CoreExperience';
import { useFrameProgress } from '../hooks/useFrameProgress';
import { samplePostZoom } from '../lib/checkpoints';
import type { AuthState, ExperienceState } from '../types/experience';

export function App({ onEnterConnect }: { onEnterConnect?: () => void }) {
  const [authState] = useState<AuthState>('guest');
  const [signupOpen, setSignupOpen] = useState(false);
  const track = useRef<HTMLElement>(null);
  const { frameProgress, transitionProgress, connectProgress: coreTrackProgress, experience: frameExperience } = useFrameProgress(track, CORE_SCROLL_VIEWPORTS);
  const checkpoint = samplePostZoom(frameProgress, transitionProgress);
  const experience: ExperienceState = checkpoint.phase === 'FRAME_ZOOM' ? frameExperience
    : checkpoint.phase === 'POST_ZOOM_LIGHT' ? 'post-zoom-light'
    : checkpoint.phase === 'CONNECT_REVEAL' ? 'connect-reveal' : 'core';

  return (
    <div className="app-shell" data-auth-state={authState} data-experience-state={experience}
      data-checkpoint-state={checkpoint.phase}>
      {frameProgress < 1 && <a className="skip-link" href="#frame">Skip to Frame</a>}
      <main>
        <section ref={track} id="landing" className="experience-track" aria-label="Skill Swap experience"
          style={{ '--connect-scroll-height': String(CORE_SCROLL_VIEWPORTS * 100) + 'dvh' } as CSSProperties}
          data-progress={frameProgress.toFixed(4)} data-transition-progress={transitionProgress.toFixed(6)}>
          <div id="frame" className="frame-checkpoint" aria-hidden="true" />
          <FrameTransition progress={frameProgress} checkpoint={checkpoint}
            media={<HeroMedia />}
            landing={<LandingSection onSignup={() => setSignupOpen(true)} signupOpen={signupOpen} />}>
            <CoreExperience position={coreTrackProgress * CORE_SCROLL_VIEWPORTS}
              active={transitionProgress === 1} available={frameProgress >= .5} />
          </FrameTransition>
        </section>
      </main>
      {onEnterConnect && <CinematicEntry enabled={transitionProgress === 1 && coreTrackProgress === 1} onEnter={onEnterConnect} />}
      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} />
    </div>
  );
}
