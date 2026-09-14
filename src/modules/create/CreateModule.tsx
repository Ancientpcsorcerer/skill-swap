import { useState, useSyncExternalStore, type FormEvent } from 'react';
import { navigate } from '../../app/navigation';
import { useSession } from '../../app/session/SessionProvider';
import { useWorkspace } from '../../app/data/WorkspaceProvider';
import { projectTemplates, projectTypes, sampleProjects, suggestedRoles } from '../../app/data/catalog';
import { PageHero } from '../../app/components/PageHero';
import { Artwork } from '../../app/components/Artwork';
import { Avatar } from '../../app/components/Avatar';
import { Icon } from '../../app/components/Icon';
import { Dropdown } from '../../app/components/Dropdown';
import { SearchField } from '../../app/components/SearchField';
import { Panel, SectionHeader, Tabs, Tags } from '../../app/components/UI';
import { ProjectPreview } from '../../app/components/ProjectPreview';
import { ProfilePreview } from '../profile/ProfilePreview';
import { useConnect } from '../connect/ConnectProvider';
import { matchesPerson } from '../connect/selectors';
import { ConnectionAction } from '../connect/components/ConnectionAction';
import { ProjectComposer } from './ProjectComposer';
import { StudioWorkbench } from './StudioWorkbench';
import { useAuthGate } from '../../app/session/AuthGateContext';
import { PostComposer } from '../posts/PostComposer';
import { PostCard } from '../posts/PostCard';
import { PostPreview } from '../posts/PostPreview';
import { postService } from '../posts/postService';
import type { Project } from '../../app/data/models';
import type { Person } from '../connect/types';
import type { Post } from '../posts/types';
import '../../styles/design-tokens.css';
import '../../styles/create-discover.css';

export function CreateModule() {
  const { session } = useSession();
  const { requireAuth } = useAuthGate();
  const workspace = useWorkspace();
  const { people } = useConnect();
  const [createMode, setCreateMode] = useState<'Projects' | 'Posts'>('Projects');
  const [composer, setComposer] = useState<{ type: string; description: string } | null>(null);
  const [postComposerOpen, setPostComposerOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<Project | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [allTemplates, setAllTemplates] = useState(false);
  const [asideType, setAsideType] = useState<'project' | 'post'>('project');
  const [asidePostTitle, setAsidePostTitle] = useState('');
  const [asidePostContent, setAsidePostContent] = useState('');

  // Subscribe to reactive posts
  const posts = useSyncExternalStore(postService.subscribe, () => postService.getAllPosts(), () => []);

  const mine = session
    ? workspace.projects.filter((project) => project.creatorId === session.identity.id)
    : [];
  const displayed = (
    mine.length ? mine : [sampleProjects[0], sampleProjects[1], sampleProjects[3]]
  ).filter(
    (project) =>
      filter === 'All' ||
      project.status === filter ||
      (filter === 'Drafts' && project.status === 'Draft')
  );
  const collaborators = people.filter((person) => matchesPerson(person, query)).slice(0, 3);

  function quickCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const type = String(data.get('type'));
    const description = String(data.get('description'));
    if (!requireAuth('create a project', () => setComposer({ type, description }))) {
      return;
    }
    setComposer({ type, description });
  }

  async function quickCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      requireAuth('create a post', () => {});
      return;
    }
    if (!asidePostTitle.trim() || !asidePostContent.trim()) return;

    try {
      await postService.createPost(
        {
          id: session.identity.id,
          name: session.identity.name,
          username: session.identity.username,
        },
        {
          title: asidePostTitle,
          content: asidePostContent,
          tags: ['Update', 'Create'],
        }
      );
      setAsidePostTitle('');
      setAsidePostContent('');
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="module-columns create-layout">
      <div className="module-main">
        <PageHero
          core="create"
          title={
            <>
              Turn your ideas
              <br />
              into real projects & posts.
            </>
          }
          description="Build. Collaborate. Solve. Create a better tomorrow."
        >
          <div className="hero-actions">
            <button
              className={createMode === 'Projects' ? 'primary-button' : 'secondary-button'}
              onClick={() =>
                requireAuth('create a project', () => setComposer({ type: '', description: '' }))
              }
            >
              <Icon name="create" />
              New Project
            </button>
            <button
              className={createMode === 'Posts' ? 'primary-button' : 'secondary-button'}
              onClick={() =>
                requireAuth('create a post', () => setPostComposerOpen(true))
              }
            >
              <Icon name="pencil" />
              New Post
            </button>
            <button className="secondary-button" onClick={() => navigate('discover')}>
              Explore &rarr;
            </button>
          </div>
        </PageHero>

        <div style={{ margin: '28px 0 36px 0' }}>
          <StudioWorkbench />
        </div>

        <div className="create-type-nav">
          <Tabs
            label="Creation destination"
            values={['Projects', 'Posts']}
            value={createMode}
            onChange={(val) => setCreateMode(val as 'Projects' | 'Posts')}
          />
        </div>

        {createMode === 'Projects' && (
          <>
            <SectionHeader
              title="Start from a template"
              action={allTemplates ? 'Show less' : 'View all'}
              onAction={() => setAllTemplates((value) => !value)}
            />
            <div className="template-grid">
              {projectTemplates.map((template) => (
                <button
                  className="template-card"
                  key={template.type}
                  onClick={() =>
                    requireAuth('start from a template', () =>
                      setComposer({ type: template.type, description: '' })
                    )
                  }
                >
                  <Icon name={template.icon} />
                  <strong>{template.title}</strong>
                  <span>{template.description}</span>
                </button>
              ))}
              {allTemplates &&
                projectTypes
                  .filter((type) => !projectTemplates.some((template) => template.type === type))
                  .map((type) => (
                    <button
                      key={type}
                      className="template-card"
                      onClick={() =>
                        requireAuth('create a project', () => setComposer({ type, description: '' }))
                      }
                    >
                      <Icon name="create" />
                      <strong>{type} Project</strong>
                      <span>Start with an idea of your own.</span>
                    </button>
                  ))}
            </div>

            <div className="section-with-tabs">
              <SectionHeader title="Your Projects" />
              <Tabs
                label="Project status"
                values={['All', 'Ongoing', 'Completed', 'Drafts']}
                value={filter}
                onChange={setFilter}
              />
            </div>
            {!mine.length && (
              <p className="sample-label">Start your first project. Explore these examples for inspiration.</p>
            )}
            <div className="project-rows">
              {displayed.map((project) => (
                <article className="project-row" key={project.id}>
                  <button
                    className="project-row-art"
                    onClick={() => setPreview(project)}
                    aria-label={'View ' + project.title}
                  >
                    <Artwork art={project.art} />
                  </button>
                  <div>
                    <button className="card-title" onClick={() => setPreview(project)}>
                      {project.title}
                    </button>
                    <p>{project.description}</p>
                    <Tags values={project.tags} />
                  </div>
                  <div className="avatar-stack" aria-label={project.members + ' collaborators'}>
                    {project.collaboratorIds.slice(0, 2).map((id) => (
                      <Avatar key={id} name={id} personId={id} small />
                    ))}
                    <span>{project.collaboratorIds.length ? '+' + Math.max(0, project.members - 2) : 'You'}</span>
                  </div>
                  <span className={'status-badge status-' + project.status.toLowerCase()}>{project.status}</span>
                  <Dropdown
                    label={'Actions for ' + project.title}
                    trigger={<Icon name="more"/>}
                    items={[
                      { label: 'View project', action: () => setPreview(project) },
                      {
                        label: 'Use as a starting point',
                        action: () =>
                          requireAuth('start from this project', () =>
                            setComposer({ type: project.type, description: project.description })
                          ),
                      },
                      ...(project.creatorId === session?.identity?.id
                        ? [
                            {
                              label: project.status === 'Completed' ? 'Mark ongoing' : 'Mark completed',
                              action: () =>
                                workspace.updateProject(
                                  project.id,
                                  project.status === 'Completed' ? 'Ongoing' : 'Completed'
                                ),
                            },
                          ]
                        : []),
                    ]}
                  />
                </article>
              ))}
              {!displayed.length && <p className="workspace-empty">No projects in this stage yet.</p>}
            </div>
          </>
        )}

        {createMode === 'Posts' && (
          <div className="create-posts-view">
            <SectionHeader
              title="Community & Project Posts"
              action="Create Post"
              onAction={() => requireAuth('create a post', () => setPostComposerOpen(true))}
            />
            <div className="create-posts-feed">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onOpen={setSelectedPost} />
              ))}
            </div>
          </div>
        )}
      </div>

      <aside className="module-aside">
        <Panel
          title="Create Something New"
          description={asideType === 'project' ? 'Have an idea? Start building today.' : 'Share updates and ideas with the community.'}
        >
          <div className="create-aside-toggle">
            <button
              type="button"
              className={`create-aside-toggle-btn ${asideType === 'project' ? 'is-active' : ''}`}
              onClick={() => setAsideType('project')}
            >
              Project
            </button>
            <button
              type="button"
              className={`create-aside-toggle-btn ${asideType === 'post' ? 'is-active' : ''}`}
              onClick={() => setAsideType('post')}
            >
              Post
            </button>
          </div>

          {asideType === 'project' ? (
            <form className="stack-form quick-project" onSubmit={quickCreateProject}>
              <textarea
                aria-label="Describe your project idea"
                name="description"
                placeholder="Describe your project idea..."
                required
                minLength={10}
              />
              <label>
                Project type
                <select name="type" required defaultValue="">
                  <option value="">Select a type</option>
                  {projectTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <button className="primary-button">Create Project</button>
            </form>
          ) : (
            <form className="stack-form quick-post" onSubmit={quickCreatePost}>
              <input
                type="text"
                placeholder="Post title or topic..."
                required
                value={asidePostTitle}
                onChange={(e) => setAsidePostTitle(e.target.value)}
              />
              <textarea
                placeholder="What progress or question would you like to share?"
                required
                rows={3}
                value={asidePostContent}
                onChange={(e) => setAsidePostContent(e.target.value)}
              />
              <button className="primary-button">Publish Post</button>
            </form>
          )}
        </Panel>

        <Panel title="Find Collaborators" description="Get the right people for your project.">
          <SearchField label="Find collaborators" placeholder="Search skills, roles or people..." value={query} onChange={setQuery} />
          <div className="chip-buttons">
            {suggestedRoles.map((role) => (
              <button
                key={role}
                onClick={() =>
                  setQuery(
                    (
                      {
                        Developer: 'web',
                        Designer: 'design',
                        Researcher: 'research',
                        Hardware: 'electronics',
                        Writer: 'writing',
                        Mentor: 'teaching',
                        Student: 'education',
                        'Data Analyst': 'data',
                      } as Record<string, string>
                    )[role]
                  )
                }
              >
                {role}
              </button>
            ))}
          </div>
          {query && (
            <div className="collaborator-results">
              {collaborators.map((person) => (
                <button key={person.id} className="quiet-button" onClick={() => setPerson(person)}>
                  {person.name}
                  <span>{person.skills.join(', ')}</span>
                </button>
              ))}
              {!collaborators.length && <p>No people found. Try another skill.</p>}
            </div>
          )}
        </Panel>

        <Panel title="Need Inspiration?" description="Explore what others are building.">
          <div className="mini-projects">
            {[sampleProjects[6], sampleProjects[4], sampleProjects[2]].map((project) => (
              <button key={project.id} onClick={() => setPreview(project)}>
                <Artwork art={project.art} />
                <span>
                  <strong>{project.title}</strong>
                  <small>{project.tags.join(' / ')}</small>
                </span>
              </button>
            ))}
          </div>
        </Panel>
      </aside>

      <ProjectComposer initial={composer} onClose={() => setComposer(null)} />
      <PostComposer open={postComposerOpen} onClose={() => setPostComposerOpen(false)} />
      <ProjectPreview project={preview} onClose={() => setPreview(null)} />
      <PostPreview post={selectedPost} onClose={() => setSelectedPost(null)} />
      <ProfilePreview
        person={person}
        onClose={() => setPerson(null)}
        action={person ? <ConnectionAction person={person} onRespond={() => setPerson(null)} /> : undefined}
      />
    </div>
  );
}
