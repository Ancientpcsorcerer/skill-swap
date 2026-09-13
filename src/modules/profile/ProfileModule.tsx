import { useRef, useState, type FormEvent } from 'react';
import { useSession } from '../../app/session/SessionProvider';
import { useWorkspace } from '../../app/data/WorkspaceProvider';
import { navigate, moduleIds } from '../../app/navigation';
import { Avatar } from '../../app/components/Avatar';
import { SectionHeader, Tags, Tabs } from '../../app/components/UI';
import { ProjectCard } from '../../app/components/ProjectCard';
import { ProjectPreview } from '../../app/components/ProjectPreview';
import { ProfilePreview } from './ProfilePreview';
import { useModalDialog } from '../../hooks/useModalDialog';
import { useConnect } from '../connect/ConnectProvider';
import { PersonRow } from '../connect/components/PersonRow';
import { ConnectionAction } from '../connect/components/ConnectionAction';
import { useAuthGate } from '../../app/session/AuthGateContext';
import type { Project, User } from '../../app/data/models';
import type { Person } from '../connect/types';

export function ProfileModule() {
  const { session, updateProfile } = useSession();
  const { requireAuth, openAuthModal } = useAuthGate();
  const workspace = useWorkspace();
  const { people, requests } = useConnect();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('Projects');
  const [project, setProject] = useState<Project | null>(null);
  const [personPreview, setPersonPreview] = useState<Person | null>(null);
  const [error, setError] = useState('');
  const ref = useRef<HTMLDialogElement>(null);
  useModalDialog(ref, editing);

  const isGuest = !session;
  const guestUser: User = {
    id: 'guest',
    name: 'Guest Explorer',
    username: 'guest',
    email: '',
    bio: 'Browse creators, join collaborative projects, and discover skill swaps across all four Cores.',
    location: '',
    skills: ['Collaboration', 'Skill Sharing'],
    interests: ['Technology', 'Creative Arts', 'Open Source'],
    projectInterests: [],
  };

  const user = session?.identity ?? guestUser;

  // Real connection records from accepted connection requests
  const acceptedIds = new Set(
    requests.filter((r) => r.status === 'accepted').map((r) => r.personId)
  );
  const connectedPeople = people.filter((p) => acceptedIds.has(p.id));

  const created = session
    ? workspace.projects.filter((p) => p.creatorId === user.id)
    : [];
  const collaborating = session
    ? workspace.projects.filter(
        (p) => p.creatorId !== user.id && p.collaboratorIds.includes(user.id)
      )
    : [];

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

  return (
    <section className="profile-module">
      <h1>My Profile</h1>

      {isGuest && (
        <div className="profile-guest-banner">
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

      <div className="profile-identity">
        <Avatar name={user.name} />
        <div>
          <h2>{user.name}</h2>
          <p className="profile-handle">@{user.username}</p>
          <p>{user.bio || 'Share your interests, your ideas and what you would like to build.'}</p>
          {user.location && <small>{user.location}</small>}
          <div className="profile-stats-row">
            <button
              type="button"
              className="profile-stat-badge"
              onClick={() => setTab('Connections')}
            >
              <strong>{connectedPeople.length}</strong>{' '}
              {connectedPeople.length === 1 ? 'Connection' : 'Connections'}
            </button>
            <button
              type="button"
              className="profile-stat-badge"
              onClick={() => setTab('Projects')}
            >
              <strong>{created.length}</strong>{' '}
              {created.length === 1 ? 'Project' : 'Projects'}
            </button>
          </div>
        </div>
        <button
          className="quiet-button"
          onClick={() =>
            requireAuth('edit profile', () => setEditing(true))
          }
        >
          + Edit Profile
        </button>
      </div>

      <div className="profile-skills">
        <section>
          <SectionHeader
            title="Skills"
            action="Add"
            onAction={() => requireAuth('add skills', () => setEditing(true))}
          />
          {user.skills.length ? (
            <Tags values={user.skills} />
          ) : (
            <p>Add the skills you can offer or teach.</p>
          )}
        </section>
        <section>
          <SectionHeader
            title="Interested In"
            action="Add"
            onAction={() => requireAuth('add interests', () => setEditing(true))}
          />
          {user.interests.length ? (
            <Tags values={user.interests} />
          ) : (
            <p>Share what you are curious about.</p>
          )}
        </section>
      </div>

      <Tabs
        label="Profile sections"
        values={['Projects', 'Connections', 'Activity', 'About']}
        value={tab}
        onChange={setTab}
      />

      {tab === 'Projects' && (
        <>
          <SectionHeader
            title="Created by you"
            action="New project"
            onAction={() => requireAuth('create a project', () => navigate('create'))}
          />
          {created.length ? (
            <div className="profile-project-grid">
              {created.map((proj) => (
                <ProjectCard key={proj.id} project={proj} onOpen={setProject} />
              ))}
            </div>
          ) : (
            <div className="profile-empty">
              <h2>Your next idea starts here.</h2>
              <p>Bring your vision to life and find people to build with.</p>
              <button
                className="primary-button"
                onClick={() => requireAuth('create a project', () => navigate('create'))}
              >
                Create a Project
              </button>
            </div>
          )}
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
              <button className="quiet-button" onClick={() => navigate('discover')}>
                Discover projects &rarr;
              </button>
            </p>
          )}
        </>
      )}

      {tab === 'Connections' && (
        <div className="profile-connections-section">
          <SectionHeader
            title={`Connections (${connectedPeople.length})`}
            action="Find collaborators"
            onAction={() => navigate('connect')}
          />
          {connectedPeople.length ? (
            <ul className="people-list people-grid profile-connections-grid">
              {connectedPeople.map((p) => (
                <PersonRow
                  key={p.id}
                  person={p}
                  onPreview={setPersonPreview}
                  action={<ConnectionAction person={p} onRespond={() => {}} />}
                />
              ))}
            </ul>
          ) : (
            <div className="workspace-empty profile-connections-empty">
              <h2>No connections yet</h2>
              <p>
                Connect with collaborators and mentors across the community to build together.
              </p>
              <button className="primary-button" onClick={() => navigate('connect')}>
                Explore Connect &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'Activity' && (
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
          <SectionHeader title="About you" />
          <p>{user.bio || 'Add a short introduction through Edit Profile.'}</p>
          <h2>Things you want to learn</h2>
          {user.projectInterests.length ? (
            <Tags values={user.projectInterests} />
          ) : (
            <p>Add your learning interests through Edit Profile.</p>
          )}
          <h2>Learning goals</h2>
          {workspace.goals.map((goal) => (
            <p key={goal}>{goal}</p>
          ))}
          <h2>Account</h2>
          <p>{user.email || 'Guest Session'}</p>
        </div>
      )}

      <SectionHeader title="Keep exploring" />
      <div className="profile-core-links">
        {moduleIds
          .filter((id) => id !== 'profile')
          .map((id) => (
            <button className="secondary-button" key={id} onClick={() => navigate(id)}>
              {id[0].toUpperCase() + id.slice(1)} &rarr;
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
                  defaultValue={user.projectInterests.join(', ')}
                  maxLength={300}
                />
              </label>
              <p className="input-hint">Separate skills and interests with commas.</p>
              {error && <p role="alert">{error}</p>}
              <button className="primary-button">Save Profile</button>
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
    </section>
  );
}
