import { useSession } from './session/SessionProvider';
import { Avatar } from './components/Avatar';
import { SearchIcon } from './components/SearchField';
import { Dropdown } from './components/Dropdown';
import { Icon } from './components/Icon';
import { navigate } from './navigation';
import { BrandMark } from '../components/ui/BrandMark';

export function GlobalTopBar({
  onSearch,
  onOpenAuth,
}: {
  onSearch: () => void;
  onOpenAuth?: (mode?: 'signup' | 'login') => void;
}) {
  const { session, logout } = useSession();

  return (
    <header className="workspace-topbar">
      <a
        href="#/"
        className="workspace-brand-link"
        aria-label="Skill Swap Home — Return to landing page"
        title="Return to Landing Page"
        onClick={(e) => {
          if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            navigate(null);
          }
        }}
      >
        <BrandMark className="workspace-brand-logo" />
      </a>

      <div className="workspace-topbar-actions">
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
