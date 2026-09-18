import { useState } from 'react';
import { Avatar } from '../../app/components/Avatar';
import { Tags } from '../../app/components/UI';
import { navigate } from '../../app/navigation';
import { useAuthGate } from '../../app/session/AuthGateContext';
import { useSession } from '../../app/session/SessionProvider';
import { postService } from './postService';
import type { Post } from './types';

function formatPostTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function PostCard({
  post,
  onOpen,
}: {
  post: Post;
  onOpen?: (post: Post) => void;
}) {
  const { session } = useSession();
  const { requireAuth } = useAuthGate();
  const currentUserId = session?.identity.id || '';
  const isOwner = post.authorId === currentUserId;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('profile', undefined, false, { user: post.authorId });
  };

  const handleRepostAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.repostedBy) {
      navigate('profile', undefined, false, { user: post.repostedBy.id });
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth('like this post', () => handleLike(e))) return;
    try {
      if (post.hasLiked) {
        await postService.unlikePost(post.id);
      } else {
        await postService.likePost(post.id);
      }
    } catch (err: any) {
      console.error('Like action failed:', err);
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth('repost this item', () => handleRepost(e))) return;
    try {
      if (post.hasReposted) {
        await postService.unrepostPost(post.id);
      } else {
        await postService.repostPost(post.id);
      }
    } catch (err: any) {
      console.error('Repost action failed:', err);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth('save this post', () => handleSave(e))) return;
    try {
      if (post.hasSaved) {
        await postService.unsavePost(post.id);
        showToast('Removed from saved items');
      } else {
        await postService.savePost(post.id);
        showToast('Saved post');
      }
    } catch (err: any) {
      console.error('Save action failed:', err);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    const link = `${window.location.origin}${window.location.pathname}#/app/profile?user=${encodeURIComponent(post.authorId)}`;
    navigator.clipboard.writeText(link);
    showToast('Link copied to clipboard');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editTitle.trim() || !editContent.trim()) return;
    try {
      await postService.updatePost(post.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setIsEditing(false);
      showToast('Post updated');
    } catch (err: any) {
      console.error('Update post failed:', err);
      showToast(err.message || 'Failed to update post');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postService.deletePost(post.id);
      showToast('Post deleted');
    } catch (err: any) {
      console.error('Delete post failed:', err);
      showToast(err.message || 'Failed to delete post');
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!reportReason.trim()) return;
    try {
      await postService.reportPost(post.id, reportReason.trim());
      setIsReporting(false);
      setReportReason('');
      showToast('Report submitted for review');
    } catch (err: any) {
      console.error('Report post failed:', err);
      showToast(err.message || 'Failed to report post');
    }
  };

  return (
    <article
      className="post-card"
      onClick={() => onOpen?.(post)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      style={{ position: 'relative' }}
      onKeyDown={(e) => {
        if (onOpen && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onOpen(post);
        }
      }}
    >
      {post.repostedBy && (
        <div
          className="post-card-provenance"
          onClick={handleRepostAuthorClick}
          title={`Reposted by ${post.repostedBy.name}`}
        >
          <span aria-hidden="true">🔁</span>
          <span>
            Reposted by <strong>{post.repostedBy.name}</strong>
          </span>
        </div>
      )}

      {toast && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--sw-ink-primary)', color: 'var(--sw-ink-inverse)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', zIndex: 60 }}>
          {toast}
        </div>
      )}

      <header className="post-card-header" style={{ position: 'relative' }}>
        <button
          type="button"
          className="post-card-author-btn"
          onClick={handleAuthorClick}
          aria-label={`View ${post.authorName}'s profile`}
        >
          <Avatar name={post.authorName} avatarUrl={post.authorAvatarUrl} personId={post.authorId} small />
          <div className="post-card-author-info">
            <strong className="post-card-author-name">{post.authorName}</strong>
            <span className="post-card-author-handle">@{post.authorUsername}</span>
          </div>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <time className="post-card-time" dateTime={post.createdAt}>
            {formatPostTime(post.createdAt)}
          </time>

          {/* Contextual Options Menu */}
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="quiet-button"
              style={{ padding: '0 4px', fontSize: '14px', lineHeight: 1 }}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Post actions"
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
                        setEditTitle(post.title);
                        setEditContent(post.content);
                        setIsEditing(true);
                      }}
                    >
                      ✎ Edit Post
                    </button>
                    <button
                      type="button"
                      className="chat-action-menu-item is-danger"
                      onClick={handleDelete}
                    >
                      ✕ Delete Post
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
                      ⚑ Report Post
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Inline Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} onClick={(e) => e.stopPropagation()} style={{ padding: '10px 0' }}>
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
            rows={3}
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
        <div className="post-card-body">
          <h2 className="post-card-title">{post.title}</h2>
          <p className="post-card-content">{post.content}</p>
        </div>
      )}

      {/* Reporting Modal */}
      {isReporting && (
        <form onSubmit={handleReport} onClick={(e) => e.stopPropagation()} style={{ padding: '10px 0', borderTop: '1px solid var(--sw-line-standard)' }}>
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

      <footer className="post-card-footer">
        {post.projectTag && (
          <div className="post-project-tag">
            <span className="post-project-icon">&loz;</span>
            <span className="post-project-label">{post.projectTag}</span>
          </div>
        )}
        <Tags values={post.tags.filter((t) => t !== post.projectTag)} />

        {/* Action Bar: Like, Comment, Repost, Save */}
        <div className="post-card-actions" style={{ display: 'flex', gap: '14px', alignItems: 'center', marginTop: '10px' }}>
          <button
            type="button"
            className={`quiet-button ${post.hasLiked ? 'active' : ''}`}
            onClick={handleLike}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: post.hasLiked ? '#ef4444' : 'inherit', fontWeight: post.hasLiked ? 600 : 400 }}
            title={post.hasLiked ? 'Unlike' : 'Like'}
          >
            <span>{post.hasLiked ? '♥' : '♡'}</span>
            <span>{post.likeCount ?? 0}</span>
          </button>

          <button
            type="button"
            className="quiet-button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.(post);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
            title="Comments"
          >
            <span>💬</span>
            <span>{post.commentCount ?? 0}</span>
          </button>

          <button
            type="button"
            className={`post-repost-btn ${post.hasReposted ? 'active' : ''}`}
            onClick={handleRepost}
            aria-label={post.hasReposted ? 'Undo Repost' : 'Repost'}
            title={post.hasReposted ? 'Undo Repost' : 'Repost'}
          >
            <span aria-hidden="true">🔁</span>
            <span>{post.repostCount ?? 0}</span>
          </button>

          <button
            type="button"
            className={`quiet-button ${post.hasSaved ? 'active' : ''}`}
            onClick={handleSave}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: post.hasSaved ? 'var(--sw-ink-primary)' : 'inherit', fontWeight: post.hasSaved ? 700 : 400 }}
            title={post.hasSaved ? 'Unsave' : 'Save'}
          >
            <span>{post.hasSaved ? '🔖' : '🏷️'}</span>
            <span>{post.hasSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </footer>
    </article>
  );
}
