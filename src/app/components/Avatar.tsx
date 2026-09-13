import { Artwork } from './Artwork';
export function Avatar({ name, small = false, personId }: { name: string; small?: boolean; personId?: string }) {
  const initials = name.split(' ').slice(0,2).map(part => part[0]).join('');
  return <span className={'workspace-avatar' + (small ? ' workspace-avatar--small' : '')} aria-hidden="true">{personId && ['aarav','ishita','rohan','kavya','meera','arjun','nikhil','sara'].includes(personId) ? <Artwork art={personId} /> : initials}</span>;
}
