import { BigFrameEnvironment } from './BigFrameEnvironment';
import { assets } from '../../lib/assets';

// Background_1's 1460 x 1077 coordinate space: the central marble surface
// starts at y=780. A 486px opening matches the adjacent architectural height.
const frameHeight = 486;
const frameWidth = frameHeight * 225 / 519;
const marbleSurfaceY = 780;

export function HeroMedia() {
  return (
    <div className="plate" aria-hidden="true">
      <BigFrameEnvironment />
      <svg className="plate-frame" viewBox="0 0 1460 1077"
        preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        {/* Original artwork bounds; uniform scaling preserves every border proportion. */}
        <svg x={(1460 - frameWidth) / 2} y={marbleSurfaceY - frameHeight}
          width={frameWidth} height={frameHeight} viewBox="720 452 225 519">
          <image href={assets.landingFrame} width={1664} height={1248} />
        </svg>
      </svg>
    </div>
  );
}
