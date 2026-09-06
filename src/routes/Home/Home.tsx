import { useEffect, useMemo, useRef, useState } from 'react';
import { useGraph } from '@/store/graph';
import { detectGPUTier } from '@/lib/gpu';
import { prefersReducedMotion } from '@/lib/gsap';
import { Masthead } from './sections/Masthead';
import { KnowsSomething } from './sections/KnowsSomething';
import { WantsToLearn } from './sections/WantsToLearn';
import { Exchange } from './sections/Exchange';
import { Community } from './sections/Community';
import { BeOneOfThem } from './sections/BeOneOfThem';
import { NetworkList } from './sections/NetworkList';
import { ConstellationScene } from './scene/ConstellationScene';
import styles from './Home.module.css';

const Home = () => {
  const pinRef = useRef<HTMLDivElement>(null);
  const [pinProgress, setPinProgress] = useState(0);
  const setCameraProgress = useGraph((s) => s.setCameraProgress);
  const gpuTier = useMemo(() => detectGPUTier(), []);
  const reduced = useMemo(() => prefersReducedMotion(), []);

  useEffect(() => {
    if (reduced) return;

    // Cache layout values that don't change on scroll.
    const pin = pinRef.current;
    if (!pin) return;
    const total = pin.offsetHeight - window.innerHeight;
    const pinTop = pin.getBoundingClientRect().top + window.scrollY;

    let frame = 0;
    const update = () => {
      frame = 0;
      const scrolled = Math.max(0, window.scrollY - pinTop);
      const progress = Math.min(1, Math.max(0, scrolled / total));
      setPinProgress(progress);
      setCameraProgress(progress);
    };
    const onScroll = () => {
      // Coalesce scroll events into a single rAF tick. Avoids layout
      // flushes on every wheel event.
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
    };
  }, [setCameraProgress, reduced]);

  return (
    <article className={styles.home}>
      <Masthead />

      <div
        ref={pinRef}
        className={styles.pinWrap}
        data-reduced={reduced ? 'true' : 'false'}
      >
        <div
          className={styles.canvasFixed}
          role="img"
          aria-label="A network of 20 people connected by skill exchanges. Aria and Mateo are the focal points of the story."
        >
          <ConstellationScene gpuTier={gpuTier} />
          <NetworkList />
        </div>
        <div className={styles.pinInner}>
          <KnowsSomething progress={reduced ? 1 : pinProgress} static={reduced} />
          <WantsToLearn progress={reduced ? 1 : pinProgress} static={reduced} />
          <Exchange progress={reduced ? 1 : pinProgress} static={reduced} />
          <Community progress={reduced ? 1 : pinProgress} static={reduced} />
        </div>
      </div>

      <BeOneOfThem />
    </article>
  );
};

export default Home;
export { Home };
