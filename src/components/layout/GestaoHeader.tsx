import { useState } from 'react';
import { List, User as UserIcon } from '@phosphor-icons/react';
import { useAuth } from '@/providers/AuthProvider';
import { usePerfilUsuario } from '@/services/queries';
import { BottomSheet } from '../ui/BottomSheet';
import { GestaoSidebar } from './GestaoSidebar';

export function GestaoHeader() {
  const { user } = useAuth();
  const { data: perfil } = usePerfilUsuario(user?.id);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-200 bg-white px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <button
            type="button"
            className="-ml-2 mr-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-surface-500 hover:bg-surface-100 hover:text-surface-700 md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Abrir menu</span>
            <List className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex items-center text-sm text-surface-500 md:hidden">
            <span className="font-semibold text-primary-700">Pirituba Verde</span>
            <span className="mx-2">/</span>
            <span>Gestão</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium text-surface-900">
              {perfil?.nome || user?.email}
            </p>
            <p className="text-xs text-surface-500 capitalize">
              {perfil?.perfil || 'Usuário'}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            <UserIcon className="h-5 w-5" />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <BottomSheet
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Menu de Gestão"
      >
        <div className="-mx-4 -mb-4 mt-2 h-[calc(100vh-5rem)]">
          <GestaoSidebar onClose={() => setMobileMenuOpen(false)} />
        </div>
      </BottomSheet>
    </>
  );
}
