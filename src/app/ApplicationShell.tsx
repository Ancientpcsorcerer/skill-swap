import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { GlobalTopBar } from './GlobalTopBar';
import { GlobalSidebar } from './GlobalSidebar';
import { navigate, type ModuleId } from './navigation';
import { WorkspaceProvider, useWorkspace } from './data/WorkspaceProvider';
import { ConnectProvider } from '../modules/connect/ConnectProvider';
import { ConnectModule } from '../modules/connect/ConnectModule';
import { ProfileModule } from '../modules/profile/ProfileModule';
import { CreateModule } from '../modules/create/CreateModule';
import { LearnModule } from '../modules/learn/LearnModule';
import { DiscoverModule } from '../modules/discover/DiscoverModule';
import { ChatModule } from '../modules/chat/ChatModule';
import { AuthGateProvider, useAuthGate } from './session/AuthGateContext';
import { SignupModal } from '../components/auth/SignupModal';
import { ContextualLoom } from './components/ContextualLoom';
import { TeachingModule } from '../modules/teaching/TeachingModule';

import { ErrorBoundary } from './components/ErrorBoundary';

const modules = {
  connect: ConnectModule,
  create: CreateModule,
  discover: DiscoverModule,
  learn: LearnModule,
  chat: ChatModule,
  profile: ProfileModule,
  teaching: TeachingModule,
};

function Shell({ active }: { active: ModuleId }) {
  const [searchRequest, setSearchRequest] = useState(0);
  const handledSearch = useCallback(() => setSearchRequest(0), []);
  const main = useRef<HTMLElement>(null);
  const previous = useRef(active);
  const { storageError } = useWorkspace();
  const {
    authModalOpen,
    authModalMode,
    actionNotice,
    closeAuthModal,
    handleAuthSuccess,
    openAuthModal,
  } = useAuthGate();

  useLayoutEffect(() => {
    if (previous.current !== active) {
      main.current?.scrollTo(0, 0);
      main.current?.focus({ preventScroll: true });
    }
    previous.current = active;
  }, [active]);

  const Module = modules[active];

  return (
    <div className="application-shell" data-active-module={active}>
      <div className="sw-grain-overlay" aria-hidden="true" />
      <a
        className="workspace-skip"
        href="#workspace-content"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      <GlobalTopBar
        onSearch={() => {
          navigate('connect');
          setSearchRequest((value) => value + 1);
        }}
        onOpenAuth={(mode) => openAuthModal(mode)}
      />
      <GlobalSidebar active={active} />
      <main id="workspace-content" className="workspace-content" ref={main} tabIndex={-1}>
        <ErrorBoundary moduleName={active} key={active}>
          <Module searchRequest={searchRequest} onSearchHandled={handledSearch} />
        </ErrorBoundary>
        {storageError && (
          <p role="alert" className="storage-error">
            {storageError}
          </p>
        )}
      </main>
      <ContextualLoom activeModule={active} />
      <SignupModal
        open={authModalOpen}
        onClose={closeAuthModal}
        onAuthSuccess={handleAuthSuccess}
        notice={actionNotice}
        initialMode={authModalMode}
      />
    </div>
  );
}

export function ApplicationShell({ active }: { active: ModuleId }) {
  return (
    <AuthGateProvider>
      <ConnectProvider>
        <WorkspaceProvider>
          <Shell active={active} />
        </WorkspaceProvider>
      </ConnectProvider>
    </AuthGateProvider>
  );
}
