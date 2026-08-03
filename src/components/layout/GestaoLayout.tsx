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
      <div className="flex flex-1 flex-col overflow-hidden">
        <GestaoHeader />

        <main className="flex-1 overflow-y-auto outline-none" tabIndex={-1}>
          {isFullBleed ? (
            <Outlet />
          ) : (
            <div className="mx-auto max-w-[1400px] px-6 py-8">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
