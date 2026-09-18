import { useState } from 'react';
import { Avatar } from './Avatar';
import { Artwork } from './Artwork';
import { Tags } from './UI';
import { useSession } from '../session/SessionProvider';
import { useAuthGate } from '../session/AuthGateContext';
import { useWorkspace } from '../data/WorkspaceProvider';
import { api } from '../../lib/api';
import type { Project } from '../data/models';

export function ProjectCard({ project, onOpen }: { project: Project; onOpen: (project: Project) => void }) {
  const { session } = useSession();
  const { requireAuth } = useAuthGate();
  const workspace = useWorkspace();

  const currentUserId = session?.identity.id || '';
  const isOwner = project.creatorId === currentUserId;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(project.title);
  const [editDesc, setEditDesc] = useState(project.description);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [toast, setToast] = useState('');

  const coverUrl = project.coverImageUrl || project.cover_image_url;
  const collaborators = project.collaboratorIds || [];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth('like this project', () => handleLike(e))) return;
    try {
      if (project.has_liked) {
        await workspace.unlikeProject(project.id);
      } else {
        await workspace.likeProject(project.id);
      }
    } catch (err: any) {
      console.error('Like project failed:', err);
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth('repost this project', () => handleRepost(e))) return;
    try {
      if (project.has_reposted) {
        await workspace.unrepostProject(project.id);
      } else {
        await workspace.repostProject(project.id);
      }
    } catch (err: any) {
      console.error('Repost project failed:', err);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    const link = `${window.location.origin}${window.location.pathname}#/app/discover?project=${encodeURIComponent(project.id)}`;
    navigator.clipboard.writeText(link);
    showToast('Link copied to clipboard');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editTitle.trim() || !editDesc.trim()) return;
    try {
      await workspace.updateProjectFull(project.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
      });
      setIsEditing(false);
      showToast('Project updated');
    } catch (err: any) {
      showToast(err.message || 'Failed to update project');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await workspace.deleteProject(project.id);
      showToast('Project deleted');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete project');
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <article className="project-card" style={{ position: 'relative' }}>
      {toast && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--sw-ink-primary)', color: 'var(--sw-ink-inverse)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', zIndex: 60 }}>
          {toast}
        </div>
      )}

      {/* Options menu button */}
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="quiet-button"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(2px)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: '14px', lineHeight: 1 }}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Project options"
        >
          •••
        </button>

        {isMenuOpen && (
          <div
            className="chat-message-action-menu"
            style={{ right: 0, top: '100%', minWidth: '130px', zIndex: 100 }}
          >
            {isOwner ? (
              <>
                <button
                  type="button"
                  className="chat-action-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setEditTitle(project.title);
                    setEditDesc(project.description);
                    setIsEditing(true);
                  }}
                >
                  ✎ Edit Project
                </button>
                <button
                  type="button"
                  className="chat-action-menu-item is-danger"
                  onClick={handleDelete}
                >
                  ✕ Delete Project
                </button>
                <button
                  type="button"
                  className="chat-action-menu-item"
                  onClick={handleCopyLink}
                >
                  ⎘ Copy Link
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="chat-action-menu-item"
                  onClick={handleCopyLink}
                >
                  ⎘ Copy Link
                </button>
                <button
                  type="button"
                  className="chat-action-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsReporting(true);
                  }}
                >
                  ⚑ Report Project
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        className="project-art-button"
        onClick={() => onOpen(project)}
        aria-label={'View ' + project.title}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={project.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '8px' }}
          />
        ) : (
          <Artwork art={project.art} label={project.title} />
        )}
      </button>

      <div className="project-card-copy">
        {isEditing ? (
          <form onSubmit={handleSaveEdit} onClick={(e) => e.stopPropagation()} style={{ padding: '8px 0' }}>
            <input
              type="text"
              className="chat-search-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ marginBottom: '6px', fontWeight: 600 }}
              autoFocus
            />
            <textarea
              className="chat-composer-input"
              rows={2}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              style={{ marginBottom: '6px' }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="submit" className="primary-button" style={{ fontSize: '11px', padding: '3px 10px' }}>
                Save
              </button>
              <button
                type="button"
                className="quiet-button"
                style={{ fontSize: '11px' }}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <button type="button" className="card-title" onClick={() => onOpen(project)}>
              {project.title}
            </button>
            <p>{project.description}</p>
          </>
        )}

        {/* Reporting form */}
        {isReporting && (
          <form onSubmit={handleReport} onClick={(e) => e.stopPropagation()} style={{ padding: '8px 0', borderTop: '1px solid var(--sw-line-standard)' }}>
            <strong style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Report project:</strong>
            <input
              type="text"
              className="chat-search-input"
              placeholder="Reason for report..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              style={{ marginBottom: '6px' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="submit" className="primary-button" style={{ fontSize: '11px', padding: '3px 10px' }}>
                Submit Report
              </button>
              <button
                type="button"
                className="quiet-button"
                style={{ fontSize: '11px' }}
                onClick={() => setIsReporting(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <Tags values={project.tags || []} />

        <div className="project-card-meta">
          <div className="avatar-stack">
            {collaborators.slice(0, 2).map((id) => (
              <Avatar key={id} name={id} personId={id} small />
            ))}
            <span>{project.members || 1} members</span>
          </div>
          {project.rating ? (
            <span aria-label={project.rating + ' out of 5'}>&#9734; {project.rating}</span>
          ) : null}
        </div>

        {/* Action Bar: Like, Comment, Repost (NO SAVE PROJECT) */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--sw-line-standard)' }}>
          <button
            type="button"
            className="quiet-button"
            onClick={handleLike}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: project.has_liked ? '#ef4444' : 'inherit', fontWeight: project.has_liked ? 600 : 400 }}
            title={project.has_liked ? 'Unlike' : 'Like'}
          >
            <span>{project.has_liked ? '♥' : '♡'}</span>
            <span>{project.like_count ?? 0}</span>
          </button>

          <button
            type="button"
            className="quiet-button"
            onClick={() => onOpen(project)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
            title="Comments"
          >
            <span>💬</span>
            <span>{project.comment_count ?? 0}</span>
          </button>

          <button
            type="button"
            className={`post-repost-btn ${project.has_reposted ? 'active' : ''}`}
            onClick={handleRepost}
            style={{ fontSize: '12px' }}
            title={project.has_reposted ? 'Undo Repost' : 'Repost'}
          >
            <span aria-hidden="true">🔁</span>
            <span>{project.repost_count ?? 0}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
