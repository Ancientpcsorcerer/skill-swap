import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { navigate } from '../../app/navigation';
import { useWorkspace } from '../../app/data/WorkspaceProvider';
import { explorationItems, projectTypes } from '../../app/data/catalog';
import { api, type TrendingTopicItem } from '../../lib/api';
import { PageHero } from '../../app/components/PageHero';
import { SearchField } from '../../app/components/SearchField';
import { ProjectCard } from '../../app/components/ProjectCard';
import { ProjectPreview } from '../../app/components/ProjectPreview';
import { Panel, SectionHeader, Tabs, FilterControl, Tags } from '../../app/components/UI';
import { Artwork } from '../../app/components/Artwork';
import { Avatar } from '../../app/components/Avatar';
import { Icon } from '../../app/components/Icon';
import { ProfilePreview } from '../profile/ProfilePreview';
import { useConnect } from '../connect/ConnectProvider';
import { matchesPerson } from '../connect/selectors';
import { PersonRow } from '../connect/components/PersonRow';
import { ConnectionAction } from '../connect/components/ConnectionAction';
import { useAuthGate } from '../../app/session/AuthGateContext';
import { postService } from '../posts/postService';
import { PostCard } from '../posts/PostCard';
import { PostComposer } from '../posts/PostComposer';
import { PostPreview } from '../posts/PostPreview';
import { MasonryFeed } from './MasonryFeed';
import type { Project, Community, User } from '../../app/data/models';
import type { Person } from '../connect/types';
import type { Post } from '../posts/types';
import '../../styles/design-tokens.css';
import '../../styles/create-discover.css';

function userToPerson(u: User): Person {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    skills: u.skills || [],
    interests: u.interests || [],
    projectInterests: u.projectInterests || [],
    description: u.bio || '',
  };
}

export function DiscoverModule() {
  const workspace = useWorkspace();
  const { requireAuth } = useAuthGate();
  const { people } = useConnect();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [tab, setTab] = useState('All');
  const [project, setProject] = useState<Project | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postComposerOpen, setPostComposerOpen] = useState(false);
  const [feedMode, setFeedMode] = useState<'standard' | 'masonry'>('standard');
  const savedItems = workspace.savedItems;

  // Real backend-driven data states
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopicItem[] | null>(null);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [trendingError, setTrendingError] = useState<string | null>(null);

  const [suggestedUsers, setSuggestedUsers] = useState<User[] | null>(null);
  const [loadingSuggested, setLoadingSuggested] = useState(true);
  const [suggestedError, setSuggestedError] = useState<string | null>(null);

  const [communitiesList, setCommunitiesList] = useState<Community[] | null>(null);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);

  const fetchTrending = useCallback(async () => {
    setLoadingTrending(true);
    setTrendingError(null);
    try {
      const res = await api.discover.getTrending();
      setTrendingTopics(res.topics || []);
    } catch (err: any) {
      setTrendingError(err?.message || 'Failed to load trending topics');
      setTrendingTopics(null);
    } finally {
      setLoadingTrending(false);
    }
  }, []);

  const fetchSuggested = useCallback(async () => {
    setLoadingSuggested(true);
    setSuggestedError(null);
    try {
      const res = await api.users.suggested();
      setSuggestedUsers(res || []);
    } catch (err: any) {
      setSuggestedError(err?.message || 'Failed to load suggestions');
      setSuggestedUsers(null);
    } finally {
      setLoadingSuggested(false);
    }
  }, []);

  const fetchCommunities = useCallback(async () => {
    setLoadingCommunities(true);
    setCommunitiesError(null);
    try {
      const res = await api.discover.getCommunities();
      setCommunitiesList(res || []);
    } catch (err: any) {
      setCommunitiesError(err?.message || 'Failed to load communities');
      setCommunitiesList(null);
    } finally {
      setLoadingCommunities(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
    fetchSuggested();
    fetchCommunities();
  }, [fetchTrending, fetchSuggested, fetchCommunities]);

  // Subscribe to reactive posts
  const posts = useSyncExternalStore(postService.subscribe, () => postService.getAllPosts(), () => []);

  const matches = (value: string) =>
    query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .every((term) => value.toLowerCase().includes(term));

  const projects = workspace.allProjects.filter(
    (project) =>
      (category === 'All' || project.type === category) &&
      matches([project.title, project.description, project.type, ...project.tags, ...project.requiredSkills].join(' '))
  );
  const skills = Array.from(new Set(people.flatMap((person) => person.skills))).filter(matches);
  const matchedPeople = people.filter((person) => matchesPerson(person, query));
  const showProjects = tab === 'All' || tab === 'Projects';
  const showPosts = tab === 'All' || tab === 'Posts';

  const activeCommunities = communitiesList || [];
  const filteredCommunities = activeCommunities.filter(
    (item) =>
      matches([item.name, item.description, item.category].join(' ')) &&
      (category === 'All' || item.category === category)
  );
  const filteredPosts = posts.filter(
    (p) =>
      matches([p.title, p.content, p.authorName, ...(p.tags || [])].join(' ')) &&
      (category === 'All' || (p.tags && p.tags.includes(category)))
  );

  return (
    <div className="module-columns discover-layout">
      <div className="module-main">
        <PageHero
          core="discover"
          title={
            <>
              Explore ideas.
              <br />
              Projects. Posts. People.
            </>
          }
          description="Discover what others are building, learning and exploring."
        >
          <div className="search-with-filter">
            <SearchField
              label="Discover search"
              placeholder="Search projects, posts, people, skills, topics..."
              value={query}
              onChange={setQuery}
            />
            {tab !== 'People' && tab !== 'Skills' && tab !== 'Posts' && (
              <FilterControl value={category} onChange={setCategory} options={projectTypes} />
            )}
            <button
              type="button"
              className="primary-button discover-post-btn"
              onClick={() => requireAuth('create a post', () => setPostComposerOpen(true))}
            >
              <Icon name="pencil" />
              Create Post
            </button>
          </div>
        </PageHero>

        <div className="module-toolbar">
          <Tabs
            label="Discover categories"
            values={['All', 'Projects', 'Posts', 'People', 'Ideas', 'Skills', 'Communities', 'Events']}
            value={tab}
            onChange={(value) => {
              setTab(value);
              setCategory('All');
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0 20px 0', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`discover-chip ${feedMode === 'standard' ? 'discover-chip--active' : ''}`}
              onClick={() => setFeedMode('standard')}
            >
              Structured Showcase
            </button>
            <button
              type="button"
              className={`discover-chip ${feedMode === 'masonry' ? 'discover-chip--active' : ''}`}
              onClick={() => setFeedMode('masonry')}
            >
              ✦ Living Masonry Feed
            </button>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--sw-ink-subtle)' }}>
            {feedMode === 'masonry' ? 'Unified cross-domain stream' : 'Categorized curation'}
          </span>
        </div>

        {feedMode === 'masonry' && (
          <div style={{ marginBottom: '32px' }}>
            <MasonryFeed
              projects={projects}
              posts={filteredPosts}
              communities={filteredCommunities}
              people={matchedPeople}
              query={query}
              category={category}
              onSelectProject={setProject}
              onSelectPost={setSelectedPost}
              onSelectPerson={setPerson}
            />
          </div>
        )}

        {showProjects && (
          <>
            <SectionHeader title="Featured" action="View all" onAction={() => setTab('Projects')} />
            <div className="project-grid">
              {projects.slice(0, 4).map((proj) => (
                <ProjectCard key={proj.id} project={proj} onOpen={setProject} />
              ))}
            </div>
            {projects.length > 4 && (
              <>
                <SectionHeader title="More to Explore" />
                <div className="project-grid">
                  {projects.slice(4).map((proj) => (
                    <ProjectCard key={proj.id} project={proj} onOpen={setProject} />
                  ))}
                </div>
              </>
            )}
            {!projects.length && (
              <p className="workspace-empty">No matching projects. Try another topic or clear the category filter.</p>
            )}
          </>
        )}

        {showPosts && (
          <section className="discover-posts-section">
            <SectionHeader
              title={tab === 'Posts' ? `All Posts (${filteredPosts.length})` : 'Recent Posts & Updates'}
              action={tab === 'All' ? 'View all posts' : 'New post'}
              onAction={() =>
                tab === 'All' ? setTab('Posts') : requireAuth('create a post', () => setPostComposerOpen(true))
              }
            />
            <div className="discover-posts-grid">
              {(tab === 'Posts' ? filteredPosts : filteredPosts.slice(0, 3)).map((p) => (
                <PostCard key={p.id} post={p} onOpen={setSelectedPost} />
              ))}
            </div>
            {!filteredPosts.length && <p className="workspace-empty">No matching posts found.</p>}
          </section>
        )}

        {(tab === 'People' || (tab === 'All' && query)) && (
          <>
            <SectionHeader title="People to Explore" />
            <ul className="people-list mentor-grid">
              {matchedPeople.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  onPreview={setPerson}
                  variant="mentor"
                  action={<ConnectionAction person={person} />}
                />
              ))}
            </ul>
            {!matchedPeople.length && <p className="workspace-empty">No matching people.</p>}
          </>
        )}

        {(tab === 'Ideas' || tab === 'Events') && (
          <>
            <SectionHeader title={tab === 'Ideas' ? 'Ideas worth exploring' : 'Community events'} />
            <div className="exploration-grid">
              {explorationItems
                .filter(
                  (item) =>
                    item.kind === tab &&
                    (category === 'All' || item.tags.includes(category)) &&
                    matches([item.title, item.description, ...item.tags].join(' '))
                )
                .map((item) => (
                  <article className="exploration-card" key={item.id}>
                    <Artwork art={item.art} />
                    <h2>{item.title}</h2>
                    <p>{item.description}</p>
                    <Tags values={item.tags} />
                    <button
                      className="secondary-button"
                      onClick={() =>
                        requireAuth('save ' + (tab === 'Ideas' ? 'idea' : 'event'), () =>
                          workspace.toggleSavedItem(item.id)
                        )
                      }
                    >
                      {savedItems.includes(item.id) ? 'Saved' : 'Save ' + (tab === 'Ideas' ? 'idea' : 'event')}
                    </button>
                  </article>
                ))}
            </div>
            {!explorationItems.some(
              (item) =>
                item.kind === tab &&
                (category === 'All' || item.tags.includes(category)) &&
                matches([item.title, item.description, ...item.tags].join(' '))
            ) && <p className="workspace-empty">No matching {tab.toLowerCase()}.</p>}
          </>
        )}

        {tab === 'Skills' && (
          <>
            <SectionHeader title="Skills to Explore" />
            <div className="skill-directory">
              {skills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => {
                    setQuery(skill);
                    setTab('People');
                  }}
                >
                  {skill}
                  <span>Find people &rarr;</span>
                </button>
              ))}
            </div>
            {!skills.length && <p className="workspace-empty">No matching skills. Try another topic.</p>}
          </>
        )}

        {tab === 'Communities' && (
          <>
            <SectionHeader title="Popular Communities" />
            {loadingCommunities ? (
              <div className="aside-skeleton-list">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aside-skeleton-item" style={{ height: '64px' }}>
                    <div className="aside-skeleton-circle" />
                    <div className="aside-skeleton-text">
                      <div className="aside-skeleton-line" />
                      <div className="aside-skeleton-line aside-skeleton-line--short" />
                    </div>
                  </div>
                ))}
              </div>
            ) : communitiesError ? (
              <div className="aside-error-card">
                <p>{communitiesError}</p>
                <button className="aside-error-btn" onClick={fetchCommunities}>
                  Retry
                </button>
              </div>
            ) : filteredCommunities.length > 0 ? (
              <div className="community-grid">
                {filteredCommunities.map((item) => (
                  <article className="community-card" key={item.id}>
                    <Artwork art={item.art || 'ai'} />
                    <h2>{item.name}</h2>
                    <p>{item.description}</p>
                    <button
                      className="secondary-button"
                      onClick={() => requireAuth('join communities', () => workspace.toggleCommunity(item.id))}
                    >
                      {workspace.communities.includes(item.id) ? 'Joined' : 'Join'}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="workspace-empty">No communities found.</p>
            )}
          </>
        )}
      </div>

      <aside className="module-aside">
        <Panel title="Trending Now">
          {loadingTrending ? (
            <div className="aside-skeleton-list">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aside-skeleton-item">
                  <div className="aside-skeleton-text">
                    <div className="aside-skeleton-line" />
                    <div className="aside-skeleton-line aside-skeleton-line--short" />
                  </div>
                </div>
              ))}
            </div>
          ) : trendingError ? (
            <div className="aside-error-card">
              <p>{trendingError}</p>
              <button className="aside-error-btn" onClick={fetchTrending}>
                Retry
              </button>
            </div>
          ) : trendingTopics && trendingTopics.length > 0 ? (
            <ol className="trending-list discover-trending">
              {trendingTopics.map((item, idx) => (
                <li key={item.id}>
                  <button
                    className="trending-item-btn"
                    onClick={() => {
                      setTab('All');
                      setCategory('All');
                      setQuery(item.query);
                    }}
                  >
                    <span>
                      <span className="trending-rank">#{String(idx + 1).padStart(2, '0')}</span>
                      <strong>{item.name}</strong>
                      <small>
                        {item.count > 0 ? `${item.count} ${item.type === 'skill' ? 'creators' : 'projects'}` : 'Explore topic'}
                      </small>
                    </span>
                    <span className="trending-badge">{item.category}</span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <div className="aside-empty-message">Nothing trending yet.</div>
          )}
        </Panel>

        <Panel title="Suggested People">
          {loadingSuggested ? (
            <div className="aside-skeleton-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aside-skeleton-item">
                  <div className="aside-skeleton-circle" />
                  <div className="aside-skeleton-text">
                    <div className="aside-skeleton-line" />
                    <div className="aside-skeleton-line aside-skeleton-line--short" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedError ? (
            <div className="aside-error-card">
              <p>{suggestedError}</p>
              <button className="aside-error-btn" onClick={fetchSuggested}>
                Retry
              </button>
            </div>
          ) : suggestedUsers && suggestedUsers.length > 0 ? (
            <>
              <div className="compact-people">
                {suggestedUsers.slice(0, 5).map((u) => {
                  const p = userToPerson(u);
                  return (
                    <div key={u.id} className="suggested-user-card">
                      <button className="mini-person" onClick={() => setPerson(p)}>
                        <Avatar name={u.name} personId={u.id} small />
                        <span>
                          <strong>{u.name}</strong>
                          <small>{(u.skills && u.skills.length > 0 ? u.skills.join(' · ') : u.bio) || 'Active Creator'}</small>
                        </span>
                      </button>
                      <ConnectionAction person={p} />
                    </div>
                  );
                })}
              </div>
              <button
                className="quiet-button panel-link"
                onClick={() => {
                  setTab('People');
                  setQuery('');
                }}
              >
                View all people &rarr;
              </button>
            </>
          ) : (
            <div className="aside-empty-message">No suggested people right now.</div>
          )}
        </Panel>

        <Panel title="Popular Communities">
          {loadingCommunities ? (
            <div className="aside-skeleton-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aside-skeleton-item">
                  <div className="aside-skeleton-circle" />
                  <div className="aside-skeleton-text">
                    <div className="aside-skeleton-line" />
                    <div className="aside-skeleton-line aside-skeleton-line--short" />
                  </div>
                </div>
              ))}
            </div>
          ) : communitiesError ? (
            <div className="aside-error-card">
              <p>{communitiesError}</p>
              <button className="aside-error-btn" onClick={fetchCommunities}>
                Retry
              </button>
            </div>
          ) : activeCommunities.length > 0 ? (
            <div className="community-list">
              {activeCommunities.slice(0, 5).map((item) => (
                <div key={item.id}>
                  <Artwork art={item.art || 'ai'} />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{(item as any).member_count ?? item.members ?? 0} members</small>
                  </span>
                  <button
                    className="secondary-button"
                    onClick={() => requireAuth('join communities', () => workspace.toggleCommunity(item.id))}
                  >
                    {workspace.communities.includes(item.id) ? 'Joined' : 'Join'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="aside-empty-message">No communities found.</div>
          )}
        </Panel>
        <button className="quiet-button" onClick={() => navigate('create')}>
          Have an idea? Start a project &rarr;
        </button>
      </aside>

      <ProjectPreview project={project} onClose={() => setProject(null)} />
      <PostComposer open={postComposerOpen} onClose={() => setPostComposerOpen(false)} />
      <PostPreview post={selectedPost} onClose={() => setSelectedPost(null)} />
      <ProfilePreview
        person={person}
        onClose={() => setPerson(null)}
        action={person ? <ConnectionAction person={person} onRespond={() => setPerson(null)} /> : undefined}
      />
    </div>
  );
}
