import { NavLink, useNavigate } from 'react-router-dom';
import { SquaresFour, Bell, MapTrifold as MapIcon, List, ShieldCheck, Gear, SignOut, ChartLineUp } from '@phosphor-icons/react';
import { authService } from '@/services/auth.service';
import { useModeracoesPendentes } from '@/services/queries';
import { cn } from '@/lib/utils';

interface GestaoSidebarProps {
  onClose?: () => void;
}

export function GestaoSidebar({ onClose }: GestaoSidebarProps) {
  const navigate = useNavigate();
  const { data: moderacoes } = useModeracoesPendentes();
  
  const pendentes = moderacoes?.length || 0;

  const handleLogout = async () => {
    await authService.signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/gestao', icon: SquaresFour, label: 'Visão Operacional', end: true },
    { to: '/gestao/alertas', icon: Bell, label: 'Alertas' },
    { to: '/gestao/mapa', icon: MapIcon, label: 'Mapa Operacional' },
    { to: '/gestao/analytics', icon: ChartLineUp, label: 'Relatórios' },
    { to: '/gestao/pontos', icon: List, label: 'Pontos de Descarte' },
    { 
      to: '/gestao/moderacao', 
      icon: ShieldCheck, 
      label: 'Moderação',
      badge: pendentes > 0 ? pendentes : null 
    },
    { to: '/gestao/configuracoes', icon: Gear, label: 'Configurações' },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-surface-50 border-r border-surface-200 text-surface-900">
      {/* Logo Area */}
      <div className="flex h-16 items-center px-6 font-bold text-lg tracking-tight border-b border-surface-200">
        <span className="text-primary-700 mr-1">Pirituba</span>
        <span className="text-surface-900">Verde</span>
        <span className="ml-2 rounded bg-primary-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-700">
          Operação
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-surface-200/50 text-surface-900 font-semibold'
                  : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
              )
            }
          >
            <div className="flex items-center">
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                  // isActive is handled by parent text color, but we can't easily access it here
                  // so we inherit currentColor
                )}
                aria-hidden="true"
              />
              {item.label}
            </div>
            {item.badge !== null && item.badge !== undefined && (
              <span className="ml-auto inline-block rounded-full bg-danger-500 px-2 py-0.5 text-xs font-semibold text-white">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="border-t border-surface-800 p-4">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-danger-600"
        >
          <SignOut className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          Sair do sistema
        </button>
      </div>
    </div>
  );
}
