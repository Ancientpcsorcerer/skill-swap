import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { useSession } from '../../app/session/SessionProvider';
import { useWorkspace } from '../../app/data/WorkspaceProvider';
import { navigate, moduleIds, useApplicationRoute } from '../../app/navigation';
import { Avatar } from '../../app/components/Avatar';
import { SectionHeader, Tags, Tabs } from '../../app/components/UI';
import { ProjectCard } from '../../app/components/ProjectCard';
import { ProjectPreview } from '../../app/components/ProjectPreview';
import { ProfilePreview } from './ProfilePreview';
import { useModalDialog } from '../../hooks/useModalDialog';
import { useConnect } from '../connect/ConnectProvider';
import { ConnectionAction } from '../connect/components/ConnectionAction';
import { useAuthGate } from '../../app/session/AuthGateContext';
import { api } from '../../lib/api';
import { postService } from '../posts/postService';
import { PostCard } from '../posts/PostCard';
import { PostComposer } from '../posts/PostComposer';
import { PostPreview } from '../posts/PostPreview';
import type { Project, User } from '../../app/data/models';
import type { Person } from '../connect/types';
import type { Post } from '../posts/types';
import '../../styles/design-tokens.css';
import '../../styles/connect-profile-chat.css';

export function ProfileModule() {
  const { session, updateProfile } = useSession();
  const { requireAuth, openAuthModal } = useAuthGate();
  const workspace = useWorkspace();
  const { people, requests } = useConnect();
  const route = useApplicationRoute();

  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('Projects');
  const [project, setProject] = useState<Project | null>(null);
  const [personPreview, setPersonPreview] = useState<Person | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postComposerOpen, setPostComposerOpen] = useState(false);
  const [error, setError] = useState('');
  const [publicUser, setPublicUser] = useState<User | null>(null);
  const [loadingPublicUser, setLoadingPublicUser] = useState(false);

  const ref = useRef<HTMLDialogElement>(null);
  useModalDialog(ref, editing);

  // Subscribe to reactive posts
  useSyncExternalStore(postService.subscribe, () => postService.getAllPosts(), () => []);

  const currentUserId = session?.identity.id || 'guest';
  const targetUserId = route.user;
  const isViewingOther = Boolean(targetUserId && targetUserId !== currentUserId);

  // Fetch public user if viewing another user's profile
  useEffect(() => {
    if (!isViewingOther || !targetUserId) {
      setPublicUser(null);
      return;
    }

    let active = true;
    setLoadingPublicUser(true);

    // First check local connected/suggested people
    const localPerson = people.find((p) => p.id === targetUserId);
    if (localPerson) {
      setPublicUser({
        id: localPerson.id,
        name: localPerson.name,
        username: localPerson.username || localPerson.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        email: '',
        bio: localPerson.description,
        location: '',
        skills: [...localPerson.skills],
        interests: [...localPerson.interests],
        projectInterests: [...localPerson.projectInterests],
      });
    }

    // Also attempt to fetch latest public profile from real backend API
    api.users
      .getById(targetUserId)
      .then((user) => {
        if (active && user) {
          setPublicUser(user);
        }
      })
      .catch(() => {
        // use localPerson fallback
      })
      .finally(() => {
        if (active) setLoadingPublicUser(false);
      });

    return () => {
      active = false;
    };
  }, [isViewingOther, targetUserId, people]);

  const isGuest = !session;
  const guestUser: User = {
    id: 'guest',
    name: 'Guest Explorer',
    username: 'guest',
    email: '',
    bio: 'Browse creators, join collaborative projects, and discover skill swaps across all Cores.',
    location: '',
    skills: ['Collaboration', 'Skill Sharing'],
    interests: ['Technology', 'Creative Arts', 'Open Source'],
    projectInterests: [],
  };

  const user = isViewingOther && publicUser ? publicUser : (session?.identity ?? guestUser);

  // Real connection records from accepted connection requests
  const acceptedIds = new Set(
    requests.filter((r) => r.status === 'accepted').map((r) => r.personId)
  );
  const connectedPeople = people.filter((p) => acceptedIds.has(p.id));
  const isTargetConnected = isViewingOther && targetUserId ? acceptedIds.has(targetUserId) : false;

  // Projects
  const userProjects = workspace.allProjects.filter(
    (p) => p.creatorId === user.id || (user.id !== 'guest' && p.creatorId === user.username)
  );
  const collaborating = workspace.allProjects.filter(
    (p) => p.creatorId !== user.id && p.collaboratorIds.includes(user.id)
  );

  // Posts
  const userPosts = postService.getPostsByAuthor(user.id);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const list = (key: string) =>
      String(data.get(key))
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    try {
      updateProfile({
        name: String(data.get('name')).trim(),
        username: String(data.get('username')).trim().replace(/^@/, ''),
        bio: String(data.get('bio')).trim(),
        location: String(data.get('location')).trim(),
        skills: list('skills'),
        interests: list('interests'),
        projectInterests: list('goals'),
      });
      setEditing(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Your profile could not be saved.');
    }
  }

  const profileTabs = isViewingOther
    ? ['Projects', 'Posts', 'About']
    : ['Projects', 'Posts', 'Connections', 'Activity', 'About'];

  return (
    <section className="profile-module">
      {isViewingOther ? (
        <div className="profile-view-header" style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className="quiet-button profile-back-btn"
            onClick={() => navigate('profile')}
          >
            &larr; Return to My Profile
          </button>
          <h1>Public Profile</h1>
        </div>
      ) : (
        <h1 style={{ marginBottom: '16px' }}>My Profile</h1>
      )}

      {isGuest && !isViewingOther && (
        <div className="profile-guest-banner" style={{ marginBottom: '20px' }}>
          <p>You are viewing Skill Swap as a guest. Sign in to save projects and build connections.</p>
          <button
            type="button"
            className="pill guest-auth-top-btn"
            onClick={() => openAuthModal('login')}
          >
            Sign In / Register
          </button>
        </div>
      )}

      {loadingPublicUser && !publicUser && (
        <p className="workspace-empty">Loading profile...</p>
      )}

      {/* Editorial Identity Header Deck */}
      <div className="profile-identity profile-identity-card">
        <div className="profile-identity-body">
          <div className="profile-avatar-lockup">
            <Avatar name={user.name} personId={user.id} />
            <div className="profile-user-titles">
              <h2>{user.name}</h2>
              <p className="profile-handle">@{user.username}</p>
              <p className="profile-bio-text">
                {user.bio || 'Share your interests, your ideas and what you would like to build.'}
              </p>
              {user.location && (
                <small style={{ color: 'var(--sw-ink-muted)', display: 'block', marginBottom: '8px' }}>
                  📍 {user.location}
                </small>
              )}

              <div className="profile-stats-row">
                {!isViewingOther && (
                  <button
                    type="button"
                    className="profile-stat-badge"
                    onClick={() => setTab('Connections')}
                  >
                    <strong>{connectedPeople.length}</strong>{' '}
                    {connectedPeople.length === 1 ? 'Connection' : 'Connections'}
                  </button>
                )}
                <button
                  type="button"
                  className="profile-stat-badge"
                  onClick={() => setTab('Projects')}
                >
                  <strong>{userProjects.length}</strong>{' '}
                  {userProjects.length === 1 ? 'Project' : 'Projects'}
                </button>
                <button
                  type="button"
                  className="profile-stat-badge"
                  onClick={() => setTab('Posts')}
                >
                  <strong>{userPosts.length}</strong>{' '}
                  {userPosts.length === 1 ? 'Post' : 'Posts'}
                </button>
                <span className="profile-stat-badge">
                  <strong>{user.skills.length}</strong> Skills
                </span>
              </div>
            </div>
          </div>

          <div className="profile-action-container">
            {isViewingOther ? (
              <div className="profile-other-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isTargetConnected ? (
                  <>
                    <span className="sw-pill-badge sw-pill-badge--active">&check; Connected</span>
                    <button
                      type="button"
                      className="connection-button"
                      onClick={() =>
                        requireAuth('message ' + user.name, () =>
                          navigate('chat', undefined, false, { user: user.id })
                        )
                      }
                    >
                      Message
                    </button>
                  </>
                ) : (
                  (() => {
                    const personObj: Person = people.find((p) => p.id === user.id) || {
                      id: user.id,
                      name: user.name,
                      username: user.username,
                      description: user.bio,
                      skills: user.skills,
                      interests: user.interests,
                      projectInterests: user.projectInterests,
                    };
                    return <ConnectionAction person={personObj} />;
                  })()
                )}
              </div>
            ) : (
              <button
                type="button"
                className="quiet-button"
                onClick={() => requireAuth('edit profile', () => setEditing(true))}
              >
                + Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Skills Matrix Deck */}
      <div className="profile-skills profile-skills-matrix">
        <section className="skills-matrix-deck">
          <SectionHeader
            title="Skills"
            action={!isViewingOther ? 'Add' : undefined}
            onAction={!isViewingOther ? () => requireAuth('add skills', () => setEditing(true)) : undefined}
          />
          {user.skills.length ? (
            <Tags values={user.skills} />
          ) : (
            <p style={{ color: 'var(--sw-ink-muted)', fontSize: '13px' }}>No skills listed yet.</p>
          )}
        </section>
        <section className="skills-matrix-deck">
          <SectionHeader
            title="Interested In"
            action={!isViewingOther ? 'Add' : undefined}
            onAction={!isViewingOther ? () => requireAuth('add interests', () => setEditing(true)) : undefined}
          />
          {user.interests.length ? (
            <Tags values={user.interests} />
          ) : (
            <p style={{ color: 'var(--sw-ink-muted)', fontSize: '13px' }}>No interests listed yet.</p>
          )}
        </section>
      </div>

      {/* Content Decks Tabs */}
      <Tabs
        label="Profile sections"
        values={profileTabs}
        value={profileTabs.includes(tab) ? tab : profileTabs[0]}
        onChange={setTab}
      />

      {tab === 'Projects' && (
        <>
          <SectionHeader
            title={isViewingOther ? `Projects by ${user.name}` : 'Created by you'}
            action={!isViewingOther ? 'New project' : undefined}
            onAction={!isViewingOther ? () => requireAuth('create a project', () => navigate('create')) : undefined}
          />
          {userProjects.length ? (
            <div className="profile-project-grid">
              {userProjects.map((proj) => (
                <ProjectCard key={proj.id} project={proj} onOpen={setProject} />
              ))}
            </div>
          ) : (
            <div className="profile-empty">
              <h2>{isViewingOther ? 'No public projects yet.' : 'Your next idea starts here.'}</h2>
              <p>{isViewingOther ? 'Projects will appear here when published.' : 'Bring your vision to life and find people to build with.'}</p>
              {!isViewingOther && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => requireAuth('create a project', () => navigate('create'))}
                >
                  Create a Project
                </button>
              )}
            </div>
          )}

          {!isViewingOther && (
            <>
              <SectionHeader title="Collaborations" />
              {collaborating.length ? (
                <div className="profile-project-grid">
                  {collaborating.map((proj) => (
                    <ProjectCard key={proj.id} project={proj} onOpen={setProject} />
                  ))}
                </div>
              ) : (
                <p className="workspace-empty">
                  Explore projects and find your next collaboration.{' '}
                  <button type="button" className="quiet-button" onClick={() => navigate('discover')}>
                    Discover projects &rarr;
                  </button>
                </p>
              )}
            </>
          )}
        </>
      )}

      {tab === 'Posts' && (
        <div className="profile-posts-section">
          <SectionHeader
            title={isViewingOther ? `Posts by ${user.name} (${userPosts.length})` : `Your Posts (${userPosts.length})`}
            action={!isViewingOther ? 'New post' : undefined}
            onAction={!isViewingOther ? () => requireAuth('create a post', () => setPostComposerOpen(true)) : undefined}
          />
          {userPosts.length > 0 ? (
            <div className="profile-posts-grid">
              {userPosts.map((p) => (
                <PostCard key={p.id} post={p} onOpen={setSelectedPost} />
              ))}
            </div>
          ) : (
            <div className="workspace-empty profile-posts-empty">
              <h2>{isViewingOther ? 'No posts yet' : 'Share your updates'}</h2>
              <p>
                {isViewingOther
                  ? `${user.name} hasn't published any updates or thoughts yet.`
                  : 'Share what you are building, questions, or ideas with fellow creators.'}
              </p>
              {!isViewingOther && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => requireAuth('create a post', () => setPostComposerOpen(true))}
                >
                  Create a Post
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!isViewingOther && tab === 'Connections' && (
        <div className="profile-connections-section">
          <SectionHeader
            title={`Connections (${connectedPeople.length})`}
            action="Find collaborators"
            onAction={() => navigate('connect')}
          />
          {connectedPeople.length ? (
            <ul className="people-list people-grid profile-connections-grid">
              {connectedPeople.map((p) => (
                <li key={p.id} className="person-row person-row--directory">
                  <button
                    className="person-avatar-button"
                    type="button"
                    onClick={() => navigate('profile', undefined, false, { user: p.id })}
                    aria-label={'View ' + p.name + ' profile'}
                  >
                    <Avatar name={p.name} personId={p.id} />
                  </button>
                  <div className="person-summary">
                    <button
                      className="person-name"
                      type="button"
                      onClick={() => navigate('profile', undefined, false, { user: p.id })}
                    >
                      {p.name}
                    </button>
                    <p className="person-username">
                      @{p.username ?? p.name.toLowerCase().replace(/[^a-z]/g, '')}
                    </p>
                    <p className="person-description">{p.description}</p>
                    <Tags values={p.skills} />
                  </div>
                  <div className="person-action profile-connection-item-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        navigate('chat', undefined, false, { user: p.id })
                      }
                    >
                      Message
                    </button>
                    <button
                      type="button"
                      className="quiet-button"
                      onClick={() =>
                        navigate('profile', undefined, false, { user: p.id })
                      }
                    >
                      View Profile &rarr;
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="workspace-empty profile-connections-empty">
              <h2>No connections yet</h2>
              <p>
                Connect with collaborators and mentors across the community to build together.
              </p>
              <button type="button" className="primary-button" onClick={() => navigate('connect')}>
                Explore Connect &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {!isViewingOther && tab === 'Activity' && (
        <>
          <SectionHeader title="Your activity" />
          {workspace.activity.length ? (
            <ul className="activity-list">
              {workspace.activity.map((item) => (
                <li key={item.id}>
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="workspace-empty">Project updates will appear here as you start building.</p>
          )}
        </>
      )}

      {tab === 'About' && (
        <div className="profile-about">
          <SectionHeader title={isViewingOther ? `About ${user.name}` : 'About you'} />
          <p>{user.bio || (isViewingOther ? 'No bio provided.' : 'Add a short introduction through Edit Profile.')}</p>
          <h2>Things {isViewingOther ? `${user.name} wants` : 'you want'} to learn</h2>
          {user.projectInterests && user.projectInterests.length ? (
            <Tags values={user.projectInterests} />
          ) : (
            <p>{isViewingOther ? 'None specified.' : 'Add your learning interests through Edit Profile.'}</p>
          )}
          {!isViewingOther && (
            <>
              <h2>Learning goals</h2>
              {workspace.goals.map((goal) => (
                <p key={goal}>{goal}</p>
              ))}
              <h2>Account</h2>
              <p>{user.email || 'Guest Session'}</p>
            </>
          )}
        </div>
      )}

      <SectionHeader title="Keep exploring" />
      <div className="profile-core-links">
        {moduleIds
          .filter((id) => id !== 'profile')
          .map((id) => (
            <button type="button" className="secondary-button" key={id} onClick={() => navigate(id)}>
              {id === 'chat' ? 'Chat' : id[0].toUpperCase() + id.slice(1)} &rarr;
            </button>
          ))}
      </div>

      <dialog
        className="workspace-dialog"
        ref={ref}
        aria-labelledby="edit-profile-title"
        onCancel={(event) => {
          event.preventDefault();
          setEditing(false);
        }}
        onClose={() => setEditing(false)}
      >
        <div className="workspace-dialog-content">
          <button
            type="button"
            className="workspace-dialog-close quiet-button"
            onClick={() => setEditing(false)}
          >
            Close
          </button>
          <h2 id="edit-profile-title">Edit Profile</h2>
          {editing && (
            <form className="stack-form" onSubmit={save}>
              <label>
                Name
                <input
                  autoFocus
                  name="name"
                  defaultValue={user.name}
                  required
                  minLength={2}
                  maxLength={80}
                />
              </label>
              <label>
                Username
                <input
                  name="username"
                  defaultValue={user.username}
                  required
                  pattern="[a-zA-Z0-9_]{2,30}"
                  title="2-30 letters, numbers or underscores"
                />
              </label>
              <label>
                Short bio
                <textarea name="bio" defaultValue={user.bio} maxLength={400} />
              </label>
              <label>
                Location
                <input name="location" defaultValue={user.location} maxLength={100} />
              </label>
              <label>
                Skills you can offer
                <input
                  name="skills"
                  defaultValue={user.skills.join(', ')}
                  placeholder="Robotics, design, photography"
                  maxLength={300}
                />
              </label>
              <label>
                Interests
                <input
                  name="interests"
                  defaultValue={user.interests.join(', ')}
                  placeholder="Environment, writing, music"
                  maxLength={300}
                />
              </label>
              <label>
                Things you want to learn
                <input
                  name="goals"
                  defaultValue={user.projectInterests?.join(', ') || ''}
                  maxLength={300}
                />
              </label>
              <p className="input-hint">Separate skills and interests with commas.</p>
              {error && <p role="alert">{error}</p>}
              <button type="submit" className="primary-button">Save Profile</button>
            </form>
          )}
        </div>
      </dialog>

      <ProjectPreview project={project} onClose={() => setProject(null)} />
      <ProfilePreview
        person={personPreview}
        onClose={() => setPersonPreview(null)}
        action={
          personPreview ? (
            <ConnectionAction person={personPreview} onRespond={() => setPersonPreview(null)} />
          ) : undefined
        }
      />
      <PostComposer
        open={postComposerOpen}
        onClose={() => setPostComposerOpen(false)}
      />
      <PostPreview
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </section>
  );
}
