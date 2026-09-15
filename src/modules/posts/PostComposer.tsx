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
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useModalDialog(dialogRef, open);

  const handleFileChange = (files: FileList | File[]) => {
    setError('');
    const updated = [...mediaFiles];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const isImg = f.type.startsWith('image/');
      const isVid = f.type.startsWith('video/');

      if (!isImg && !isVid) {
        setError('Only image and video files are supported.');
        continue;
      }

      const imgCount = updated.filter((x) => x.type.startsWith('image/')).length;
      const vidCount = updated.filter((x) => x.type.startsWith('video/')).length;

      if (isImg && imgCount >= 7) {
        setError('Post limit reached: Maximum 7 images allowed.');
        continue;
      }
      if (isVid && vidCount >= 2) {
        setError('Post limit reached: Maximum 2 videos allowed.');
        continue;
      }

      updated.push(f);
    }
    setMediaFiles(updated);
  };

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

      // Upload media files to backend media service
      const imageUrls: string[] = [];
      const videoUrls: string[] = [];

      for (const file of mediaFiles) {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(file);
          });
          const base64Data = await base64Promise;
          const res = await (await import('../../lib/api')).apiClient.media.upload({
            filename: file.name,
            mimeType: file.type,
            base64Data,
          });
          if (res?.url) {
            if (file.type.startsWith('image/')) imageUrls.push(res.url);
            else if (file.type.startsWith('video/')) videoUrls.push(res.url);
          }
        } catch {
          // ignore upload error
        }
      }

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
          imageUrls,
          videoUrls,
        }
      );

      setTitle('');
      setContent('');
      setTagsInput('');
      setSelectedProject('');
      setMediaFiles([]);
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
          <label className="file-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
            e.preventDefault();
            handleFileChange(e.dataTransfer.files);
          }}>
            Drop media files (Max 7 images, 2 videos)
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              aria-label="Post media files"
              onChange={(e) => e.target.files && handleFileChange(e.target.files)}
            />
            <span>
              {mediaFiles.length
                ? `${mediaFiles.filter((m) => m.type.startsWith('image/')).length}/7 images, ${mediaFiles.filter((m) => m.type.startsWith('video/')).length}/2 videos attached`
                : 'Upload images & short demos (Max 7 images, 2 videos)'}
            </span>
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
