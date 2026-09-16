import type { ReactNode } from 'react';
import { Avatar } from '../../../app/components/Avatar';
import { Dropdown } from '../../../app/components/Dropdown';
import { Icon } from '../../../app/components/Icon';
import { Tags } from '../../../app/components/UI';
import type { Person } from '../types';
import { navigate } from '../../../app/navigation';
export function PersonRow({ person, onPreview, action, note, variant = 'directory' }: { person: Person; onPreview: (person: Person) => void; action: ReactNode; note?: string; variant?: 'directory'|'mentor'|'compact' }) {
  return <li className={'person-row person-row--'+variant} data-person-id={person.id}>
    <button className="person-avatar-button" type="button" onClick={()=>onPreview(person)} aria-label={'Preview '+person.name}><Avatar name={person.name} avatarUrl={person.avatarUrl || person.avatar_url} personId={['aarav','ishita','rohan','kavya','meera','arjun','nikhil','sara'].includes(person.id)?person.id:undefined}/></button>
    <div className="person-summary"><button className="person-name" type="button" onClick={()=>onPreview(person)}>{person.name}</button><p className="person-username">@{person.username ?? person.name.toLowerCase().replace(/[^a-z]/g,'')}</p>
      <p className="person-description">{person.description}</p><Tags values={person.skills}/>{note&&<p className="person-match">{note}</p>}</div>
    <div className="person-action">{action}</div>{variant==='directory'&&<Dropdown label={'More about '+person.name} trigger={<Icon name="more"/>} items={[{label:'Preview profile',action:()=>onPreview(person)},{label:'Full profile page',action:()=>navigate('profile',undefined,false,{user:person.id})}]}/>}
  </li>;
}
