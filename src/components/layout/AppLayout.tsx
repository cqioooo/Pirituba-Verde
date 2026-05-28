import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';

/** Routes that need full-bleed layout (no max-width, no padding) */
const FULL_BLEED_ROUTES = ['/app/mapa'];

export function AppLayout() {
  const location = useLocation();
  const isFullBleed = FULL_BLEED_ROUTES.some(route => location.pathname === route);

  return (
    <div className="min-h-dvh flex flex-col bg-surface-50">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        {!isFullBleed && <AppSidebar />}
        {isFullBleed ? (
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <Outlet />
            </div>
          </main>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
