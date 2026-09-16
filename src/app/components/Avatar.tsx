import { Artwork } from './Artwork';

export function Avatar({
  name,
  small = false,
  personId,
  avatarUrl,
}: {
  name: string;
  small?: boolean;
  personId?: string;
  avatarUrl?: string | null;
}) {
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <span
      className={'workspace-avatar' + (small ? ' workspace-avatar--small' : '')}
      aria-hidden="true"
      style={{ overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '50%' }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      ) : personId && ['aarav', 'ishita', 'rohan', 'kavya', 'meera', 'arjun', 'nikhil', 'sara'].includes(personId) ? (
        <Artwork art={personId} />
      ) : (
        initials
      )}
    </span>
  );
}
