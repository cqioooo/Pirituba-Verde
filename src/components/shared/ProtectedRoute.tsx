import { useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePerfilUsuario } from '@/services/queries';
import { Alert, Button, Card, Spinner } from '@/components/ui';
import { VERSAO_TERMO_ATUAL, usuarioPrecisaAceitarTermo } from '@/lib/termos';
import type { PerfilTipo } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: PerfilTipo[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, loading: authLoading, acceptTerms, logout } = useAuth();
  const location = useLocation();
  const { data: perfil, isLoading: perfilLoading } = usePerfilUsuario(user?.id);

  const [maioridadeMarcada, setMaioridadeMarcada] = useState(false);
  const [termoMarcado, setTermoMarcado] = useState(false);
  const [termoErro, setTermoErro] = useState<string | null>(null);
  const [salvandoTermo, setSalvandoTermo] = useState(false);

  const loading = authLoading || (Boolean(user) && perfilLoading);

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

  if (perfil && perfil.ativo === false) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface-50 p-4">
        <Card className="max-w-md w-full space-y-4">
          <Alert variant="error" title="Conta desativada">
            Seu acesso está inativo no momento. Entre em contato com a equipe responsável se precisar de revisão.
          </Alert>
          <Button type="button" variant="secondary" fullWidth onClick={() => void logout()} className="min-h-11">
            Sair da conta
          </Button>
        </Card>
      </div>
    );
  }

  if (requiredRoles && requiredRoles.length > 0) {
    if (!perfil || !requiredRoles.includes(perfil.perfil)) {
      return <Navigate to="/app" replace />;
    }
  }

  if (usuarioPrecisaAceitarTermo(user, perfil)) {
    const handleReaceite = async (event: FormEvent) => {
      event.preventDefault();
      if (!maioridadeMarcada || !termoMarcado) {
        setTermoErro('Confirme a maioridade e o aceite do termo atualizado para continuar.');
        return;
      }
      setTermoErro(null);
      setSalvandoTermo(true);
      try {
        await acceptTerms(VERSAO_TERMO_ATUAL);
      } catch (err) {
        setTermoErro(
          err instanceof Error
            ? err.message
            : 'Não foi possível registrar seu aceite. Tente novamente.'
        );
      } finally {
        setSalvandoTermo(false);
      }
    };

    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface-50 p-4">
        <Card className="max-w-lg w-full space-y-4">
          <div>
            <h1 className="text-xl font-bold text-surface-900">
              Atualização do Termo de Uso
            </h1>
            <p className="mt-1 text-sm text-surface-600">
              Para continuar utilizando os recursos protegidos, confirme a declaração de maioridade e o aceite do Termo de Uso e Privacidade (versão {VERSAO_TERMO_ATUAL}).
            </p>
          </div>

          {termoErro && <Alert variant="error">{termoErro}</Alert>}

          <form onSubmit={handleReaceite} className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer text-sm text-surface-800">
              <input
                type="checkbox"
                checked={maioridadeMarcada}
                onChange={(e) => setMaioridadeMarcada(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Declaro ter 18 anos ou mais.</span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer text-sm text-surface-800">
              <input
                type="checkbox"
                checked={termoMarcado}
                onChange={(e) => setTermoMarcado(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
              />
              <span>
                Li e aceito o Termo de Uso e Aviso de Privacidade (versão {VERSAO_TERMO_ATUAL}).
              </span>
            </label>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void logout()}
                disabled={salvandoTermo}
                className="min-h-11"
              >
                Sair
              </Button>
              <Button
                type="submit"
                loading={salvandoTermo}
                className="min-h-11"
              >
                Confirmar aceite e continuar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
