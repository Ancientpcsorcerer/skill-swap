import { useId } from 'react';

// Top faces traced from the 1672 x 941 Connect_1_1 source, not the annotated depth sheet.
// Corner-local coordinates preserve angle/width without cropping either structure on phones.
const slabs = {
  upper: {
    size: 640,
    face: 'M49 0H171L640 452V569Z',
    side: 'M-3 -50L692 619L682 632L-13 -37Z',
    shadow: 'M-3 -50H119L692 502V619Z',
    inset: 'M114 0H165L640 458V509Z',
    lip: 'M114 0L640 509',
    outer: 'M49 0L640 569',
  },
  lower: {
    size: 600,
    face: 'M0 35L535 600H406L0 165Z',
    side: 'M-50 111L453 650L443 663L-60 124Z',
    shadow: 'M-50 -18L583 650H453L-50 111Z',
    inset: 'M0 105L469 600H413L0 159Z',
    lip: 'M0 105L469 600',
    outer: 'M0 35L535 600',
  },
} as const;

function Slab({ corner }: { corner: keyof typeof slabs }) {
  const id = useId().replaceAll(':', '');
  const slab = slabs[corner];
  return (
    <svg className={`connect-slab connect-slab--${corner}`} viewBox={`0 0 ${slab.size} ${slab.size}`}
      aria-hidden="true" focusable="false" data-source-face={slab.face}>
      <defs>
        <linearGradient id={`${id}-black`} x1="0" y1="1" x2="1" y2="0">
          <stop stopColor="#080909" /><stop offset=".48" stopColor="#171818" /><stop offset="1" stopColor="#252626" />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#767878" /><stop offset=".35" stopColor="#a0a2a1" />
          <stop offset=".62" stopColor="#888b8a" /><stop offset="1" stopColor="#606363" />
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#1b1d1c" /><stop offset=".5" stopColor="#101212" /><stop offset="1" stopColor="#030505" />
        </linearGradient>
        <filter id={`${id}-cast`} x="-30%" y="-30%" width="170%" height="170%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="17" />
        </filter>
        <filter id={`${id}-contact`} x="-15%" y="-15%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id={`${id}-brushed`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".6 .035" numOctaves="2" seed="8" />
          <feColorMatrix type="saturate" values="0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <clipPath id={`${id}-inset`}><path d={slab.inset} /></clipPath>
      </defs>
      <path d={slab.shadow} fill="#49483f" opacity=".38" transform="translate(-18 29)" filter={`url(#${id}-cast)`} />
      <path d={slab.shadow} fill="#171a17" opacity=".5" transform="translate(-10 16)" filter={`url(#${id}-contact)`} />
      <path d={slab.side} fill={`url(#${id}-side)`} />
      <path d={slab.face} fill={`url(#${id}-black)`} />
      <path d={slab.outer} fill="none" stroke="#747672" strokeWidth="1.2" opacity=".5" />
      <path d={slab.inset} fill={`url(#${id}-metal)`} />
      <g clipPath={`url(#${id}-inset)`} opacity=".09">
        <path d={slab.inset} filter={`url(#${id}-brushed)`} />
      </g>
      <path d={slab.lip} fill="none" stroke="#e4e5df" strokeWidth="1.6" opacity=".85" />
    </svg>
  );
}

export function ConnectEnvironment() {
  const id = useId().replaceAll(':', '');
  return (
    <div className="connect-environment" role="img" aria-label="Ivory architectural environment with two diagonal black slabs and inset gray metal strips">
      <svg className="connect-surface" width="100%" height="100%" aria-hidden="true" focusable="false">
        <filter id={`${id}-surface`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="12" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id}-surface)`} opacity=".055" />
      </svg>
      <Slab corner="upper" />
      <Slab corner="lower" />
    </div>
  );
}


