import { useState } from 'react';
import { Avatar } from '../../app/components/Avatar';
import { Tags } from '../../app/components/UI';
import { navigate } from '../../app/navigation';
import { useAuthGate } from '../../app/session/AuthGateContext';
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
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
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
  const { requireAuth } = useAuthGate();
  const [isReposting, setIsReposting] = useState(false);

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

  const handleRepostClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReposting) return;
    if (
      !requireAuth('repost this item', async () => {
        try {
          if (post.hasReposted) {
            await postService.unrepostPost(post.id);
          } else {
            await postService.repostPost(post.id);
          }
        } catch (err) {
          console.error('Repost action failed:', err);
        }
      })
    ) {
      return;
    }

    setIsReposting(true);
    try {
      if (post.hasReposted) {
        await postService.unrepostPost(post.id);
      } else {
        await postService.repostPost(post.id);
      }
    } catch (err) {
      console.error('Repost action failed:', err);
    } finally {
      setIsReposting(false);
    }
  };

  return (
    <article
      className="post-card"
      onClick={() => onOpen?.(post)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
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

      <header className="post-card-header">
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
        <time className="post-card-time" dateTime={post.createdAt}>
          {formatPostTime(post.createdAt)}
        </time>
      </header>

      <div className="post-card-body">
        <h2 className="post-card-title">{post.title}</h2>
        <p className="post-card-content">{post.content}</p>
      </div>

      <footer className="post-card-footer">
        {post.projectTag && (
          <div className="post-project-tag">
            <span className="post-project-icon">&loz;</span>
            <span className="post-project-label">{post.projectTag}</span>
          </div>
        )}
        <Tags values={post.tags.filter((t) => t !== post.projectTag)} />

        <div className="post-card-actions">
          <button
            type="button"
            className={`post-repost-btn ${post.hasReposted ? 'active' : ''}`}
            onClick={handleRepostClick}
            disabled={isReposting}
            aria-label={post.hasReposted ? 'Undo Repost' : 'Repost'}
            title={post.hasReposted ? 'Undo Repost' : 'Repost'}
          >
            <span aria-hidden="true">🔁</span>
            <span>{post.repostCount ?? 0}</span>
          </button>
        </div>
      </footer>
    </article>
  );
}

