import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useModalDialog } from '../../hooks/useModalDialog';
import { useWorkspace } from '../../app/data/WorkspaceProvider';
import { projectTypes } from '../../app/data/catalog';
import { apiClient } from '../../lib/api';

interface UploadedMediaItem {
  file: File;
  previewUrl: string;
  isImage: boolean;
  isVideo: boolean;
}

export function ProjectComposer({
  initial,
  onClose,
}: {
  initial: { type: string; description: string } | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useModalDialog(dialog, !!initial);
  const { addProject } = useWorkspace();

  const [mediaItems, setMediaItems] = useState<UploadedMediaItem[]>([]);
  const [coverIndex, setCoverIndex] = useState<number>(0);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [errorNotice, setErrorNotice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    setMediaItems([]);
    setCoverIndex(0);
    setVisibility('public');
    setErrorNotice('');
  }, [initial]);

  function handleFileSelection(files: FileList | File[]) {
    setErrorNotice('');
    const newItems: UploadedMediaItem[] = [...mediaItems];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        setErrorNotice('Unsupported format. Only images and videos are supported.');
        continue;
      }

      const currentImages = newItems.filter((m) => m.isImage).length;
      const currentVideos = newItems.filter((m) => m.isVideo).length;

      if (isImage && currentImages >= 7) {
        setErrorNotice('Maximum limit reached: Up to 7 images allowed per project.');
        continue;
      }
      if (isVideo && currentVideos >= 3) {
        setErrorNotice('Maximum limit reached: Up to 3 videos allowed per project.');
        continue;
      }

      newItems.push({
        file,
        previewUrl: URL.createObjectURL(file),
        isImage,
        isVideo,
      });
    }

    setMediaItems(newItems);
  }

  function removeMediaItem(index: number) {
    setMediaItems((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (coverIndex >= updated.length) {
        setCoverIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorNotice('');
    setIsSubmitting(true);

    const data = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    const intent = data.get('intent') === 'draft' ? 'Draft' : 'Ongoing';
    const title = String(data.get('title')).trim();
    const description = String(data.get('description')).trim();
    const vision = String(data.get('vision')).trim();
    const type = String(data.get('type'));
    const skills = String(data.get('skills'))
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      // Upload media files to backend media service
      const uploadedUrls: string[] = [];
      for (const item of mediaItems) {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(item.file);
          });
          const base64Data = await base64Promise;
          const res = await apiClient.media.upload({
            filename: item.file.name,
            mimeType: item.file.type,
            base64Data,
            isPrivate: visibility === 'private',
          });
          if (res?.url) {
            uploadedUrls.push(res.url);
          }
        } catch {
          // ignore upload error
        }
      }

      const coverImageUrl = uploadedUrls[coverIndex] || (uploadedUrls.length > 0 ? uploadedUrls[0] : undefined);

      // Create project in PostgreSQL database
      const serverProject = await apiClient.projects.create({
        title,
        description,
        vision,
        type,
        tags: [type],
        required_skills: skills,
        art: 'product',
      });

      if (coverImageUrl) {
        try {
          await apiClient.projects.setCoverImage(serverProject.id, coverImageUrl);
        } catch (err) {
          console.warn('Cover image attachment failed:', err);
        }
      }

      if (visibility === 'private') {
        try {
          await apiClient.projects.updateVisibility(serverProject.id, 'private');
        } catch (err) {
          console.warn('Visibility update failed:', err);
        }
      }

      addProject({
        ...serverProject,
        title,
        description,
        vision,
        type,
        requiredSkills: skills,
        tags: [type],
        status: intent,
        art: 'product',
        visibility,
        coverImageUrl,
        cover_image_url: coverImageUrl,
        files: mediaItems.map((m) => ({ name: m.file.name, size: m.file.size })),
      });

      onClose();
    } catch (err: any) {
      setErrorNotice(err?.message || 'Failed to create project. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="workspace-dialog project-composer"
      aria-labelledby="composer-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="workspace-dialog-content">
        <button type="button" className="workspace-dialog-close quiet-button" onClick={onClose}>
          Close
        </button>
        <h2 id="composer-title">Create a Project</h2>
        <p>Turn your ideas into collaborative reality with real media and custom visibility.</p>

        {errorNotice && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            {errorNotice}
          </div>
        )}

        {initial && (
          <form key={initial.type + initial.description} onSubmit={submit} className="stack-form">
            <label>
              Project title
              <input
                autoFocus
                name="title"
                placeholder="Give your project a clear name..."
                required
                minLength={3}
                maxLength={100}
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                defaultValue={initial.description}
                placeholder="Tell us about your project..."
                required
                minLength={10}
                maxLength={1000}
              />
            </label>

            <label>
              Vision
              <textarea
                name="vision"
                placeholder="What do you want to achieve?"
                required
                maxLength={1000}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label>
                Project type
                <select name="type" defaultValue={initial.type} required>
                  <option value="">Select a type</option>
                  {projectTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label>
                Visibility Scope
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                  style={{ width: '100%' }}
                >
                  <option value="public">Public (Discoverable by everyone)</option>
                  <option value="private">Private (Team & authorized only)</option>
                </select>
              </label>
            </div>

            <label>
              Required skills or roles
              <input name="skills" placeholder="Design, research, photography..." maxLength={200} />
            </label>

            {/* Media Uploads & Cover Selector (Limits: Max 7 images, 3 videos) */}
            <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <label className="file-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                e.preventDefault();
                handleFileSelection(e.dataTransfer.files);
              }}>
                Drop media files (Max 7 images, 3 videos)
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  aria-label="Project media files"
                  onChange={(e) => e.target.files && handleFileSelection(e.target.files)}
                />
                <span>
                  {mediaItems.length
                    ? `${mediaItems.filter((m) => m.isImage).length}/7 images, ${mediaItems.filter((m) => m.isVideo).length}/3 videos attached`
                    : 'Upload project images & demo videos'}
                </span>
              </label>

              {/* Media Thumbnails with Cover Image Selector */}
              {mediaItems.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {mediaItems.map((item, idx) => (
                    <div
                      key={item.previewUrl}
                      onClick={() => item.isImage && setCoverIndex(idx)}
                      style={{
                        position: 'relative',
                        width: '80px',
                        height: '60px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: coverIndex === idx && item.isImage ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.2)',
                        cursor: item.isImage ? 'pointer' : 'default',
                      }}
                      title={item.isImage ? (coverIndex === idx ? 'Current Cover Image' : 'Click to set as Cover') : 'Video item'}
                    >
                      {item.isImage ? (
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b', fontSize: '0.7rem' }}>
                          🎬 Video
                        </div>
                      )}

                      {coverIndex === idx && item.isImage && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: '#6366f1',
                            color: '#fff',
                            fontSize: '0.6rem',
                            textAlign: 'center',
                            fontWeight: 700,
                          }}
                        >
                          COVER
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMediaItem(idx);
                        }}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: 'rgba(0, 0, 0, 0.6)',
                          color: '#fff',
                          border: 'none',
                          fontSize: '10px',
                          lineHeight: '1',
                          cursor: 'pointer',
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="secondary-button"
                name="intent"
                value="draft"
                disabled={isSubmitting}
              >
                Save Draft
              </button>
              <button
                type="submit"
                className="primary-button"
                name="intent"
                value="publish"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
