import { useEffect, useRef, useState } from 'react';
import { useSession } from '../../app/session/SessionProvider';
import { SearchField } from '../../app/components/SearchField';
import { PageHero } from '../../app/components/PageHero';
import { Tabs, FilterControl } from '../../app/components/UI';
import { ProfilePreview } from '../profile/ProfilePreview';
import { useConnect } from './ConnectProvider';
import { matchesPerson, suggestPeople } from './selectors';
import { PersonRow } from './components/PersonRow';
import { ConnectionAction } from './components/ConnectionAction';
import { RequestsPanel } from './components/RequestsPanel';
import type { ConnectTab, Person } from './types';
export function ConnectModule({searchRequest=0,onSearchHandled}:{searchRequest?:number;onSearchHandled?:()=>void}) {
  const {session}=useSession(); const {people,loading,requests,error,announcement,retry,tab,setTab,query,setQuery}=useConnect();
  const [preview,setPreview]=useState<Person|null>(null); const [filter,setFilter]=useState('All'); const [sort,setSort]=useState('Relevance'); const search=useRef<HTMLInputElement>(null);
  useEffect(()=>{if(searchRequest){setTab('people');search.current?.focus();onSearchHandled?.();}},[searchRequest,setTab,onSearchHandled]);
  const suggestions = session ? suggestPeople(people, session.identity) : []; const candidates=tab==='suggested'?(suggestions.length?suggestions.map(item=>item.person):people.slice(0,6)):people;
  const listed=candidates.filter(person=>matchesPerson(person,query)&&(filter==='All'||person.skills.includes(filter))).sort((a,b)=>sort==='Name'?a.name.localeCompare(b.name):0);
  const count=requests.filter(request=>request.direction==='incoming'&&request.status==='pending').length;
  return <section className="connect-module"><PageHero core="connect" title={<>Meet people.<br/>Share ideas. Build together.</>} description="Find collaborators, mentors and like-minded people.">
    <div className="search-with-filter"><SearchField inputRef={search} label="Search the people directory" placeholder="Search people, skills, projects..." value={query} onChange={setQuery}/><FilterControl value={filter} onChange={setFilter} options={Array.from(new Set(people.flatMap(person=>person.skills))).sort()}/></div>
  </PageHero><div className="module-toolbar"><Tabs label="Connect sections" values={['People','Suggested','Requests']} value={tab[0].toUpperCase()+tab.slice(1)} onChange={value=>setTab(value.toLowerCase() as ConnectTab)}/><div className="toolbar-end"><span className="sample-label">Example profiles{tab==='requests'?' / '+count+' incoming':''}</span><label>Sort by <select aria-label="Sort people" value={sort} onChange={event=>setSort(event.target.value)}><option>Relevance</option><option>Name</option></select></label></div></div>
    <div className="workspace-sr-only" role="status">{announcement}</div>{error&&<p role="alert">{error} <button onClick={retry}>Try again</button></p>}
    {loading?<p className="workspace-empty">Loading people...</p>:tab==='requests'?<RequestsPanel onPreview={setPreview}/>:listed.length?<ul className="people-list people-grid">{listed.map(person=><PersonRow key={person.id} person={person} onPreview={setPreview} action={<ConnectionAction person={person}/>} note={tab==='suggested'?suggestions.find(item=>item.person.id===person.id)?.reason:undefined}/>)}</ul>:<div className="workspace-empty"><h2>No people found</h2><p>Try another name, skill or interest.</p><button className="quiet-button" onClick={()=>{setQuery('');setFilter('All');}}>Clear search</button></div>}
    <ProfilePreview person={preview} onClose={()=>setPreview(null)} action={preview?<ConnectionAction person={preview} onRespond={()=>setPreview(null)}/>:undefined}/>
  </section>;
}
