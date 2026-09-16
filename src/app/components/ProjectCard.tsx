import { Avatar } from './Avatar';
import { Artwork } from './Artwork';
import { Tags } from './UI';
import type { Project } from '../data/models';

export function ProjectCard({ project, onOpen }: { project: Project; onOpen: (project: Project) => void }) {
  const coverUrl = project.coverImageUrl || project.cover_image_url;
  const collaborators = project.collaboratorIds || [];

  return (
    <article className="project-card">
      <button
        type="button"
        className="project-art-button"
        onClick={() => onOpen(project)}
        aria-label={'View ' + project.title}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={project.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '8px' }}
          />
        ) : (
          <Artwork art={project.art} label={project.title} />
        )}
      </button>

      <div className="project-card-copy">
        <button type="button" className="card-title" onClick={() => onOpen(project)}>
          {project.title}
        </button>
        <p>{project.description}</p>
        <Tags values={project.tags || []} />

        <div className="project-card-meta">
          <div className="avatar-stack">
            {collaborators.slice(0, 2).map((id) => (
              <Avatar key={id} name={id} personId={id} small />
            ))}
            <span>{project.members || 1} members</span>
          </div>
          {project.rating ? (
            <span aria-label={project.rating + ' out of 5'}>&#9734; {project.rating}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
