import { useRef, useState } from 'react';
import { useModalDialog } from '../../hooks/useModalDialog';
import { Avatar } from '../../app/components/Avatar';
import { Tags } from '../../app/components/UI';
import { navigate } from '../../app/navigation';
import { useSession } from '../../app/session/SessionProvider';
import { useAuthGate } from '../../app/session/AuthGateContext';
import { postService } from './postService';
import { CommentSection } from '../../components/social/CommentSection';
import type { Post } from './types';

export function PostPreview({
  post,
  onClose,
}: {
  post: Post | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useModalDialog(dialogRef, post !== null);

  const { session } = useSession();
  const { requireAuth } = useAuthGate();
  const currentUserId = session?.identity.id || '';

  const [toast, setToast] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post?.title || '');
  const [editContent, setEditContent] = useState(post?.content || '');
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');

  if (!post) return null;

  const isOwner = post.authorId === currentUserId;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleLike = async () => {
    if (!requireAuth('like this post', () => handleLike())) return;
    try {
      if (post.hasLiked) {
        await postService.unlikePost(post.id);
      } else {
        await postService.likePost(post.id);
      }
    } catch (err: any) {
      console.error('Like failed:', err);
    }
  };

  const handleRepost = async () => {
    if (!requireAuth('repost this item', () => handleRepost())) return;
    try {
      if (post.hasReposted) {
        await postService.unrepostPost(post.id);
      } else {
        await postService.repostPost(post.id);
      }
    } catch (err: any) {
      console.error('Repost failed:', err);
    }
  };

  const handleSave = async () => {
    if (!requireAuth('save this post', () => handleSave())) return;
    try {
      if (post.hasSaved) {
        await postService.unsavePost(post.id);
        showToast('Removed from saved items');
      } else {
        await postService.savePost(post.id);
        showToast('Saved post');
      }
    } catch (err: any) {
      console.error('Save failed:', err);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}#/app/profile?user=${encodeURIComponent(post.authorId)}`;
    navigator.clipboard.writeText(link);
    showToast('Link copied to clipboard');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;
    try {
      await postService.updatePost(post.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setIsEditing(false);
      showToast('Post updated');
    } catch (err: any) {
      showToast(err.message || 'Failed to update post');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postService.deletePost(post.id);
      showToast('Post deleted');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete post');
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    try {
      await postService.reportPost(post.id, reportReason.trim());
      setIsReporting(false);
      setReportReason('');
      showToast('Report submitted for review');
    } catch (err: any) {
      showToast(err.message || 'Failed to report post');
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="workspace-dialog post-preview-dialog"
      aria-labelledby="post-preview-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="workspace-dialog-content">
        <button
          type="button"
          className="workspace-dialog-close quiet-button"
          onClick={onClose}
          autoFocus
        >
          Close
        </button>

        {toast && (
          <div style={{ padding: '6px 12px', background: 'var(--sw-canvas-warm)', border: '1px solid var(--sw-line-standard)', borderRadius: '6px', fontSize: '12px', marginBottom: '10px' }}>
            {toast}
          </div>
        )}

        <header className="post-preview-header">
          <button
            type="button"
            className="post-preview-author-link"
            onClick={() => {
              onClose();
              navigate('profile', undefined, false, { user: post.authorId });
            }}
          >
            <Avatar name={post.authorName} avatarUrl={post.authorAvatarUrl} personId={post.authorId} />
            <div>
              <strong>{post.authorName}</strong>
              <small>@{post.authorUsername}</small>
            </div>
          </button>
          <time dateTime={post.createdAt}>
            {new Date(post.createdAt).toLocaleDateString([], {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
        </header>

        {isEditing ? (
          <form onSubmit={handleSaveEdit} style={{ padding: '10px 0' }}>
            <input
              type="text"
              className="chat-search-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ marginBottom: '8px', fontWeight: 600 }}
              placeholder="Post title"
              autoFocus
            />
            <textarea
              className="chat-composer-input"
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{ marginBottom: '8px' }}
              placeholder="Post content"
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
            <h2 id="post-preview-title">{post.title}</h2>
            <p className="post-preview-text">{post.content}</p>
          </>
        )}

        {post.projectTag && (
          <div className="post-project-tag">
            <span className="post-project-icon">&loz;</span>
            <span>Project: {post.projectTag}</span>
          </div>
        )}

        <Tags values={post.tags} />

        {/* Options & Reporting form */}
        {isReporting && (
          <form onSubmit={handleReport} style={{ padding: '10px 0', borderTop: '1px solid var(--sw-line-standard)' }}>
            <strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Report this post:</strong>
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

        {/* Action bar */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--sw-line-standard)' }}>
          <button
            type="button"
            className={`secondary-button ${post.hasLiked ? 'active' : ''}`}
            onClick={handleLike}
            style={{ fontSize: '12.5px', color: post.hasLiked ? '#ef4444' : 'inherit' }}
          >
            <span>{post.hasLiked ? '♥' : '♡'}</span> {post.likeCount ?? 0} Likes
          </button>

          <button
            type="button"
            className={`secondary-button ${post.hasReposted ? 'active' : ''}`}
            onClick={handleRepost}
            style={{ fontSize: '12.5px' }}
          >
            🔁 {post.repostCount ?? 0} Reposts
          </button>

          <button
            type="button"
            className={`secondary-button ${post.hasSaved ? 'active' : ''}`}
            onClick={handleSave}
            style={{ fontSize: '12.5px' }}
          >
            {post.hasSaved ? '🔖 Saved' : '🏷️ Save'}
          </button>

          <button
            type="button"
            className="quiet-button"
            onClick={handleCopyLink}
            style={{ fontSize: '12.5px' }}
          >
            ⎘ Share
          </button>

          {isOwner ? (
            <>
              <button
                type="button"
                className="quiet-button"
                onClick={() => {
                  setEditTitle(post.title);
                  setEditContent(post.content);
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
          targetType="post"
          targetId={post.id}
          targetAuthorId={post.authorId}
        />
      </div>
    </dialog>
  );
}
