import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSession } from '../session/SessionProvider';
import { sampleProjects } from './catalog';
import type { Activity, LearningRecord, Project } from './models';
interface WorkspaceState { projects: Project[]; learning: LearningRecord[]; goals: string[]; savedProjects: string[]; savedItems: string[]; communities: string[]; activity: Activity[] }
const initial: WorkspaceState = { projects: [], learning: [], goals: [], savedProjects: [], savedItems: [], communities: [], activity: [] };
function useWorkspaceController(userId: string) {
  const key = 'skill-swap.workspace.v1.' + userId;
  const [state, setState] = useState<WorkspaceState>(() => { try { const data = {...initial,...JSON.parse(localStorage.getItem(key) ?? 'null')}; return data && Object.keys(initial).every(key => Array.isArray(data[key])) ? data : initial; } catch { return initial; } });
  const [storageError, setStorageError] = useState('');
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(state)); setStorageError(''); } catch { setStorageError('Your latest changes could not be saved on this device.'); } }, [state, key]);
  function addProject(input: Omit<Project, 'id' | 'creatorId' | 'collaboratorIds' | 'members' | 'rating'>) {
    const project: Project = { ...input, id: crypto.randomUUID(), creatorId: userId, collaboratorIds: [], members: 1 };
    setState(previous => ({ ...previous, projects: [project,...previous.projects], activity: [{id:crypto.randomUUID(),kind:'project',title:'Created ' + project.title,description:project.description},...previous.activity] })); return project;
  }
  function updateProject(id: string, status: Project['status']) { setState(previous => ({ ...previous, projects: previous.projects.map(project => project.id === id ? {...project,status} : project) })); }
  function setLearning(pathId: string, status: LearningRecord['status']) { setState(previous => ({ ...previous, learning: [...previous.learning.filter(item => item.pathId !== pathId),{pathId,status,progress:status === 'Completed' ? 100 : previous.learning.find(item => item.pathId === pathId)?.progress ?? 0}] })); }
  function setGoal(goal: string) { if (goal.trim()) setState(previous => ({...previous,goals:[goal.trim(),...previous.goals.filter(item => item !== goal.trim())]})); }
  function toggle(field: 'savedProjects' | 'savedItems' | 'communities', id: string) { setState(previous => ({...previous,[field]:previous[field].includes(id) ? previous[field].filter(item => item !== id) : [...previous[field],id]})); }
  function joinProject(id: string) { const project = [...state.projects,...sampleProjects].find(item => item.id === id); if (!project) return; setState(previous => ({...previous,projects:[{...project,collaboratorIds:Array.from(new Set([...project.collaboratorIds,userId]))},...previous.projects.filter(item => item.id !== id)]})); }
  return { ...state, allProjects:[...state.projects,...sampleProjects.filter(project => !state.projects.some(item => item.id === project.id))], storageError, addProject, updateProject, setLearning, setGoal, toggleSavedProject:(id:string)=>toggle('savedProjects',id), toggleSavedItem:(id:string)=>toggle('savedItems',id), toggleCommunity:(id:string)=>toggle('communities',id), joinProject };
}
const Context = createContext<ReturnType<typeof useWorkspaceController> | null>(null);
export function WorkspaceProvider({children}:{children:ReactNode}) {
  const {session}=useSession();
  const userId = session?.identity.id || 'guest';
  const value=useWorkspaceController(userId);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useWorkspace() { const value=useContext(Context); if(!value) throw new Error('WorkspaceProvider is required'); return value; }
