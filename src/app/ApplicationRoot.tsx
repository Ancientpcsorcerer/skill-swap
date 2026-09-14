import { useLayoutEffect } from 'react';
import { App as CinematicExperience } from './App';
import { ApplicationShell } from './ApplicationShell';
import { AuthModule } from '../modules/auth/AuthModule';
import { navigate, useApplicationRoute, type ModuleId } from './navigation';
import { SessionProvider, useSession } from './session/SessionProvider';
import { apiAuth } from './session/apiAuth';
import './application.css';
function ProductExperience(){
  const route = useApplicationRoute();
  const { session } = useSession();
  const inWorkspace = route.view !== null;
  const authRoute = route.view === 'signup' || route.view === 'login';

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [inWorkspace]);

  useLayoutEffect(() => {
    if (session && authRoute) {
      navigate(route.next ?? 'profile', undefined, true);
    }
  }, [session, authRoute, route.next]);

  // Landing page with Big Frame portal entry
  if (!route.view) return <CinematicExperience onEnterConnect={() => navigate('connect')} />;

  // Explicit signup or login routes render full AuthModule
  if (authRoute) {
    return (
      <AuthModule
        key={route.view}
        mode={route.view === 'login' ? 'login' : 'signup'}
        next={route.next ?? undefined}
      />
    );
  }

  // Workspace modules are accessible for both authenticated users and guest browsers.
  // Protected actions within each module are guarded by AuthGateContext.
  const activeModule: ModuleId = (route.view as ModuleId) || 'connect';
  return <ApplicationShell key={session ? session.identity.id : 'guest'} active={activeModule} />;
}
export function ApplicationRoot(){return <SessionProvider provider={apiAuth}><ProductExperience/></SessionProvider>;}
