import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/providers/authContext';
import { RegisterForm } from '../components/RegisterForm';
import { VERSAO_TERMO_ATUAL } from '@/lib/termos';
import type { AuthContextType } from '@/types';

function renderRegisterForm(overrides: Partial<AuthContextType> = {}) {
  const registerMock = vi.fn().mockResolvedValue(undefined);
  const value: AuthContextType = {
    user: null,
    session: null,
    loading: false,
    error: null,
    login: vi.fn(),
    register: registerMock,
    acceptTerms: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  };

  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    </AuthContext.Provider>
  );

  return { registerMock };
}

describe('RegisterForm (cadastro mínimo, maioridade e termo)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bloqueia envio sem declaração de maioridade e aceite do termo', async () => {
    const user = userEvent.setup();
    const { registerMock } = renderRegisterForm();

    await user.type(screen.getByLabelText(/e-mail/i), 'cidadao@teste.local');
    await user.type(screen.getByLabelText(/^senha/i), 'SenhaSegura123');
    await user.type(screen.getByLabelText(/confirmar senha/i), 'SenhaSegura123');
    await user.click(screen.getByRole('button', { name: /criar minha conta/i }));

    expect(registerMock).not.toHaveBeenCalled();
    expect(screen.getByText(/confirme que você tem 18 anos ou mais/i)).toBeInTheDocument();
    expect(screen.getByText(/você precisa ler e aceitar o termo de uso/i)).toBeInTheDocument();
  });

  it('permite cadastro mínimo com e-mail, senha, maioridade e termo sem exigir CPF ou endereço', async () => {
    const user = userEvent.setup();
    const { registerMock } = renderRegisterForm();

    await user.type(screen.getByLabelText(/e-mail/i), 'minimo@teste.local');
    await user.type(screen.getByLabelText(/^senha/i), 'SenhaSegura123');
    await user.type(screen.getByLabelText(/confirmar senha/i), 'SenhaSegura123');
    await user.click(screen.getByLabelText(/declaro ter 18 anos ou mais/i));
    await user.click(screen.getByLabelText(/li e aceito o termo de uso/i));
    await user.click(screen.getByRole('button', { name: /criar minha conta/i }));

    expect(registerMock).toHaveBeenCalledTimes(1);
    const payload = registerMock.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      email: 'minimo@teste.local',
      cpf: undefined,
      maioridadeDeclarada: true,
      termoAceito: true,
      termoVersao: VERSAO_TERMO_ATUAL,
    });
    expect(typeof payload.termoAceitoEm).toBe('string');
    expect(screen.getByText(/conta criada!/i)).toBeInTheDocument();
  });
});
