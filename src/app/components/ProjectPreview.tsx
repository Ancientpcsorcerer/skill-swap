import { useRef } from 'react';
import type { Project } from '../data/models';
import { useWorkspace } from '../data/WorkspaceProvider';
import { useModalDialog } from '../../hooks/useModalDialog';
import { Artwork } from './Artwork';
import { Tags } from './UI';
export function ProjectPreview({project,onClose}:{project:Project|null;onClose:()=>void}) { const ref=useRef<HTMLDialogElement>(null); useModalDialog(ref,!!project); const workspace=useWorkspace(); return <dialog className="workspace-dialog project-preview" ref={ref} aria-labelledby="project-preview-title" onCancel={event=>{event.preventDefault();onClose();}} onClose={onClose} onClick={event=>{if(event.target===ref.current)onClose();}}><div className="workspace-dialog-content"><button type="button" className="workspace-dialog-close quiet-button" onClick={onClose} autoFocus>Close</button>{project&&<><Artwork art={project.art}/><h2 id="project-preview-title">{project.title}</h2><p>{project.description}</p><h3>Vision</h3><p>{project.vision}</p><h3>Skills to bring together</h3><Tags values={project.requiredSkills}/><button className="primary-button" onClick={()=>workspace.toggleSavedProject(project.id)}>{workspace.savedProjects.includes(project.id)?'Saved':'Save project'}</button></>}</div></dialog>; }
