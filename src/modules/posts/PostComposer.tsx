import { useRef, useState, type FormEvent } from 'react';
import { useSession } from '../../app/session/SessionProvider';
import { useAuthGate } from '../../app/session/AuthGateContext';
import { useWorkspace } from '../../app/data/WorkspaceProvider';
import { useModalDialog } from '../../hooks/useModalDialog';
import { postService } from './postService';
import type { Post } from './types';

export function PostComposer({
  open,
  onClose,
  onCreated,
  initialProjectTitle,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (post: Post) => void;
  initialProjectTitle?: string;
}) {
  const { session } = useSession();
  const { requireAuth } = useAuthGate();
  const workspace = useWorkspace();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedProject, setSelectedProject] = useState(initialProjectTitle || '');
  const [art, setArt] = useState('idea');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useModalDialog(dialogRef, open);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) {
      requireAuth('publish a post', () => {});
      return;
    }

    if (!title.trim()) {
      setError('Please provide a title for your post.');
      return;
    }
    if (!content.trim()) {
      setError('Please write some content for your post.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const newPost = await postService.createPost(
        {
          id: session.identity.id,
          name: session.identity.name,
          username: session.identity.username,
        },
        {
          title,
          content,
          tags,
          projectTag: selectedProject.trim() || undefined,
          art,
        }
      );

      setTitle('');
      setContent('');
      setTagsInput('');
      setSelectedProject('');
      onCreated?.(newPost);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="workspace-dialog post-composer-dialog"
      aria-labelledby="post-composer-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <div className="workspace-dialog-content">
        <button
          type="button"
          className="workspace-dialog-close quiet-button"
          onClick={onClose}
        >
          Close
        </button>

        <h2 id="post-composer-title">Create a Post</h2>
        <p className="dialog-subtitle">
          Share your progress, insights, experiments, or discoveries with the community.
        </p>

        {error && (
          <p role="alert" className="form-error-alert">
            {error}
          </p>
        )}

        <form className="stack-form post-composer-form" onSubmit={handleSubmit}>
          <label>
            Post Title
            <input
              type="text"
              required
              placeholder="What are you building, learning, or discovering?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              autoFocus
            />
          </label>

          <label>
            Content
            <textarea
              required
              rows={4}
              placeholder="Write your update, reflections, project progress, or questions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
            />
          </label>

          <label>
            Associate with Project (Optional)
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">No Project Association</option>
              {workspace.projects.map((proj) => (
                <option key={proj.id} value={proj.title}>
                  {proj.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tags
            <input
              type="text"
              placeholder="Robotics, CleanTech, Python (comma separated)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              maxLength={120}
            />
          </label>

          <label>
            Post Type
            <select value={art} onChange={(e) => setArt(e.target.value)}>
              <option value="idea">Idea / Reflection</option>
              <option value="product">Project Progress</option>
              <option value="event">Announcement / Milestone</option>
            </select>
          </label>

          <div className="dialog-actions">
            <button
              type="button"
              className="quiet-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting || !title.trim() || !content.trim()}
            >
              {isSubmitting ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
