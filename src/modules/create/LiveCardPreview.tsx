import { Artwork } from '../../app/components/Artwork';
import { Avatar } from '../../app/components/Avatar';

interface LiveCardPreviewProps {
  mode: 'Project' | 'Post';
  title: string;
  description: string;
  type?: string;
  tags: string[];
  requiredSkills?: string[];
  authorName: string;
}

export function LiveCardPreview({
  mode,
  title,
  description,
  type = 'Engineering',
  tags,
  requiredSkills = [],
  authorName,
}: LiveCardPreviewProps) {
  const displayTitle = title.trim() || (mode === 'Project' ? 'Untitled Project Blueprint' : 'Untitled Insight');
  const displayDesc = description.trim() || (
    mode === 'Project'
      ? 'Define your project vision, collaborative goals, and technical requirements in the composer to watch your live card take shape.'
      : 'Share your perspective, learning takeaways, or architectural discoveries with the community.'
  );

  return (
    <div className="live-preview-pane">
      <div className="live-preview-header">
        <span className="live-preview-badge">Live Card Preview</span>
        <span style={{ fontSize: '11px', color: 'var(--sw-ink-subtle)', letterSpacing: '0.04em' }}>
          WYSIWYG Synchronized
        </span>
      </div>

      <div className="live-preview-card">
        <div className="live-preview-art">
          <Artwork art={mode === 'Project' ? 'urban' : 'drone'} />
          <span className="live-preview-type-tag">
            {mode === 'Project' ? type : 'Insight'}
          </span>
        </div>

        <div className="live-preview-body">
          <h3 className="live-preview-title">{displayTitle}</h3>
          <p className="live-preview-desc">{displayDesc}</p>

          {mode === 'Project' && requiredSkills.length > 0 && (
            <div className="feed-card-reciprocal">
              <span className="feed-card-reciprocal-seeking">
                Seeking: {requiredSkills.slice(0, 2).join(', ')}
              </span>
              <span className="sw-arrow">⇄</span>
              <span className="feed-card-reciprocal-offering">Offering: {type}</span>
            </div>
          )}

          {tags.length > 0 && (
            <div className="tag-builder-chips">
              {tags.map((tag) => (
                <span key={tag} className="sw-pill-badge">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="live-preview-meta-row">
            <div className="live-preview-author">
              <Avatar name={authorName} small />
              <span>{authorName}</span>
            </div>
            <span>Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
}
