import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { usePerfilUsuario } from '@/services/queries';
import { Spinner } from '@/components/ui';
import type { PerfilTipo } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: PerfilTipo[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { data: perfil, isLoading: perfilLoading } = usePerfilUsuario(user?.id);

  const loading = authLoading || (user && perfilLoading);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface-50">
        <div className="text-center space-y-3">
          <Spinner size="lg" />
          <p className="text-sm text-surface-500">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    // Permite bypass temporário em desenvolvimento local para facilitar testes
    if (import.meta.env.DEV) {
      console.warn('[Pirituba Verde] Bypass de roles ativado em ambiente de desenvolvimento.');
      return <>{children}</>;
    }

    if (!perfil) {
      return <Navigate to="/app" replace />;
    }
    if (!requiredRoles.includes(perfil.perfil)) {
      // Se não for gestor/analista/admin, manda pro app do cidadão
      return <Navigate to="/app" replace />;
    }
  }

  return <>{children}</>;
}
