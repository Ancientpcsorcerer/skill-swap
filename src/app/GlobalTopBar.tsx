import { useSession } from './session/SessionProvider';
import { Avatar } from './components/Avatar';
import { SearchIcon } from './components/SearchField';
import { Dropdown } from './components/Dropdown';
import { Icon } from './components/Icon';
import { moduleIds, navigate } from './navigation';

import { useAuthGate } from './session/AuthGateContext';

export function GlobalTopBar({
  onSearch,
  onOpenAuth,
}: {
  onSearch: () => void;
  onOpenAuth?: (mode?: 'signup' | 'login') => void;
}) {
  const { session, logout } = useSession();
  const { requireAuth } = useAuthGate();

  return (
    <header className="workspace-topbar">
      <span className="workspace-brand">SKILL SWAP</span>
      <div className="workspace-topbar-actions">
        <Dropdown
          label="Quick Access"
          trigger={
            <>
              Quick Access <Icon name="chevron" />
            </>
          }
          items={moduleIds
            .filter((id) => id !== 'profile')
            .map((id) => ({
              label: id.toUpperCase(),
              action: () => {
                if (id === 'chat') {
                  if (!requireAuth('access Chat', () => navigate('chat'))) {
                    return;
                  }
                }
                navigate(id);
              },
            }))}
        />
        <button
          type="button"
          className="workspace-icon-button"
          aria-label="Search people"
          onClick={onSearch}
        >
          <SearchIcon />
        </button>
        {session ? (
          <div className="user-menu">
            <Dropdown
              label="User menu"
              trigger={
                <>
                  <Avatar name={session.identity.name} small />
                  <span>{session.identity.name.split(' ')[0]}</span>
                  <Icon name="chevron" />
                </>
              }
              items={[
                { label: 'My Profile', action: () => navigate('profile') },
                {
                  label: 'Log out',
                  action: () => {
                    logout();
                    navigate('login');
                  },
                },
              ]}
            />
          </div>
        ) : (
          <div className="user-menu guest-user-menu">
            <button
              type="button"
              className="pill guest-auth-top-btn"
              onClick={() => onOpenAuth?.('login')}
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
