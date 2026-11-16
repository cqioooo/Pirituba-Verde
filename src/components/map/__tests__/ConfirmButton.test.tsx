import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { AuthContext } from '@/providers/authContext';
import { ConfirmButton } from '../ConfirmButton';
import type { AuthContextType } from '@/types';

const {
  useGeolocationMock,
  useVerificarConfirmacaoMock,
  useConfirmarPontoMock,
  useConfiguracoesMock,
} = vi.hoisted(() => ({
  useGeolocationMock: vi.fn(),
  useVerificarConfirmacaoMock: vi.fn(),
  useConfirmarPontoMock: vi.fn(),
  useConfiguracoesMock: vi.fn(),
}));

vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: useGeolocationMock,
}));

vi.mock('@/services/queries', () => ({
  useVerificarConfirmacao: useVerificarConfirmacaoMock,
  useConfirmarPonto: useConfirmarPontoMock,
  useConfiguracoes: useConfiguracoesMock,
}));

function renderConfirmButton(
  props: {
    pontoId: string;
    pontoLatitude?: number;
    pontoLongitude?: number;
    autorId?: string | null;
  },
  userId = 'cidadao-b'
) {
  const authValue: AuthContextType = {
    user: { id: userId, email: 'b@teste.local' } as User,
    session: null,
    loading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    acceptTerms: vi.fn(),
    logout: vi.fn(),
  };

  render(
    <AuthContext.Provider value={authValue}>
      <ConfirmButton {...props} />
    </AuthContext.Provider>
  );
}

describe('ConfirmButton (proximidade real e bloqueio de auto-confirmação)', () => {
  const mutateAsyncMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useConfiguracoesMock.mockReturnValue({
      data: { raio_geofence_metros: 15, confirmacoes_para_validar: 4 },
    });
    useVerificarConfirmacaoMock.mockReturnValue({ data: false, isLoading: false });
    useConfirmarPontoMock.mockReturnValue({ mutateAsync: mutateAsyncMock, isPending: false });
  });

  it('impede o autor original de se contabilizar como confirmação externa', () => {
    useGeolocationMock.mockReturnValue({
      latitude: -23.48,
      longitude: -46.73,
      loading: false,
      error: null,
      requestLocation: vi.fn(),
    });

    renderConfirmButton(
      { pontoId: 'p-1', pontoLatitude: -23.48, pontoLongitude: -46.73, autorId: 'cidadao-a' },
      'cidadao-a'
    );

    expect(screen.queryByRole('button', { name: /confirmar/i })).not.toBeInTheDocument();
    expect(screen.getByText(/confirmações externas dependem de outros moradores/i)).toBeInTheDocument();
  });

  it('bloqueia confirmação fora do raio de 15m sem chamar mutação', async () => {
    const user = userEvent.setup();
    useGeolocationMock.mockReturnValue({
      latitude: -23.481,
      longitude: -46.73,
      loading: false,
      error: null,
      requestLocation: vi.fn(),
    });

    renderConfirmButton({
      pontoId: 'p-1',
      pontoLatitude: -23.48,
      pontoLongitude: -46.73,
    });

    await user.click(screen.getByRole('button', { name: /ainda está aqui\? confirmar/i }));
    expect(mutateAsyncMock).not.toHaveBeenCalled();
    expect(screen.getByText(/precisa estar a até 15 m/i)).toBeInTheDocument();
  });

  it('envia coordenadas reais quando usuário está dentro do raio de 15m', async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockResolvedValue(undefined);
    useGeolocationMock.mockReturnValue({
      latitude: -23.48004,
      longitude: -46.73004,
      loading: false,
      error: null,
      requestLocation: vi.fn(),
    });

    renderConfirmButton({
      pontoId: 'p-1',
      pontoLatitude: -23.48,
      pontoLongitude: -46.73,
    });

    await user.click(screen.getByRole('button', { name: /ainda está aqui\? confirmar/i }));
    expect(mutateAsyncMock).toHaveBeenCalledWith({
      ponto_id: 'p-1',
      usuario_id: 'cidadao-b',
      latitude: -23.48004,
      longitude: -46.73004,
    });
    expect(screen.getByText(/você já confirmou este ponto/i)).toBeInTheDocument();
  });
});
