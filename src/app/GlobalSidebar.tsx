import { moduleIds, navigate, type ModuleId } from './navigation';
import { Icon } from './components/Icon';
import { useAuthGate } from './session/AuthGateContext';

export function GlobalSidebar({ active }: { active: ModuleId }) {
  const { requireAuth } = useAuthGate();

  const getLabel = (id: ModuleId) => {
    return id[0].toUpperCase() + id.slice(1);
  };

  const handleClick = (id: ModuleId, event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      if (id === 'chat') {
        if (!requireAuth('access Chat', () => navigate('chat'))) {
          return;
        }
      }
      navigate(id);
    }
  };

  return (
    <aside className="workspace-sidebar">
      <nav aria-label="Application navigation">
        {moduleIds.map((id) => (
          <a
            key={id}
            href={'#/app/' + id}
            aria-current={active === id ? 'page' : undefined}
            onClick={(event) => handleClick(id, event)}
          >
            <Icon name={id} />
            <span>{getLabel(id)}</span>
          </a>
        ))}
      </nav>
      <div className="sidebar-motto">
        A MORE<br />
        COLLABORATIVE<br />
        TOMORROW<span />
      </div>
    </aside>
  );
}
