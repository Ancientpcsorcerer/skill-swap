import { useState, useSyncExternalStore } from 'react';
import { navigate } from '../../app/navigation';
import { useWorkspace } from '../../app/data/WorkspaceProvider';
import { communities, explorationItems, projectTypes, trendingTopics } from '../../app/data/catalog';
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
import type { Project } from '../../app/data/models';
import type { Person } from '../connect/types';
import type { Post } from '../posts/types';
import '../../styles/design-tokens.css';
import '../../styles/create-discover.css';

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
  const filteredCommunities = communities.filter(
    (item) =>
      matches([item.name, item.description, item.category].join(' ')) &&
      (category === 'All' || item.category === category)
  );
  const filteredPosts = posts.filter(
    (p) =>
      matches([p.title, p.content, p.authorName, ...(p.tags || [])].join(' ')) &&
      (category === 'All' || (p.tags && p.tags.includes(category)))
  );
  const topicQueries = ['education', 'drone', 'environment', 'open source', 'education'];

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
            <div className="community-grid">
              {filteredCommunities.map((item) => (
                <article className="community-card" key={item.id}>
                  <Artwork art={item.art} />
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
            {!filteredCommunities.length && <p className="workspace-empty">No matching communities.</p>}
          </>
        )}
      </div>

      <aside className="module-aside">
        <Panel title="Trending Now">
          <ol className="trending-list discover-trending">
            {trendingTopics.map((topic, index) => (
              <li key={topic}>
                <button
                  onClick={() => {
                    setTab('All');
                    setCategory('All');
                    setQuery(topicQueries[index]);
                  }}
                >
                  <span>
                    {topic}
                    <small>Explore related projects and people</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Suggested People">
          <div className="compact-people">
            {matchedPeople.slice(0, 5).map((person) => (
              <div key={person.id}>
                <button className="mini-person" onClick={() => setPerson(person)}>
                  <Avatar name={person.name} personId={person.id} small />
                  <span>
                    <strong>{person.name}</strong>
                    <small>{person.skills.join(' / ')}</small>
                  </span>
                </button>
                <ConnectionAction person={person} />
              </div>
            ))}
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
        </Panel>

        <Panel title="Popular Communities">
          <div className="community-list">
            {communities.map((item) => (
              <div key={item.id}>
                <Artwork art={item.art} />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.members} members</small>
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
