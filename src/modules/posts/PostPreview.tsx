import { useRef } from 'react';
import { useModalDialog } from '../../hooks/useModalDialog';
import { Avatar } from '../../app/components/Avatar';
import { Tags } from '../../app/components/UI';
import { navigate } from '../../app/navigation';
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

  if (!post) return null;

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

        <header className="post-preview-header">
          <button
            type="button"
            className="post-preview-author-link"
            onClick={() => {
              onClose();
              navigate('profile', undefined, false, { user: post.authorId });
            }}
          >
            <Avatar name={post.authorName} personId={post.authorId} />
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

        <h2 id="post-preview-title">{post.title}</h2>

        <p className="post-preview-text">{post.content}</p>

        {post.projectTag && (
          <div className="post-project-tag">
            <span className="post-project-icon">&loz;</span>
            <span>Project: {post.projectTag}</span>
          </div>
        )}

        <Tags values={post.tags} />

        <div className="post-preview-footer-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              onClose();
              navigate('profile', undefined, false, { user: post.authorId });
            }}
          >
            View Author Profile &rarr;
          </button>
          <button
            type="button"
            className="quiet-button"
            onClick={() => {
              onClose();
              navigate('chat', undefined, false, { user: post.authorId });
            }}
          >
            Message Author &rarr;
          </button>
        </div>
      </div>
    </dialog>
  );
}
