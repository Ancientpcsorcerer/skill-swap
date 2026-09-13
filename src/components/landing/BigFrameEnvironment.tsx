import background from '../../../Ideas/Background_1.png';

// Display the complete, unmodified source image beneath the existing Frame.
export function BigFrameEnvironment() {
  return (
    <img
      className="big-frame-environment"
      src={background}
      width={1460}
      height={1077}
      alt=""
      aria-hidden="true"
      fetchPriority="high"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'contain', objectPosition: 'center', pointerEvents: 'none' }}
    />
  );
}
