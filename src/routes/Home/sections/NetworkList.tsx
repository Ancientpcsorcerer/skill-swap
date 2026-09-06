import { PROFILES } from '@/data/profiles';
import { SKILL_INDEX } from '@/data/skills';
import { TRADES } from '@/data/exchanges';

// A visually-hidden list of the network. Paired with the 3D scene so
// screen-reader users get the same data structure that sighted users
// experience as a constellation. Also serves as the full DOM equivalent
// when WebGL is unavailable.
export const NetworkList = () => {
  return (
    <ul
      aria-label={`The network: ${PROFILES.length} people and ${TRADES.length} recent exchanges`}
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {PROFILES.map((p) => {
        const teach = p.teaches.map((id) => SKILL_INDEX[id]?.label).filter(Boolean);
        const learn = p.learns.map((id) => SKILL_INDEX[id]?.label).filter(Boolean);
        return (
          <li key={p.id}>
            <strong>{p.name}</strong> in {p.location}.{' '}
            Teaches: {teach.join(', ')}.{' '}
            Wants to learn: {learn.join(', ')}.{' '}
            {p.hoursGiven} hours given, {p.hoursReceived} received. Trust: {p.trust}.
          </li>
        );
      })}
    </ul>
  );
};
