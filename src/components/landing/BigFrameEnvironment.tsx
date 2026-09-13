import { assets } from '../../lib/assets';

// Static architecture only; the original Frame and real website UI are separate layers.
export function BigFrameEnvironment() {
  return (
    <img className="big-frame-environment" src={assets.landingEnvironment}
      width={1460} height={1077} alt="" aria-hidden="true" fetchPriority="high"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'center', pointerEvents: 'none' }} />
  );
}
