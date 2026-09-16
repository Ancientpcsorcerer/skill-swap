import { useState, type FormEvent } from 'react';
import { useSession } from '../../app/session/SessionProvider';
import { useWorkspace } from '../../app/data/WorkspaceProvider';
import { useAuthGate } from '../../app/session/AuthGateContext';
import { postService } from '../posts/postService';
import { projectTypes } from '../../app/data/catalog';
import { LiveCardPreview } from './LiveCardPreview';
import { navigate } from '../../app/navigation';
import { api } from '../../lib/api';

interface BlueprintTemplate {
  name: string;
  title: string;
  type: string;
  description: string;
  vision: string;
  requiredSkills: string[];
  tags: string[];
}

const BLUEPRINT_TEMPLATES: BlueprintTemplate[] = [
  {
    name: 'Design System Sprint',
    title: 'Design System Architecture & Tokens',
    type: 'Design',
    description: 'Architecting a multi-brand design token pipeline with Figma Variables, hairline border primitives, and vanilla CSS modules.',
    vision: 'Enable seamless theme swapping with mathematically verified color contrasts and micro-motion primitives.',
    requiredSkills: ['UI/UX', 'Design Tokens', 'Figma', 'CSS'],
    tags: ['design-system', 'tokens', 'ui-ux'],
  },
  {
    name: 'Open Source Rust Engine',
    title: 'High-Performance WASM Data Pipeline',
    type: 'Engineering',
    description: 'Building a zero-copy binary parser compiled to WebAssembly for real-time in-browser data streaming and parsing.',
    vision: 'Demonstrate near-native client-side performance without server-side compute bottlenecks.',
    requiredSkills: ['Rust', 'WebAssembly', 'TypeScript'],
    tags: ['rust', 'wasm', 'performance'],
  },
  {
    name: 'Mobile Skill Swap App',
    title: 'Cross-Platform Skill Swap Mobile Client',
    type: 'Mobile',
    description: 'React Native companion client for offline skill indexing and proximity-based peer collaboration and discovery.',
    vision: 'Empower decentralized peer collaboration anywhere with fluid mobile gestures and offline caching.',
    requiredSkills: ['React Native', 'TypeScript', 'Mobile UX'],
    tags: ['mobile', 'react-native', 'ios'],
  },
  {
    name: 'AI Knowledge Graph',
    title: 'Semantic Skill Matchmaking Engine',
    type: 'AI/ML',
    description: 'Vector-driven semantic similarity matching between complementary teaching and learning profiles.',
    vision: 'Automate reciprocal discovery with embeddings and sparse keyword cross-indexing.',
    requiredSkills: ['Python', 'Embeddings', 'FastAPI'],
    tags: ['ai', 'vector-search', 'python'],
  },
];

export function StudioWorkbench() {
  const { session } = useSession();
  const { requireAuth } = useAuthGate();
  const workspace = useWorkspace();

  const [mode, setMode] = useState<'Project' | 'Post'>('Project');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [vision, setVision] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['TypeScript', 'UI/UX']);
  const [newSkill, setNewSkill] = useState('');
  const [tags, setTags] = useState<string[]>(['collaboration', 'skill-swap']);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedToast, setPublishedToast] = useState<{ id: string; title: string; kind: 'project' | 'post' } | null>(null);

  const authorName = session?.identity.name || 'Practitioner (You)';

  function applyBlueprint(template: BlueprintTemplate) {
    setTitle(template.title);
    setType(template.type);
    setDescription(template.description);
    setVision(template.vision);
    setRequiredSkills([...template.requiredSkills]);
    setTags([...template.tags]);
  }

  function addSkill() {
    const trimmed = newSkill.trim();
    if (trimmed && !requiredSkills.includes(trimmed)) {
      setRequiredSkills([...requiredSkills, trimmed]);
      setNewSkill('');
    }
  }

  function removeSkill(skillToRemove: string) {
    setRequiredSkills(requiredSkills.filter((s) => s !== skillToRemove));
  }

  function addTag() {
    const trimmed = newTag.trim().toLowerCase().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag('');
    }
  }

  function removeTag(tagToRemove: string) {
    setTags(tags.filter((t) => t !== tagToRemove));
  }

  async function handlePublish(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    if (!session) {
      requireAuth(mode === 'Project' ? 'publish a project' : 'publish a post', () => {});
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'Project') {
        const serverProject = await api.projects.create({
          title: title.trim(),
          type,
          description: description.trim(),
          vision: vision.trim() || description.trim(),
          required_skills: requiredSkills,
          tags,
          art: 'product',
        });

        const created = workspace.addProject({
          ...serverProject,
          title: title.trim(),
          type,
          description: description.trim(),
          vision: vision.trim() || description.trim(),
          requiredSkills,
          status: 'Ongoing',
          art: 'product',
          tags,
          files: [],
        });

        setPublishedToast({
          id: created.id,
          title: created.title,
          kind: 'project',
        });
      } else {
        const created = await postService.createPost(
          {
            id: session.identity.id,
            name: session.identity.name,
            username: session.identity.username,
          },
          {
            title: title.trim(),
            content: description.trim(),
            tags,
          }
        );

        setPublishedToast({
          id: created.id,
          title: created.title,
          kind: 'post',
        });
      }

      // Reset fields
      setTitle('');
      setDescription('');
      setVision('');
    } catch (err) {
      console.error('Publishing failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="studio-workbench">
      <header className="studio-workbench-hero">
        <div className="studio-workbench-eyebrow">Studio Workbench</div>
        <h2 className="studio-workbench-title">Craft and publish initiatives.</h2>
        <p className="studio-workbench-desc">
          Compose collaborative project blueprints or share technical insights. Watch your initiative format
          live and instantly broadcast it into the Discovery stream.
        </p>
      </header>

      {/* Mode Switcher */}
      <div>
        <div className="studio-mode-switcher" role="tablist" aria-label="Creation Mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'Project'}
            className={`studio-mode-btn ${mode === 'Project' ? 'studio-mode-btn--active' : ''}`}
            onClick={() => setMode('Project')}
          >
            ✦ Project Blueprint
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'Post'}
            className={`studio-mode-btn ${mode === 'Post' ? 'studio-mode-btn--active' : ''}`}
            onClick={() => setMode('Post')}
          >
            ✍ Technical Insight
          </button>
        </div>
      </div>

      <div className="studio-grid">
        {/* Left Pane: Composer */}
        <div className="studio-composer-card">
          {mode === 'Project' && (
            <div className="blueprint-templates">
              <div className="blueprint-header">
                <span className="blueprint-header-title">1-Click Starter Blueprints</span>
                <span style={{ fontSize: '11px', color: 'var(--sw-ink-subtle)' }}>Accelerate setup</span>
              </div>
              <div className="blueprint-chips">
                {BLUEPRINT_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    className="blueprint-chip"
                    onClick={() => applyBlueprint(tmpl)}
                  >
                    ✦ {tmpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handlePublish}>
            <div className="studio-field">
              <label htmlFor="studio-title-input" className="studio-label">
                {mode === 'Project' ? 'Project Initiative Title' : 'Insight Title'}
              </label>
              <input
                id="studio-title-input"
                className="studio-input"
                placeholder={mode === 'Project' ? 'e.g., Cross-Disciplinary Design System' : 'e.g., Rethinking State Machines in Modern React'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {mode === 'Project' && (
              <div className="studio-field">
                <label htmlFor="studio-type-select" className="studio-label">
                  Discipline / Category
                </label>
                <select
                  id="studio-type-select"
                  className="studio-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {projectTypes.filter((t) => t !== 'All').map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="studio-field">
              <label htmlFor="studio-desc-input" className="studio-label">
                {mode === 'Project' ? 'Executive Summary / Goals' : 'Insight Content'}
              </label>
              <textarea
                id="studio-desc-input"
                className="studio-textarea"
                placeholder={
                  mode === 'Project'
                    ? 'Summarize the core technical objective, target milestones, and what collaborators will gain from this exchange.'
                    : 'Share deep technical findings, patterns, or questions for peer discussion.'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {mode === 'Project' && (
              <div className="studio-field">
                <label htmlFor="studio-vision-input" className="studio-label">
                  Long-Term Architectural Vision (Optional)
                </label>
                <input
                  id="studio-vision-input"
                  className="studio-input"
                  placeholder="Where does this project lead? e.g., Production open-source package"
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                />
              </div>
            )}

            {mode === 'Project' && (
              <div className="studio-field">
                <label className="studio-label">Required Complementary Skills</label>
                <div className="tag-builder-wrapper">
                  <div className="tag-builder-input-row">
                    <input
                      className="studio-input"
                      placeholder="Add a required skill (e.g. Three.js, PostgreSQL)"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <button type="button" className="sw-pill-badge sw-pill-badge--active" onClick={addSkill}>
                      + Add
                    </button>
                  </div>
                  <div className="tag-builder-chips">
                    {requiredSkills.map((skill) => (
                      <span key={skill} className="tag-removable-chip">
                        {skill}
                        <button
                          type="button"
                          className="tag-remove-btn"
                          onClick={() => removeSkill(skill)}
                          aria-label={`Remove ${skill}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="studio-field">
              <label className="studio-label">Topic Tags</label>
              <div className="tag-builder-wrapper">
                <div className="tag-builder-input-row">
                  <input
                    className="studio-input"
                    placeholder="Add tag (e.g. typescript, design-tokens)"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <button type="button" className="sw-pill-badge sw-pill-badge--active" onClick={addTag}>
                    + Tag
                  </button>
                </div>
                <div className="tag-builder-chips">
                  {tags.map((tag) => (
                    <span key={tag} className="tag-removable-chip">
                      #{tag}
                      <button
                        type="button"
                        className="tag-remove-btn"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove #${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="studio-actions-row">
              <span style={{ fontSize: '12px', color: 'var(--sw-ink-subtle)' }}>
                {session ? `Publishing as ${authorName}` : 'Sign-in prompted on publish'}
              </span>
              <button
                type="submit"
                className="studio-publish-btn"
                disabled={isSubmitting || !title.trim() || !description.trim()}
              >
                {isSubmitting
                  ? 'Broadcasting...'
                  : mode === 'Project'
                  ? '✦ Publish Initiative'
                  : '✍ Publish Insight'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Pane: Sticky Live WYSIWYG Card Preview */}
        <LiveCardPreview
          mode={mode}
          title={title}
          description={description}
          type={type}
          tags={tags}
          requiredSkills={requiredSkills}
          authorName={authorName}
        />
      </div>

      {/* Cross-Core Synergy Toast */}
      {publishedToast && (
        <aside className="synergy-toast" role="alert">
          <div>
            <strong>Successfully Published!</strong> &ldquo;{publishedToast.title}&rdquo; is now live in Discover.
          </div>
          <button
            type="button"
            className="synergy-toast-action"
            onClick={() => {
              navigate('discover');
            }}
          >
            View in Discover →
          </button>
          <button
            type="button"
            style={{ background: 'none', border: 0, color: '#fff', cursor: 'pointer', fontSize: '16px' }}
            onClick={() => setPublishedToast(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </aside>
      )}
    </div>
  );
}
