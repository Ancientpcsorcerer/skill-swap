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
  if (!route.view) return <CinematicExperience onEnterConnect={(core) => navigate((core as ModuleId) || 'connect')} />;

  // All workspace core routes require authentication; non-authenticated visits present AuthModule
  if (!session) {
    return (
      <AuthModule
        key={authRoute ? route.view : 'signup'}
        mode={route.view === 'login' ? 'login' : 'signup'}
        next={authRoute ? route.next ?? undefined : (route.view as ModuleId)}
      />
    );
  }

  const activeModule: ModuleId = authRoute ? (route.next ?? 'profile') : (route.view as ModuleId);
  return <ApplicationShell key={session.identity.id} active={activeModule} />;
}
export function ApplicationRoot(){return <SessionProvider provider={apiAuth}><ProductExperience/></SessionProvider>;}
