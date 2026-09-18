import { useRef, useState } from 'react';
import type { Project } from '../data/models';
import { useWorkspace } from '../data/WorkspaceProvider';
import { useSession } from '../session/SessionProvider';
import { useAuthGate } from '../session/AuthGateContext';
import { useModalDialog } from '../../hooks/useModalDialog';
import { Artwork } from './Artwork';
import { Tags } from './UI';
import { api } from '../../lib/api';
import { CommentSection } from '../../components/social/CommentSection';

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

  // Edit / Report state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(project?.title || '');
  const [editDesc, setEditDesc] = useState(project?.description || '');
  const [editVision, setEditVision] = useState(project?.vision || '');
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');

  if (!project) return null;

  const currentUserId = session?.identity.id || '';
  const isFollowing = project.is_following || following;
  const isMember = session && project.collaboratorIds?.includes(currentUserId);
  const isCreator = session && project.creatorId === currentUserId;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleLike = async () => {
    if (!requireAuth('like this project', () => handleLike())) return;
    try {
      if (project.has_liked) {
        await workspace.unlikeProject(project.id);
      } else {
        await workspace.likeProject(project.id);
      }
    } catch (err: any) {
      showToast(err?.message || 'Like failed');
    }
  };

  const handleRepost = async () => {
    if (!requireAuth('repost this project', () => handleRepost())) return;
    try {
      if (project.has_reposted) {
        await workspace.unrepostProject(project.id);
      } else {
        await workspace.repostProject(project.id);
      }
    } catch (err: any) {
      showToast(err?.message || 'Repost failed');
    }
  };

  const handleFollow = async () => {
    if (!requireAuth('follow this project', () => handleFollow())) return;
    try {
      if (isFollowing) {
        await workspace.unfollowProject(project.id);
        setFollowing(false);
        showToast('Unfollowed project');
      } else {
        await workspace.followProject(project.id);
        setFollowing(true);
        showToast('Now following project');
      }
    } catch (err: any) {
      showToast(err?.message || 'Action failed');
    }
  };

  const handleJoin = async () => {
    if (!requireAuth('join this project team', () => handleJoin())) return;
    try {
      await workspace.joinProject(project.id);
      setJoined(true);
      showToast('Joined project team!');
    } catch (err: any) {
      showToast(err?.message || 'Could not join project');
    }
  };

  const handleRecreate = async () => {
    if (!requireAuth('recreate this project', () => handleRecreate())) return;
    try {
      setRecreating(true);
      const newProj = await api.projects.recreate(project.id);
      workspace.addProject(newProj);
      showToast(`Project recreated as "${newProj.title}"!`);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      showToast(err?.message || 'Could not recreate project');
    } finally {
      setRecreating(false);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}#/app/discover?project=${encodeURIComponent(project.id)}`;
    navigator.clipboard.writeText(link);
    showToast('Link copied to clipboard');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDesc.trim()) return;
    try {
      await workspace.updateProjectFull(project.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        vision: editVision.trim(),
      });
      setIsEditing(false);
      showToast('Project updated');
    } catch (err: any) {
      showToast(err.message || 'Failed to update project');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await workspace.deleteProject(project.id);
      showToast('Project deleted');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete project');
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    try {
      await api.projects.report(project.id, reportReason.trim());
      setIsReporting(false);
      setReportReason('');
      showToast('Project reported for review');
    } catch (err: any) {
      showToast(err.message || 'Failed to report project');
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

        {isEditing ? (
          <form onSubmit={handleSaveEdit} style={{ padding: '10px 0' }}>
            <input
              type="text"
              className="chat-search-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ marginBottom: '8px', fontWeight: 700, fontSize: '16px' }}
              placeholder="Project title"
              autoFocus
            />
            <textarea
              className="chat-composer-input"
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              style={{ marginBottom: '8px' }}
              placeholder="Description"
            />
            <textarea
              className="chat-composer-input"
              rows={2}
              value={editVision}
              onChange={(e) => setEditVision(e.target.value)}
              style={{ marginBottom: '8px' }}
              placeholder="Vision"
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="primary-button" style={{ fontSize: '12px', padding: '4px 12px' }}>
                Save Changes
              </button>
              <button
                type="button"
                className="quiet-button"
                style={{ fontSize: '12px' }}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <h2 id="project-preview-title">{project.title}</h2>
            {project.visibility && (
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: project.visibility === 'private' ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                {project.visibility === 'private' ? '🔒 Private Project' : '🌐 Public Project'}
              </span>
            )}
            <p>{project.description}</p>
            <h3>Vision</h3>
            <p>{project.vision}</p>
          </>
        )}

        <h3>Skills to bring together</h3>
        <Tags values={project.requiredSkills || []} />

        {toast && (
          <div style={{ padding: '6px 12px', background: 'var(--sw-canvas-warm)', border: '1px solid var(--sw-line-standard)', borderRadius: '6px', fontSize: '0.85rem', margin: '8px 0' }}>
            {toast}
          </div>
        )}

        {/* Report Dialog */}
        {isReporting && (
          <form onSubmit={handleReport} style={{ padding: '10px 0', borderTop: '1px solid var(--sw-line-standard)' }}>
            <strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Report this project:</strong>
            <input
              type="text"
              className="chat-search-input"
              placeholder="Reason for report..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              style={{ marginBottom: '8px' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="primary-button" style={{ fontSize: '12px', padding: '4px 12px' }}>
                Submit Report
              </button>
              <button
                type="button"
                className="quiet-button"
                style={{ fontSize: '12px' }}
                onClick={() => setIsReporting(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Action Bar: Likes, Reposts, Follow, Join, Recreate (Posts use Save; Projects do not) */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--sw-line-standard)' }}>
          <button
            type="button"
            className={`secondary-button ${project.has_liked ? 'active' : ''}`}
            onClick={handleLike}
            style={{ fontSize: '12.5px', color: project.has_liked ? '#ef4444' : 'inherit' }}
          >
            <span>{project.has_liked ? '♥' : '♡'}</span> {project.like_count ?? 0} Likes
          </button>

          <button
            type="button"
            className={`secondary-button ${project.has_reposted ? 'active' : ''}`}
            onClick={handleRepost}
            style={{ fontSize: '12.5px' }}
          >
            🔁 {project.repost_count ?? 0} Reposts
          </button>

          {!isCreator && (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={handleFollow}
                style={{ fontSize: '12.5px' }}
              >
                {isFollowing ? 'Following ✓' : 'Follow Project'}
              </button>

              <button
                type="button"
                className="secondary-button"
                disabled={isMember || joined}
                onClick={handleJoin}
                style={{ fontSize: '12.5px' }}
              >
                {isMember || joined ? 'Team Member ✓' : 'Join Team'}
              </button>

              {project.visibility !== 'private' && (
                <button
                  type="button"
                  className="quiet-button"
                  disabled={recreating}
                  onClick={handleRecreate}
                  style={{ fontSize: '12.5px' }}
                >
                  {recreating ? 'Recreating...' : 'Recreate Project ⎘'}
                </button>
              )}
            </>
          )}

          <button
            type="button"
            className="quiet-button"
            onClick={handleCopyLink}
            style={{ fontSize: '12.5px' }}
          >
            ⎘ Share
          </button>

          {isCreator ? (
            <>
              <button
                type="button"
                className="quiet-button"
                onClick={() => {
                  setEditTitle(project.title);
                  setEditDesc(project.description);
                  setEditVision(project.vision);
                  setIsEditing(true);
                }}
                style={{ fontSize: '12.5px' }}
              >
                ✎ Edit
              </button>
              <button
                type="button"
                className="quiet-button"
                onClick={handleDelete}
                style={{ fontSize: '12.5px', color: '#dc2626' }}
              >
                ✕ Delete
              </button>
            </>
          ) : (
            <button
              type="button"
              className="quiet-button"
              onClick={() => setIsReporting(true)}
              style={{ fontSize: '12.5px' }}
            >
              ⚑ Report
            </button>
          )}
        </div>

        {/* Real Canonical Comments Tree */}
        <CommentSection
          targetType="project"
          targetId={project.id}
          targetAuthorId={project.creatorId}
        />
      </div>
    </dialog>
  );
}
