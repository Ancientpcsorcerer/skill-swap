import { useState } from 'react';
import { Artwork } from '../../app/components/Artwork';
import { Avatar } from '../../app/components/Avatar';
import type { Project, Community } from '../../app/data/models';
import type { Post } from '../posts/types';
import type { Person } from '../connect/types';

interface MasonryFeedProps {
  projects: Project[];
  posts: Post[];
  communities: Community[];
  people: Person[];
  query: string;
  category: string;
  onSelectProject: (project: Project) => void;
  onSelectPost: (post: Post) => void;
  onSelectPerson: (person: Person) => void;
}

export function MasonryFeed({
  projects,
  posts,
  communities,
  people,
  query,
  category,
  onSelectProject,
  onSelectPost,
  onSelectPerson,
}: MasonryFeedProps) {
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});

  function toggleLike(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setLikedMap((prev) => {
      const isLiked = !prev[id];
      setLikes((likeCounts) => ({
        ...likeCounts,
        [id]: (likeCounts[id] || 0) + (isLiked ? 1 : -1),
      }));
      return { ...prev, [id]: isLiked };
    });
  }

  function toggleBookmark(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setBookmarks((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Interleave and sort by newest or query relevance
  const items: Array<
    | { kind: 'project'; data: Project; id: string }
    | { kind: 'post'; data: Post; id: string }
    | { kind: 'community'; data: Community; id: string }
    | { kind: 'person'; data: Person; id: string }
  > = [];

  if (category === 'All' || category === 'Projects') {
    projects.forEach((p) => items.push({ kind: 'project', data: p, id: `proj-${p.id}` }));
  }
  if (category === 'All' || category === 'Posts') {
    posts.forEach((p) => items.push({ kind: 'post', data: p, id: `post-${p.id}` }));
  }
  if (category === 'All' || category === 'Communities') {
    communities.forEach((c) => items.push({ kind: 'community', data: c, id: `comm-${c.id}` }));
  }
  if (category === 'All' || category === 'People') {
    people.slice(0, 8).forEach((pr) => items.push({ kind: 'person', data: pr, id: `pers-${pr.id}` }));
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--sw-ink-muted)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--sw-ink-primary)', marginBottom: '8px' }}>
          No initiatives matching your filter
        </h3>
        <p style={{ fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
          {query
            ? `Try broadening your search term "${query}" or selecting another category filter.`
            : 'Be the first to publish a new initiative in the Studio Workbench.'}
        </p>
      </div>
    );
  }

  return (
    <div className="masonry-feed-grid">
      {items.map((item) => {
        if (item.kind === 'project') {
          const p = item.data;
          const isLiked = !!likedMap[item.id];
          const likeCount = (p.members || 1) * 3 + (likes[item.id] || 0);
          const isBookmarked = !!bookmarks[item.id];

          return (
            <article
              key={item.id}
              className="feed-card"
              onClick={() => onSelectProject(p)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectProject(p);
                }
              }}
            >
              <div className="feed-card-header">
                <span className="feed-card-type-badge">✦ Project</span>
                <span className="feed-card-time">{p.type}</span>
              </div>

              <div style={{ height: '120px', overflow: 'hidden', margin: '0 20px 14px 20px', borderRadius: '10px' }}>
                <Artwork art={p.art || 'urban'} />
              </div>

              <div className="feed-card-body">
                <h3 className="feed-card-title">{p.title}</h3>
                <p className="feed-card-text">{p.description}</p>

                {p.requiredSkills && p.requiredSkills.length > 0 && (
                  <div className="feed-card-reciprocal">
                    <span className="feed-card-reciprocal-seeking">
                      Seeking: {p.requiredSkills.slice(0, 2).join(', ')}
                    </span>
                    <span className="sw-arrow">⇄</span>
                    <span className="feed-card-reciprocal-offering">Offering: {p.type}</span>
                  </div>
                )}

                {p.tags && p.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {p.tags.slice(0, 3).map((t) => (
                      <span key={t} className="sw-pill-badge">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="feed-card-footer">
                <div className="feed-card-author">
                  <Avatar name={p.creatorId || 'Collaborator'} small />
                  <span>{p.creatorId || 'Peer'}</span>
                </div>

                <div className="feed-metrics">
                  <button
                    type="button"
                    className={`metric-btn ${isLiked ? 'metric-btn--active' : ''}`}
                    onClick={(e) => toggleLike(e, item.id)}
                    aria-label="Like initiative"
                  >
                    <span>{isLiked ? '♥' : '♡'}</span>
                    <span>{likeCount}</span>
                  </button>
                  <button
                    type="button"
                    className={`metric-btn ${isBookmarked ? 'metric-btn--active' : ''}`}
                    onClick={(e) => toggleBookmark(e, item.id)}
                    aria-label="Bookmark initiative"
                  >
                    <span>{isBookmarked ? '★' : '☆'}</span>
                  </button>
                </div>
              </div>
            </article>
          );
        }

        if (item.kind === 'post') {
          const post = item.data;
          const isLiked = !!likedMap[item.id];
          const likeCount = 2 + (likes[item.id] || 0);
          const isBookmarked = !!bookmarks[item.id];

          return (
            <article
              key={item.id}
              className="feed-card"
              onClick={() => onSelectPost(post)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPost(post);
                }
              }}
            >
              <div className="feed-card-header">
                <span className="feed-card-type-badge" style={{ background: 'var(--sw-canvas-subtle)' }}>
                  ✍ Insight
                </span>
                <span className="feed-card-time">Community</span>
              </div>

              <div className="feed-card-body">
                <h3 className="feed-card-title">{post.title}</h3>
                <p className="feed-card-text">{post.content}</p>

                {post.tags && post.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {post.tags.map((t) => (
                      <span key={t} className="sw-pill-badge">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="feed-card-footer">
                <div className="feed-card-author">
                  <Avatar name={post.authorName} small />
                  <span>{post.authorName}</span>
                </div>

                <div className="feed-metrics">
                  <button
                    type="button"
                    className={`metric-btn ${isLiked ? 'metric-btn--active' : ''}`}
                    onClick={(e) => toggleLike(e, item.id)}
                    aria-label="Like insight"
                  >
                    <span>{isLiked ? '♥' : '♡'}</span>
                    <span>{likeCount}</span>
                  </button>
                  <button
                    type="button"
                    className={`metric-btn ${isBookmarked ? 'metric-btn--active' : ''}`}
                    onClick={(e) => toggleBookmark(e, item.id)}
                    aria-label="Bookmark insight"
                  >
                    <span>{isBookmarked ? '★' : '☆'}</span>
                  </button>
                </div>
              </div>
            </article>
          );
        }

        if (item.kind === 'community') {
          const comm = item.data;
          return (
            <article
              key={item.id}
              className="feed-card"
              style={{ borderLeft: '3px solid var(--sw-ink-primary)' }}
            >
              <div className="feed-card-header">
                <span className="feed-card-type-badge">❖ Community</span>
                <span className="feed-card-time">{comm.category}</span>
              </div>

              <div className="feed-card-body">
                <h3 className="feed-card-title">{comm.name}</h3>
                <p className="feed-card-text">{comm.description}</p>
                <div style={{ fontSize: '12px', color: 'var(--sw-ink-subtle)' }}>
                  {comm.members} Active Members
                </div>
              </div>

              <div className="feed-card-footer">
                <span style={{ fontSize: '11px', color: 'var(--sw-accent-emerald)', fontWeight: 600 }}>
                  Open Exchange
                </span>
                <span className="sw-pill-badge">Explore Hub →</span>
              </div>
            </article>
          );
        }

        if (item.kind === 'person') {
          const p = item.data;
          return (
            <article
              key={item.id}
              className="feed-card"
              onClick={() => onSelectPerson(p)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPerson(p);
                }
              }}
            >
              <div className="feed-card-header">
                <span className="feed-card-type-badge">◉ Practitioner</span>
                <span className="feed-card-time">Collaborator</span>
              </div>

              <div className="feed-card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <Avatar name={p.name} personId={p.id} small />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{p.name}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--sw-ink-subtle)' }}>@{p.username || p.id}</span>
                  </div>
                </div>
                <p className="feed-card-text">{p.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {p.skills.slice(0, 3).map((s) => (
                    <span key={s} className="sw-pill-badge">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="feed-card-footer">
                <span style={{ fontSize: '12px', color: 'var(--sw-ink-muted)' }}>Skill Swap Ready</span>
                <span className="sw-pill-badge">View Profile →</span>
              </div>
            </article>
          );
        }

        return null;
      })}
    </div>
  );
}
