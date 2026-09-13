import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { GlobalTopBar } from './GlobalTopBar';
import { GlobalSidebar } from './GlobalSidebar';
import { navigate, type ModuleId } from './navigation';
import { WorkspaceProvider, useWorkspace } from './data/WorkspaceProvider';
import { ConnectProvider } from '../modules/connect/ConnectProvider';
import { ConnectModule } from '../modules/connect/ConnectModule';
import { ProfileModule } from '../modules/profile/ProfileModule';
import { CreateModule } from '../modules/create/CreateModule';
import { LearnModule } from '../modules/learn/LearnModule';
import { DiscoverModule } from '../modules/discover/DiscoverModule';
const modules={profile:ProfileModule,connect:ConnectModule,create:CreateModule,learn:LearnModule,discover:DiscoverModule};
function Shell({active}:{active:ModuleId}) { const[searchRequest,setSearchRequest]=useState(0);const handledSearch=useCallback(()=>setSearchRequest(0),[]);const main=useRef<HTMLElement>(null);const previous=useRef(active);const{storageError}=useWorkspace();
  useLayoutEffect(()=>{if(previous.current!==active){main.current?.scrollTo(0,0);main.current?.focus({preventScroll:true});}previous.current=active;},[active]);const Module=modules[active];
  return <div className="application-shell" data-active-module={active}><a className="workspace-skip" href="#workspace-content" onClick={event=>{event.preventDefault();main.current?.focus();}}>Skip to content</a><GlobalTopBar onSearch={()=>{navigate('connect');setSearchRequest(value=>value+1);}}/><GlobalSidebar active={active}/><main id="workspace-content" className="workspace-content" ref={main} tabIndex={-1}><Module searchRequest={searchRequest} onSearchHandled={handledSearch}/>{storageError&&<p role="alert" className="storage-error">{storageError}</p>}</main></div>;
}
export function ApplicationShell({active}:{active:ModuleId}){return <ConnectProvider><WorkspaceProvider><Shell active={active}/></WorkspaceProvider></ConnectProvider>;}
