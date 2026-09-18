import { useState, useEffect, type FormEvent } from 'react';
import { Avatar } from '../../app/components/Avatar';
import { useSession } from '../../app/session/SessionProvider';
import { useAuthGate } from '../../app/session/AuthGateContext';
import { api } from '../../lib/api';
import type { CommentItem } from '../../app/data/models';

function formatCommentTime(isoString: string): string {
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

interface CommentSectionProps {
  targetType: 'post' | 'project';
  targetId: string;
  targetAuthorId?: string;
}

export function CommentSection({ targetType, targetId, targetAuthorId }: CommentSectionProps) {
  const { session } = useSession();
  const { requireAuth } = useAuthGate();
  const currentUserId = session?.identity.id || '';

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply & Edit states
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  // Context menu & Report states
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const loadComments = async () => {
    try {
      const res = await api.comments.list(targetType, targetId);
      setComments(res.comments);
      setTotalCount(res.total_count);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [targetType, targetId]);

  // Handle outside click for menus
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCommentBody.trim()) return;
    if (!requireAuth('leave a comment', () => handleAddComment(e))) return;

    setSubmitting(true);
    try {
      await api.comments.create({
        targetType,
        targetId,
        body: newCommentBody.trim(),
      });
      setNewCommentBody('');
      await loadComments();
    } catch (err: any) {
      console.error('Failed to add comment:', err);
      setFeedbackNotice(err.message || 'Could not post comment');
      setTimeout(() => setFeedbackNotice(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (parentCommentId: string) => {
    if (!replyBody.trim()) return;
    if (!requireAuth('reply to this comment', () => handleAddReply(parentCommentId))) return;

    try {
      await api.comments.create({
        targetType,
        targetId,
        body: replyBody.trim(),
        parentCommentId,
      });
      setReplyBody('');
      setReplyingToCommentId(null);
      await loadComments();
    } catch (err: any) {
      console.error('Failed to add reply:', err);
      setFeedbackNotice(err.message || 'Could not post reply');
      setTimeout(() => setFeedbackNotice(''), 3000);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editBody.trim()) return;
    try {
      await api.comments.update(commentId, editBody.trim());
      setEditingCommentId(null);
      setEditBody('');
      await loadComments();
    } catch (err: any) {
      console.error('Failed to update comment:', err);
      setFeedbackNotice(err.message || 'Could not update comment');
      setTimeout(() => setFeedbackNotice(''), 3000);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.comments.delete(commentId);
      await loadComments();
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      setFeedbackNotice(err.message || 'Could not delete comment');
      setTimeout(() => setFeedbackNotice(''), 3000);
    }
  };

  const handleLikeComment = async (comment: CommentItem) => {
    if (!requireAuth('like this comment', () => handleLikeComment(comment))) return;
    try {
      if (comment.has_liked) {
        await api.comments.unlike(comment.id);
      } else {
        await api.comments.like(comment.id);
      }
      await loadComments();
    } catch (err: any) {
      console.error('Failed to toggle comment like:', err);
    }
  };

  const handleReportComment = async (commentId: string) => {
    if (!reportReason.trim()) return;
    try {
      await api.comments.report(commentId, reportReason.trim());
      setReportingCommentId(null);
      setReportReason('');
      setFeedbackNotice('Comment reported for review.');
      setTimeout(() => setFeedbackNotice(''), 3500);
    } catch (err: any) {
      console.error('Failed to report comment:', err);
      setFeedbackNotice(err.message || 'Could not report comment');
      setTimeout(() => setFeedbackNotice(''), 3000);
    }
  };

  const renderCommentItem = (comment: CommentItem, isReply = false) => {
    const isOwner = comment.user_id === currentUserId;
    const isTargetOwner = Boolean(targetAuthorId && targetAuthorId === currentUserId);
    const canDelete = isOwner || isTargetOwner;
    const canEdit = isOwner;
    const isMenuOpen = activeMenuId === comment.id;
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyingToCommentId === comment.id;

    return (
      <div
        key={comment.id}
        className={`comment-node ${isReply ? 'comment-reply-node' : ''} ${comment.is_creator ? 'comment-creator-node' : ''}`}
        style={{
          display: 'flex',
          gap: '10px',
          padding: isReply ? '8px 0 8px 12px' : '12px 0',
          borderLeft: isReply ? '2px solid var(--sw-line-standard)' : 'none',
          marginBottom: isReply ? '4px' : '8px',
        }}
      >
        <Avatar name={comment.author.name} avatarUrl={comment.author.avatar_url} small />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Author line with Creator/Admin Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '12.5px', color: 'var(--sw-ink-primary)' }}>
              {comment.author.name}
            </strong>
            <small style={{ color: 'var(--sw-ink-muted)', fontSize: '11px' }}>
              @{comment.author.username}
            </small>

            {/* Canonical Creator Badge */}
            {comment.is_creator && (
              <span
                className="comment-creator-badge"
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: 'var(--sw-canvas-warm)',
                  border: '1px solid var(--sw-line-standard)',
                  color: 'var(--sw-ink-primary)',
                }}
              >
                Creator
              </span>
            )}

            <time style={{ fontSize: '10.5px', color: 'var(--sw-ink-muted)', marginLeft: 'auto' }}>
              {formatCommentTime(comment.created_at)}
            </time>
          </div>

          {/* Body or Deleted State */}
          <div style={{ margin: '4px 0 6px 0', fontSize: '13px', lineHeight: 1.5, color: 'var(--sw-ink-primary)' }}>
            {comment.is_deleted ? (
              <em style={{ color: 'var(--sw-ink-muted)' }}>Comment deleted</em>
            ) : isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                <textarea
                  className="chat-composer-input"
                  rows={2}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  style={{ minHeight: '60px' }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="primary-button"
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                    onClick={() => handleEditComment(comment.id)}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="quiet-button"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditBody('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0 }}>
                {comment.body}
                {comment.edited_at && (
                  <span style={{ fontSize: '10px', opacity: 0.65, marginLeft: '4px', fontStyle: 'italic' }}>
                    (edited)
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Action Footer: Like, Reply, Options */}
          {!comment.is_deleted && !isEditing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', color: 'var(--sw-ink-muted)' }}>
              <button
                type="button"
                className="quiet-button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0,
                  fontSize: '11.5px',
                  color: comment.has_liked ? '#ef4444' : 'inherit',
                  fontWeight: comment.has_liked ? 600 : 400,
                }}
                onClick={() => handleLikeComment(comment)}
              >
                <span>{comment.has_liked ? '♥' : '♡'}</span>
                <span>{comment.like_count}</span>
              </button>

              <button
                type="button"
                className="quiet-button"
                style={{ padding: 0, fontSize: '11.5px' }}
                onClick={() => {
                  setReplyingToCommentId(isReplying ? null : comment.id);
                  setReplyBody('');
                }}
              >
                Reply
              </button>

              {!isReply && (
                <button
                  type="button"
                  className="quiet-button"
                  style={{ padding: 0, fontSize: '11.5px' }}
                  onClick={() => {
                    setExpandedReplies((prev) => {
                      const next = new Set(prev);
                      if (next.has(comment.id)) next.delete(comment.id);
                      else next.add(comment.id);
                      return next;
                    });
                  }}
                >
                  {comment.reply_count && comment.reply_count > 0 ? `Replies (${comment.reply_count})` : 'Replies (0)'}
                </button>
              )}

              {/* Context menu trigger */}
              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <button
                  type="button"
                  className="quiet-button"
                  style={{ padding: '0 4px', fontSize: '13px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(isMenuOpen ? null : comment.id);
                  }}
                  title="More actions"
                >
                  •••
                </button>

                {isMenuOpen && (
                  <div
                    className="chat-message-action-menu"
                    style={{ right: 0, top: '100%', minWidth: '110px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canEdit && (
                      <button
                        type="button"
                        className="chat-action-menu-item"
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditBody(comment.body);
                          setActiveMenuId(null);
                        }}
                      >
                        ✎ Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="chat-action-menu-item is-danger"
                        onClick={() => {
                          handleDeleteComment(comment.id);
                          setActiveMenuId(null);
                        }}
                      >
                        ✕ Delete
                      </button>
                    )}
                    {!isOwner && (
                      <button
                        type="button"
                        className="chat-action-menu-item"
                        onClick={() => {
                          setReportingCommentId(comment.id);
                          setReportReason('');
                          setActiveMenuId(null);
                        }}
                      >
                        ⚑ Report
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reply form */}
          {isReplying && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              <input
                type="text"
                className="chat-composer-input"
                placeholder={`Reply to ${comment.author.name}...`}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                style={{ fontSize: '12.5px', padding: '6px 10px', minHeight: '34px' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="primary-button"
                  style={{ fontSize: '11.5px', padding: '3px 10px' }}
                  disabled={!replyBody.trim()}
                  onClick={() => handleAddReply(comment.id)}
                >
                  Post Reply
                </button>
                <button
                  type="button"
                  className="quiet-button"
                  style={{ fontSize: '11.5px', padding: '3px 8px' }}
                  onClick={() => {
                    setReplyingToCommentId(null);
                    setReplyBody('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Report dialog */}
          {reportingCommentId === comment.id && (
            <div style={{ padding: '8px 12px', background: 'var(--sw-canvas-warm)', borderRadius: '6px', marginTop: '8px', border: '1px solid var(--sw-line-standard)' }}>
              <strong style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Report Comment</strong>
              <input
                type="text"
                className="chat-search-input"
                placeholder="Why are you reporting this comment?"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                style={{ marginBottom: '6px' }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="primary-button"
                  style={{ fontSize: '11.5px', padding: '3px 10px' }}
                  disabled={!reportReason.trim()}
                  onClick={() => handleReportComment(comment.id)}
                >
                  Submit Report
                </button>
                <button
                  type="button"
                  className="quiet-button"
                  style={{ fontSize: '11.5px' }}
                  onClick={() => setReportingCommentId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Threaded Child Replies */}
          {comment.replies && comment.replies.length > 0 ? (
            <div className="comment-replies-thread" style={{ marginTop: '8px' }}>
              {comment.replies.map((reply) => renderCommentItem(reply, true))}
            </div>
          ) : !isReply && expandedReplies.has(comment.id) ? (
            <div className="no-replies-empty" style={{ marginTop: '8px', padding: '6px 12px', fontSize: '11.5px', color: 'var(--sw-ink-muted)' }}>
              NO REPLIES YET
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="canonical-comments-section" style={{ marginTop: '20px', borderTop: '1px solid var(--sw-line-standard)', paddingTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em' }}>
          Comments ({totalCount})
        </h3>
      </div>

      {feedbackNotice && (
        <div style={{ padding: '6px 12px', background: 'var(--sw-canvas-warm)', border: '1px solid var(--sw-line-standard)', borderRadius: '6px', fontSize: '12px', marginBottom: '10px' }}>
          {feedbackNotice}
        </div>
      )}

      {/* New Comment Box */}
      <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        <textarea
          className="chat-composer-input"
          placeholder="Share a thoughtful comment..."
          rows={2}
          value={newCommentBody}
          onChange={(e) => setNewCommentBody(e.target.value)}
          style={{ minHeight: '52px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="primary-button"
            disabled={submitting || !newCommentBody.trim()}
            style={{ fontSize: '12px', padding: '6px 16px' }}
          >
            {submitting ? 'Posting…' : 'Post Comment'}
          </button>
        </div>
      </form>

      {/* Comment List */}
      {loading ? (
        <p style={{ fontSize: '12px', color: 'var(--sw-ink-muted)' }}>Loading comments...</p>
      ) : comments.length > 0 ? (
        <div className="comments-tree">
          {comments.map((c) => renderCommentItem(c))}
        </div>
      ) : (
        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--sw-ink-muted)', fontSize: '13px' }}>
          NO COMMENTS YET
        </div>
      )}
    </div>
  );
}
