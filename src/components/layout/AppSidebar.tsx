import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Map,
  FileText,
  History,
  Bell,
  UserCircle,
} from 'lucide-react';

const sidebarLinks = [
  { to: '/app', icon: LayoutDashboard, label: 'Início', end: true },
  { to: '/app/mapa', icon: Map, label: 'Mapa', end: false },
  { to: '/app/minhas-denuncias', icon: FileText, label: 'Minhas Denúncias', end: false },
  { to: '/app/historico', icon: History, label: 'Histórico', end: false },
  { to: '/app/notificacoes', icon: Bell, label: 'Notificações', end: false },
  { to: '/app/perfil', icon: UserCircle, label: 'Perfil', end: false },
];

export function AppSidebar() {
  return (
    <aside className="hidden md:flex w-56 shrink-0 border-r border-surface-200 bg-white">
      <nav className="flex flex-col w-full py-4 px-3 space-y-0.5" aria-label="Menu principal">
        {sidebarLinks.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
              )
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
