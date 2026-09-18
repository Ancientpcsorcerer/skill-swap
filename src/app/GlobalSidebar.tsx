import { useEffect, useState, useCallback } from 'react';
import { navigate, useApplicationRoute, type ModuleId } from './navigation';
import { Icon } from './components/Icon';
import { useAuthGate } from './session/AuthGateContext';
import { useSession } from './session/SessionProvider';
import { api } from '../lib/api';

const mainNavigationIds: ModuleId[] = ['profile', 'connect', 'create', 'learn', 'discover', 'chat'];

const teachingNavigationItems = [
  { id: 'teaching-profile', tab: 'profile', label: 'Teaching Profile' },
  { id: 'teaching-requests', tab: 'requests', label: 'Teaching Requests' },
  { id: 'teaching-students', tab: 'students', label: 'My Students' },
  { id: 'teaching-classes', tab: 'classes', label: 'Classes' },
  { id: 'teaching-messages', tab: 'messages', label: 'Messages' },
  { id: 'teaching-availability', tab: 'availability', label: 'Availability' },
] as const;

export function GlobalSidebar({ active }: { active: ModuleId }) {
  const { requireAuth } = useAuthGate();
  const { session } = useSession();
  const route = useApplicationRoute();
  const [isTeachingPublished, setIsTeachingPublished] = useState(false);

  const checkTeachingStatus = useCallback(async () => {
    if (!session?.identity?.id) {
      setIsTeachingPublished(false);
      return;
    }
    try {
      const p = await api.teaching.getProfile();
      setIsTeachingPublished(Boolean(p && p.is_published));
    } catch {
      setIsTeachingPublished(false);
    }
  }, [session?.identity?.id]);

  useEffect(() => {
    checkTeachingStatus();
    const handleActivated = () => {
      checkTeachingStatus();
    };
    window.addEventListener('skill-swap:teaching-activated', handleActivated);
    return () => {
      window.removeEventListener('skill-swap:teaching-activated', handleActivated);
    };
  }, [checkTeachingStatus]);

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

  const handleTeachingClick = (tab: string, event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      navigate('teaching', undefined, false, { tab });
    }
  };

  const currentTeachingTab = route.query.get('tab') || 'classes';

  return (
    <aside className="workspace-sidebar">
      <nav aria-label="Application navigation">
        {/* Main Navigation: Profile, Connect, Create, Learn, Discover, Chat */}
        {mainNavigationIds.map((id) => (
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

        {/* Thin separator + Teaching Capability Section (Only when backend confirms teaching is published) */}
        {isTeachingPublished && (
          <>
            <hr className="sidebar-divider" />
            <div className="sidebar-heading">Teaching</div>
            {teachingNavigationItems.map((item) => {
              const isCurrent = active === 'teaching' && currentTeachingTab === item.tab;
              return (
                <a
                  key={item.id}
                  href={`#/app/teaching?tab=${item.tab}`}
                  className="sidebar-teaching-link"
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={(event) => handleTeachingClick(item.tab, event)}
                >
                  <Icon name="teaching" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </>
        )}
      </nav>

      <div className="sidebar-motto">
        A MORE<br />
        COLLABORATIVE<br />
        TOMORROW<span />
      </div>
    </aside>
  );
}
