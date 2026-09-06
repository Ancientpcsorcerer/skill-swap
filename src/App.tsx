import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { initLenis } from '@/lib/lenis';
import { prefersReducedMotion } from '@/lib/gsap';

const Home = lazy(() => import('@/routes/Home/Home').then((m) => ({ default: m.Home })));
const Discover = lazy(() => import('@/routes/Discover/Discover').then((m) => ({ default: m.Discover })));
const Profile = lazy(() => import('@/routes/Profile/Profile').then((m) => ({ default: m.Profile })));
const Exchange = lazy(() => import('@/routes/Exchange/Exchange').then((m) => ({ default: m.Exchange })));
const Inbox = lazy(() => import('@/routes/Inbox/Inbox').then((m) => ({ default: m.Inbox })));
const Me = lazy(() => import('@/routes/Me/Me').then((m) => ({ default: m.Me })));
const Onboard = lazy(() => import('@/routes/Onboard/Onboard').then((m) => ({ default: m.Onboard })));
const NotFound = lazy(() => import('@/routes/NotFound/NotFound').then((m) => ({ default: m.NotFound })));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
};

export const App = () => {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    initLenis();
  }, []);

  return (
    <div className="app">
      <a href="#main" className="skip-link">Skip to content</a>
      <Nav />
      <ScrollToTop />
      <main id="main">
        <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/people/:id" element={<Profile />} />
            <Route path="/exchange/new" element={<Exchange />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/me" element={<Me />} />
            <Route path="/onboard" element={<Onboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};
