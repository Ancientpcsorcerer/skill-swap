import { BigFrameEnvironment } from './BigFrameEnvironment';
import { assets } from '../../lib/assets';

// Background_1's 1460 x 1077 coordinate space:
// The central architectural opening spans x=681 to x=895 (center x=788) with lintel at y=289.
// The marble terrace surface plane is at y=780.
// A 491px height aligns the frame base directly onto the marble floor with zero gap,
// fitting the architectural portal opening while preserving the exact 225/519 frame aspect ratio.
const frameHeight = 491;
const frameWidth = frameHeight * 225 / 519;
const marbleSurfaceY = 780;
const frameCenterX = 788;
const frameX = frameCenterX - frameWidth / 2;
const frameY = marbleSurfaceY - frameHeight;

export function HeroMedia() {
  return (
    <div className="plate" aria-hidden="true">
      <BigFrameEnvironment />
      <svg className="plate-frame" viewBox="0 0 1460 1077"
        preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        {/* Original artwork bounds; uniform scaling preserves every border proportion. */}
        <svg x={frameX} y={frameY}
          width={frameWidth} height={frameHeight} viewBox="720 452 225 519">
          <image href={assets.landingFrame} width={1664} height={1248} />
        </svg>
      </svg>
    </div>
  );
}
