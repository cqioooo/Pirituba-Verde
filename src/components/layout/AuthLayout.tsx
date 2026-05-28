import { Outlet, Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-dvh bg-surface-50 flex flex-col">
      {/* Header minimalista */}
      <header className="py-6 px-4">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 text-primary-700 hover:text-primary-600 transition-colors"
        >
          <Leaf className="w-7 h-7 text-primary-600" />
          <span className="text-lg font-bold tracking-tight">Pirituba Verde</span>
        </Link>
      </header>

      {/* Conteúdo centralizado */}
      <main className="flex-1 flex items-start justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Footer mínimo */}
      <footer className="py-4 text-center text-xs text-surface-400">
        Pirituba Verde — Projeto de utilidade pública
      </footer>
    </div>
  );
}
