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

export function HeroMedia({ onFrameClick, isEntering }: { onFrameClick?: () => void; isEntering?: boolean }) {
  return (
    <div className="plate" aria-hidden="true">
      <BigFrameEnvironment />
      <svg className="plate-frame" viewBox="0 0 1460 1077"
        preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        {/* Original artwork bounds; uniform scaling preserves every border proportion. */}
        <svg
          x={frameX}
          y={frameY}
          width={frameWidth}
          height={frameHeight}
          viewBox="720 452 225 519"
          className={`big-frame-portal ${isEntering ? 'is-entering' : ''}`}
          onClick={onFrameClick}
          role="button"
          tabIndex={0}
          aria-label="Enter Skill Swap through Big Frame portal"
          style={{
            cursor: isEntering ? 'default' : 'pointer',
            pointerEvents: 'auto',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onFrameClick?.();
            }
          }}
        >
          {/* Full hit-area rect ensuring clicks on both borders and interior trigger the portal */}
          <rect x="720" y="452" width="225" height="519" fill="transparent" pointerEvents="all" />
          <image href={assets.landingFrame} width={1664} height={1248} pointerEvents="all" />
        </svg>
      </svg>
    </div>
  );
}
