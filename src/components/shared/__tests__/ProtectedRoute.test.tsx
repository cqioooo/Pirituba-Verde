import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { AuthContext } from '@/providers/authContext';
import { ProtectedRoute } from '../ProtectedRoute';
import { VERSAO_TERMO_ATUAL } from '@/lib/termos';
import type { AuthContextType, Perfil } from '@/types';

const { usePerfilUsuarioMock } = vi.hoisted(() => ({
  usePerfilUsuarioMock: vi.fn(),
}));

vi.mock('@/services/queries', () => ({
  usePerfilUsuario: usePerfilUsuarioMock,
}));

function makeUser(metadata: Record<string, unknown> = {}): User {
  return {
    id: 'user-1',
    email: 'teste@local.test',
    user_metadata: {
      maioridade_declarada: true,
      termo_versao: VERSAO_TERMO_ATUAL,
      termo_aceito_em: '2026-11-16T10:00:00Z',
      ...metadata,
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-11-01T00:00:00Z',
  } as User;
}

function makePerfil(overrides: Partial<Perfil> = {}): Perfil {
  return {
    id: 'user-1',
    nome: 'Usuário Teste',
    perfil: 'cidadao',
    telefone: null,
    avatar_url: null,
    ativo: true,
    reputacao: 0,
    total_denuncias: 0,
    created_at: '2026-11-01T00:00:00Z',
    cpf_hash: null,
    data_nascimento: null,
    rua: null,
    bairro_residencia: null,
    ...overrides,
  };
}

function renderProtected(user: User | null, requiredRoles?: Perfil['perfil'][]) {
  const acceptTermsMock = vi.fn().mockResolvedValue(undefined);
  const authValue: AuthContextType = {
    user,
    session: null,
    loading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    acceptTerms: acceptTermsMock,
    logout: vi.fn(),
  };

  render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={['/gestao/moderacao']}>
        <Routes>
          <Route path="/login" element={<div>Tela de Login</div>} />
          <Route path="/app" element={<div>App Cidadão</div>} />
          <Route
            path="/gestao/moderacao"
            element={
              <ProtectedRoute requiredRoles={requiredRoles}>
                <div>Painel Restrito</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

  return { acceptTermsMock };
}

describe('ProtectedRoute (controle de acesso e re-aceite de termo)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redireciona visitante sem sessão para /login', () => {
    usePerfilUsuarioMock.mockReturnValue({ data: undefined, isLoading: false });
    renderProtected(null, ['gestor']);
    expect(screen.getByText('Tela de Login')).toBeInTheDocument();
  });

  it('bloqueia acesso de cidadão a rota administrativa sem bypass em ambiente dev', () => {
    usePerfilUsuarioMock.mockReturnValue({
      data: makePerfil({ perfil: 'cidadao' }),
      isLoading: false,
    });
    renderProtected(makeUser(), ['gestor', 'analista', 'admin']);
    expect(screen.queryByText('Painel Restrito')).not.toBeInTheDocument();
    expect(screen.getByText('App Cidadão')).toBeInTheDocument();
  });

  it('bloqueia conta desativada', () => {
    usePerfilUsuarioMock.mockReturnValue({
      data: makePerfil({ ativo: false }),
      isLoading: false,
    });
    renderProtected(makeUser());
    expect(screen.queryByText('Painel Restrito')).not.toBeInTheDocument();
    expect(screen.getByText(/conta desativada/i)).toBeInTheDocument();
  });

  it('exige novo aceite quando versão do termo diverge da versão atual', async () => {
    const user = userEvent.setup();
    usePerfilUsuarioMock.mockReturnValue({
      data: makePerfil({ perfil: 'cidadao' }),
      isLoading: false,
    });
    const { acceptTermsMock } = renderProtected(
      makeUser({ termo_versao: '2025-01-01' })
    );

    expect(screen.queryByText('Painel Restrito')).not.toBeInTheDocument();
    expect(screen.getByText(/atualização do termo de uso/i)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/declaro ter 18 anos ou mais/i));
    await user.click(screen.getByLabelText(/li e aceito o termo de uso/i));
    await user.click(screen.getByRole('button', { name: /confirmar aceite e continuar/i }));

    expect(acceptTermsMock).toHaveBeenCalledWith(VERSAO_TERMO_ATUAL);
  });
});
