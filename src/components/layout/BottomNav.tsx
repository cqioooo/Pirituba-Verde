import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SquaresFour, MapTrifold, FileText, UserCircle } from '@phosphor-icons/react';

const bottomLinks = [
  { to: '/app', icon: SquaresFour, label: 'Início', end: true },
  { to: '/app/mapa', icon: MapTrifold, label: 'Mapa', end: false },
  { to: '/app/minhas-denuncias', icon: FileText, label: 'Denúncias', end: false },
  { to: '/app/perfil', icon: UserCircle, label: 'Perfil', end: false },
];

export function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[5000] bg-white border-t border-surface-200 safe-area-pb"
      aria-label="Menu principal"
    >
      <div className="flex items-center justify-around h-16 px-1">
        {bottomLinks.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-lg min-w-[52px] transition-colors',
                isActive
                  ? 'text-primary-600'
                  : 'text-surface-400 hover:text-surface-600'
              )
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
