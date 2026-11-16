import { Outlet, useLocation } from 'react-router-dom';
import { GestaoSidebar } from './GestaoSidebar';
import { GestaoHeader } from './GestaoHeader';

const FULL_BLEED_ROUTES = ['/gestao/mapa'];

export function GestaoLayout() {
  const location = useLocation();
  const isFullBleed = FULL_BLEED_ROUTES.includes(location.pathname);

  return (
    <div className="flex h-dvh overflow-hidden bg-white">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <GestaoSidebar />
      </div>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <GestaoHeader />

        <main className="min-w-0 flex-1 overflow-y-auto outline-none" tabIndex={-1}>
          {isFullBleed ? (
            <Outlet />
          ) : (
            <div className="mx-auto w-full min-w-0 max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
