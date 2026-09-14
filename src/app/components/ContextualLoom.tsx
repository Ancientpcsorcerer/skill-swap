import { useState, useRef, useEffect } from 'react';
import { useConnect } from '../../modules/connect/ConnectProvider';
import { navigate, type ModuleId } from '../navigation';

export function ContextualLoom({ activeModule }: { activeModule: ModuleId }) {
  const [isOpen, setIsOpen] = useState(false);
  const { requests, people } = useConnect();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const acceptedIds = new Set(
    requests.filter((r) => r.status === 'accepted').map((r) => r.personId)
  );
  const connectedCount = people.filter((p) => acceptedIds.has(p.id)).length;
  const pendingIncomingCount = requests.filter(
    (r) => r.direction === 'incoming' && r.status === 'pending'
  ).length;

  return (
    <div className="contextual-loom-dock" ref={containerRef} aria-label="Contextual Loom">
      {isOpen && (
        <div className="contextual-loom-panel" role="dialog" aria-label="Contextual Exchange Loom">
          <div className="loom-panel-header">
            <h3 className="loom-panel-title">⇄ Contextual Exchange Loom</h3>
            <button
              type="button"
              className="quiet-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close loom"
              style={{ fontSize: '16px', padding: '0 4px', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: 'var(--sw-ink-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--sw-canvas-warm)', borderRadius: '8px' }}>
              <span>Connected Collaborators:</span>
              <strong style={{ color: 'var(--sw-ink-primary)' }}>{connectedCount}</strong>
            </div>
            {pendingIncomingCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#fef3c7', borderRadius: '8px', color: '#92400e' }}>
                <span>Pending Requests:</span>
                <strong>{pendingIncomingCount}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--sw-canvas-warm)', borderRadius: '8px' }}>
              <span>Active Workspace:</span>
              <strong style={{ color: 'var(--sw-ink-primary)', textTransform: 'capitalize' }}>{activeModule}</strong>
            </div>
          </div>

          <div className="loom-quick-actions">
            <button
              type="button"
              className="loom-action-btn"
              onClick={() => {
                setIsOpen(false);
                navigate('chat');
              }}
            >
              Open Chat
            </button>
            <button
              type="button"
              className="loom-action-btn"
              onClick={() => {
                setIsOpen(false);
                navigate('connect');
              }}
            >
              Radar & Connect
            </button>
            <button
              type="button"
              className="loom-action-btn"
              onClick={() => {
                setIsOpen(false);
                navigate('create');
              }}
            >
              Studio Workbench
            </button>
            <button
              type="button"
              className="loom-action-btn"
              onClick={() => {
                setIsOpen(false);
                navigate('discover');
              }}
            >
              Living Feed
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="contextual-loom-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Toggle Contextual Loom"
      >
        <span className="loom-pulse-dot" aria-hidden="true" />
        <span>
          {connectedCount > 0
            ? `✦ ${connectedCount} Collaborator${connectedCount === 1 ? '' : 's'}`
            : '⇄ Skill Loom'}
        </span>
        {pendingIncomingCount > 0 && (
          <span style={{ background: '#d97706', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px' }}>
            {pendingIncomingCount}
          </span>
        )}
      </button>
    </div>
  );
}
