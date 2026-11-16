import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { AuthContext } from '@/providers/authContext';
import { NewReportPage } from '@/features/citizen/pages/NewReportPage';
import type { AuthContextType } from '@/types';

const { enviarMock, confirmarMock, proximityMockRef } = vi.hoisted(() => ({
  enviarMock: vi.fn(),
  confirmarMock: vi.fn(),
  proximityMockRef: {
    current: {
      scenario: 'novo_ponto' as 'novo_ponto' | 'confirmar',
      nearbyPoints: [] as Array<{
        id: string;
        distancia_metros: number;
        status: 'novo';
        categoria_principal: string | null;
        confirmacoes: number;
        criticidade: number | null;
        recorrente: boolean;
      }>,
    },
  },
}));

vi.mock('@/services/queries', async () => {
  const actual = await vi.importActual<typeof import('@/services/queries')>('@/services/queries');
  return {
    ...actual,
    useConfiguracoes: () => ({
      data: {
        raio_geofence_metros: 15,
        raio_agrupamento_metros: 50,
        raio_faixa_cinzenta_metros: 100,
        confirmacoes_para_validar: 4,
        limite_denuncias_por_dia: 3,
      },
    }),
    useRateLimit: () => ({
      data: { permitido: true, quantidade: 0, limite: 3, restante: 3 },
      isLoading: false,
    }),
    usePontoAutenticado: () => ({ data: null }),
    usePontosAutenticados: () => ({ data: [] }),
    useEnviarOcorrencia: () => ({ mutateAsync: enviarMock }),
    useConfirmarPonto: () => ({ mutateAsync: confirmarMock }),
  };
});

vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    latitude: -23.48,
    longitude: -46.73,
    effectiveCoords: [-23.48, -46.73],
    hasLocation: true,
    loading: false,
    error: null,
    requestLocation: vi.fn(),
  }),
}));

const MOCK_GEOCODE_RESULT = {
  resultado: { endereco: 'Rua Paula Ferreira, 100', bairro: 'Pirituba', fonte: 'nominatim' as const },
  loading: false,
};

vi.mock('@/hooks/useProximityCheck', () => ({
  useProximityCheck: () => proximityMockRef.current,
}));

vi.mock('@/hooks/useReverseGeocode', () => ({
  useReverseGeocode: () => MOCK_GEOCODE_RESULT,
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  useMapEvents: () => ({ flyTo: vi.fn() }),
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const authValue: AuthContextType = {
    user: { id: 'cidadao-a', email: 'a@teste.local' } as User,
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
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/app/nova-denuncia']}>
          <NewReportPage />
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}

describe('NewReportPage (exigência mínima de 2 fotos válidas)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    proximityMockRef.current = { scenario: 'novo_ponto', nearbyPoints: [] };
    if (!URL.createObjectURL) {
      URL.createObjectURL = vi.fn(() => 'blob:mock-preview');
    } else {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-preview');
    }
  });

  it('bloqueia avanço para revisão com 0 ou 1 foto e libera com 2 fotos válidas', async () => {
    const user = userEvent.setup();
    renderPage();

    // Etapa 1 -> 2 -> 3
    await user.click(screen.getByRole('button', { name: /continuar/i }));
    await user.click(screen.getByRole('button', { name: /continuar/i }));

    // Preencher campos obrigatórios
    await user.click(screen.getByRole('button', { name: /entulho/i }));
    await user.click(screen.getByRole('button', { name: /^diária$/i }));
    await user.click(screen.getByRole('button', { name: /manhã/i }));
    await user.click(screen.getByRole('button', { name: /médio/i }));

    // 0 fotos -> bloqueado
    await user.click(screen.getByRole('button', { name: /continuar/i }));
    expect(screen.getByText(/anexe no mínimo 2 fotos comprobatórias válidas/i)).toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const f1 = new File([new Uint8Array([1, 2, 3])], 'foto1.jpg', { type: 'image/jpeg' });
    const f2 = new File([new Uint8Array([4, 5, 6])], 'foto2.png', { type: 'image/png' });

    // 1 foto -> ainda bloqueado
    await user.upload(fileInput, [f1]);
    await user.click(screen.getByRole('button', { name: /continuar/i }));
    expect(screen.getByText(/anexe no mínimo 2 fotos comprobatórias válidas/i)).toBeInTheDocument();

    // 2 fotos -> avança para revisão
    await user.upload(fileInput, [f2]);
    await user.click(screen.getByRole('button', { name: /continuar/i }));
    expect(screen.getByRole('heading', { name: /revise sua denúncia/i })).toBeInTheDocument();
  });

  it('ao selecionar ponto existente na verificação, pula detalhes e confirma diretamente via confirmarPonto', async () => {
    const user = userEvent.setup();
    confirmarMock.mockResolvedValueOnce(undefined);
    proximityMockRef.current = {
      scenario: 'confirmar',
      nearbyPoints: [
        {
          id: 'ponto-prox-1',
          distancia_metros: 10,
          status: 'novo',
          categoria_principal: 'organico',
          confirmacoes: 1,
          criticidade: null,
          recorrente: false,
        },
      ],
    };

    renderPage();

    // Etapa 1 -> Etapa 2
    await user.click(screen.getByRole('button', { name: /continuar/i }));

    // Selecionar o ponto próximo encontrado
    await user.click(screen.getByRole('button', { name: /rua paula ferreira, 100/i }));
    expect(screen.getByText(/selecionado para confirmar este ponto/i)).toBeInTheDocument();

    // Avançar pula o formulário de nova denúncia (Etapa 3) e vai direto para confirmação (Etapa 4)
    await user.click(screen.getByRole('button', { name: /confirmar ponto selecionado/i }));
    expect(screen.getByRole('heading', { name: /confirmação de ponto existente/i })).toBeInTheDocument();
    expect(screen.queryByText(/tipo de resíduo predominante/i)).not.toBeInTheDocument();

    // Concluir confirmação chama confirmarPonto (e NÃO enviarOcorrencia)
    await user.click(screen.getByRole('button', { name: /^confirmar ponto$/i }));
    expect(confirmarMock).toHaveBeenCalledWith({
      ponto_id: 'ponto-prox-1',
      usuario_id: 'cidadao-a',
      latitude: -23.48,
      longitude: -46.73,
    });
    expect(enviarMock).not.toHaveBeenCalled();
    expect(screen.getByText(/confirmação registrada!/i)).toBeInTheDocument();
  });
});
