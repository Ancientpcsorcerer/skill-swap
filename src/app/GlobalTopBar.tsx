import { useSession } from './session/SessionProvider';
import { Avatar } from './components/Avatar';
import { SearchIcon } from './components/SearchField';
import { Dropdown } from './components/Dropdown';
import { Icon } from './components/Icon';
import { moduleIds, navigate } from './navigation';
export function GlobalTopBar({onSearch}:{onSearch:()=>void}) { const{session,logout}=useSession();return <header className="workspace-topbar"><span className="workspace-brand">SKILL SWAP</span><div className="workspace-topbar-actions">
  <Dropdown label="Quick Access" trigger={<>Quick Access <Icon name="chevron"/></>} items={moduleIds.filter(id=>id!=='profile').map(id=>({label:id.toUpperCase(),action:()=>navigate(id)}))}/>
  <button type="button" className="workspace-icon-button" aria-label="Search people" onClick={onSearch}><SearchIcon/></button><div className="user-menu"><Dropdown label="User menu" trigger={<><Avatar name={session!.identity.name} small/><span>{session!.identity.name.split(' ')[0]}</span><Icon name="chevron"/></>} items={[{label:'My Profile',action:()=>navigate('profile')},{label:'Log out',action:()=>{logout();navigate('login');}}]}/></div>
  </div></header>; }
