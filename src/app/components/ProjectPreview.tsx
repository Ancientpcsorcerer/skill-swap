import { useRef, useState } from 'react';
import type { Project } from '../data/models';
import { useWorkspace } from '../data/WorkspaceProvider';
import { useSession } from '../session/SessionProvider';
import { useAuthGate } from '../session/AuthGateContext';
import { useModalDialog } from '../../hooks/useModalDialog';
import { Artwork } from './Artwork';
import { Tags } from './UI';
import { api } from '../../lib/api';

export function ProjectPreview({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useModalDialog(ref, !!project);
  const workspace = useWorkspace();
  const { session } = useSession();
  const { requireAuth } = useAuthGate();
  const [following, setFollowing] = useState(false);
  const [joined, setJoined] = useState(false);
  const [recreating, setRecreating] = useState(false);
  const [toast, setToast] = useState('');

  if (!project) return null;

  const isFollowing = project.is_following || following;
  const isMember = session && project.collaboratorIds?.includes(session.identity.id);
  const isCreator = session && project.creatorId === session.identity.id;

  const handleFollow = async () => {
    if (!requireAuth('follow this project', () => handleFollow())) return;
    try {
      if (isFollowing) {
        await workspace.unfollowProject(project.id);
        setFollowing(false);
        setToast('Unfollowed project');
      } else {
        await workspace.followProject(project.id);
        setFollowing(true);
        setToast('Now following project');
      }
    } catch (err: any) {
      setToast(err?.message || 'Action failed');
    }
  };

  const handleJoin = async () => {
    if (!requireAuth('join this project team', () => handleJoin())) return;
    try {
      await workspace.joinProject(project.id);
      setJoined(true);
      setToast('Joined project team!');
    } catch (err: any) {
      setToast(err?.message || 'Could not join project');
    }
  };

  const handleRecreate = async () => {
    if (!requireAuth('recreate this project', () => handleRecreate())) return;
    try {
      setRecreating(true);
      const newProj = await api.projects.recreate(project.id);
      workspace.addProject(newProj);
      setToast(`Project recreated as "${newProj.title}"!`);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setToast(err?.message || 'Could not recreate project');
    } finally {
      setRecreating(false);
    }
  };

  const coverUrl = project.coverImageUrl || project.cover_image_url;

  return (
    <dialog
      className="workspace-dialog project-preview"
      ref={ref}
      aria-labelledby="project-preview-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="workspace-dialog-content">
        <button type="button" className="workspace-dialog-close quiet-button" onClick={onClose} autoFocus>
          Close
        </button>

        {coverUrl ? (
          <div style={{ width: '100%', maxHeight: '240px', overflow: 'hidden', borderRadius: '8px', marginBottom: '12px' }}>
            <img src={coverUrl} alt={project.title} style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
          </div>
        ) : (
          <Artwork art={project.art} />
        )}

        <h2 id="project-preview-title">{project.title}</h2>
        {project.visibility && (
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: project.visibility === 'private' ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
            {project.visibility === 'private' ? '🔒 Private Project' : '🌐 Public Project'}
          </span>
        )}
        <p>{project.description}</p>
        <h3>Vision</h3>
        <p>{project.vision}</p>
        <h3>Skills to bring together</h3>
        <Tags values={project.requiredSkills} />

        {toast && (
          <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '0.85rem', margin: '8px 0' }}>
            {toast}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
          <button
            type="button"
            className="primary-button"
            onClick={() => workspace.toggleSavedProject(project.id)}
          >
            {workspace.savedProjects.includes(project.id) ? 'Saved' : 'Save project'}
          </button>

          {!isCreator && (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={handleFollow}
              >
                {isFollowing ? 'Following ✓' : 'Follow Project'}
              </button>

              <button
                type="button"
                className="secondary-button"
                disabled={isMember || joined}
                onClick={handleJoin}
              >
                {isMember || joined ? 'Team Member ✓' : 'Join Team'}
              </button>

              {project.visibility !== 'private' && (
                <button
                  type="button"
                  className="quiet-button"
                  disabled={recreating}
                  onClick={handleRecreate}
                >
                  {recreating ? 'Recreating...' : 'Recreate Project ⎘'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
