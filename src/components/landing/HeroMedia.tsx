import { BigFrameEnvironment } from './BigFrameEnvironment';
import { assets } from '../../lib/assets';

export function HeroMedia() {
  return (
    <div className="plate" aria-hidden="true">
      <BigFrameEnvironment />
      <img className="plate-frame" src={assets.landingFrame} width={1664} height={1248}
        alt="" fetchPriority="high" />
    </div>
  );
}
