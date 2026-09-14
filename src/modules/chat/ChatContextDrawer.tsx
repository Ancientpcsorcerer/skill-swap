import { Avatar } from '../../app/components/Avatar';
import { Tags } from '../../app/components/UI';
import { navigate } from '../../app/navigation';
import type { ChatParticipant } from './types';
import type { ApplicationSession } from '../../app/session/SessionProvider';

interface ChatContextDrawerProps {
  partner: ChatParticipant;
  session: ApplicationSession | null;
  onClose: () => void;
}

export function ChatContextDrawer({ partner, session, onClose }: ChatContextDrawerProps) {
  const userSkills = new Set(session?.identity.skills.map((s) => s.toLowerCase()) || []);
  const partnerSkills = partner.skills || [];

  // Reciprocal comparison
  const mutualSkills = partnerSkills.filter((s) => userSkills.has(s.toLowerCase()));
  const complementarySkills = partnerSkills.filter((s) => !userSkills.has(s.toLowerCase()));

  return (
    <aside className="chat-context-drawer" aria-label="Collaborator Context">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sw-ink-muted)' }}>
          Collaborator Dossier
        </h3>
        <button
          type="button"
          className="quiet-button"
          onClick={onClose}
          aria-label="Close dossier drawer"
          style={{ fontSize: '18px', padding: '0 4px', lineHeight: 1 }}
        >
          &times;
        </button>
      </div>

      <div className="drawer-section" style={{ textAlign: 'center' }}>
        <Avatar name={partner.name} personId={partner.id} />
        <h4 style={{ margin: '10px 0 2px 0', fontSize: '1.05rem', color: 'var(--sw-ink-primary)' }}>{partner.name}</h4>
        <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--sw-ink-muted)' }}>@{partner.username}</p>
        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--sw-ink-secondary)', lineHeight: 1.45 }}>
          {partner.bio || 'Active collaborator on Skill Swap.'}
        </p>
      </div>

      <div className="drawer-section">
        <h4>Reciprocal Synergy</h4>
        {complementarySkills.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--sw-ink-muted)', display: 'block', marginBottom: '4px' }}>
              ✦ Skills they can teach you:
            </span>
            <Tags values={complementarySkills.slice(0, 4)} />
          </div>
        )}

        {mutualSkills.length > 0 && (
          <div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--sw-ink-muted)', display: 'block', marginBottom: '4px' }}>
              ⇄ Shared common interests:
            </span>
            <Tags values={mutualSkills} />
          </div>
        )}

        {partnerSkills.length === 0 && (
          <p style={{ fontSize: '12px', color: 'var(--sw-ink-muted)', margin: 0 }}>
            Skills are being synchronized with the exchange graph.
          </p>
        )}
      </div>

      <div className="drawer-section">
        <h4>Collaboration Actions</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            className="secondary-button"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => navigate('profile', undefined, false, { user: partner.id })}
          >
            Full Profile &rarr;
          </button>
          <button
            type="button"
            className="quiet-button"
            style={{ width: '100%', textAlign: 'center', fontSize: '12px' }}
            onClick={() => navigate('create')}
          >
            Start Project with {partner.name}
          </button>
        </div>
      </div>
    </aside>
  );
}
