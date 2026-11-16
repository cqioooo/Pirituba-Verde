import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ItemFilaModeracao, OcorrenciaDetalheGestao } from '@/types';

const { rpcMock, serviceMocks } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  serviceMocks: {
    fetchConfiguracoes: vi.fn(),
    fetchModeracoesPendentes: vi.fn(),
    fetchOcorrenciaDetalheGestao: vi.fn(),
    fetchEvidenciasAssinadas: vi.fn(),
    executarAcaoModeracao: vi.fn(),
    uploadFotoResolucao: vi.fn(),
    registrarEvidenciaOrfa: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  isSupabaseConfigured: true,
  supabase: {
    rpc: rpcMock,
    auth: { signOut: vi.fn() },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        createSignedUrls: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
    from: vi.fn(),
  },
}));

vi.mock('../OcorrenciaDetailMap', () => ({
  OcorrenciaDetailMap: () => <div data-testid="mock-map">Mapa</div>,
}));

vi.mock('@/services/supabase.service', async () => {
  const actual = await vi.importActual<typeof import('@/services/supabase.service')>(
    '@/services/supabase.service'
  );
  return {
    ...actual,
    fetchConfiguracoes: serviceMocks.fetchConfiguracoes,
    fetchModeracoesPendentes: serviceMocks.fetchModeracoesPendentes,
    fetchOcorrenciaDetalheGestao: serviceMocks.fetchOcorrenciaDetalheGestao,
    fetchEvidenciasAssinadas: serviceMocks.fetchEvidenciasAssinadas,
    executarAcaoModeracao: serviceMocks.executarAcaoModeracao,
    uploadFotoResolucao: serviceMocks.uploadFotoResolucao,
    registrarEvidenciaOrfa: serviceMocks.registrarEvidenciaOrfa,
  };
});

import { GestaoSidebar } from '@/components/layout/GestaoSidebar';
import { ModerationPage } from '../../pages/ModerationPage';
import { OcorrenciaDetailPage } from '../../pages/OcorrenciaDetailPage';

describe('Fluxo completo KAN-79: fila -> detalhe -> moderação -> atualização sem reload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.fetchEvidenciasAssinadas.mockResolvedValue([]);
    serviceMocks.fetchConfiguracoes.mockResolvedValue({
      raio_geofence_metros: 15,
      raio_agrupamento_metros: 50,
      raio_faixa_cinzenta_metros: 100,
      confirmacoes_para_validar: 4,
      limite_denuncias_por_dia: 3,
      dias_visibilidade_resolvido: 2,
      ruido_geolocalizacao_metros: 200,
      alerta_prazo_dias: [20, 27],
      prazo_ciclo_dias: 30,
    });
  });

  it('percorre fila -> detalhe -> ação, atualiza histórico, status e contador sem recarregar e omite PII', async () => {
    const user = userEvent.setup();
    const em2Dias = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    let estadoAtual: 'pendente' | 'em_revisao' = 'pendente';

    const buildFila = (): ItemFilaModeracao[] =>
      estadoAtual === 'pendente'
        ? [
            {
              id: 'oc-fluxo-1',
              data_registro: '2026-11-01T10:00:00Z',
              created_at: '2026-11-01T10:00:00Z',
              status: 'pendente',
              descricao: 'Descarte irregular próximo ao córrego.',
              tipo_residuo: 'entulho',
              volume_estimado: 'grande',
              frequencia_percebida: 'recorrente',
              horario_percebido: 'manha',
              fotos: [],
              foto_url: null,
              prazo_resolucao: em2Dias,
              prorrogado_em: null,
              categoria_principal: 'entulho',
              ponto_id: 'ponto-fluxo-1',
              endereco: 'Av. Raimundo Pereira de Magalhães, 500',
              bairro: 'Pirituba',
              subprefeitura: 'Pirituba/Jaraguá',
              ponto_status: 'em_analise',
              confirmacoes: 2,
              sinal_duplicata: false,
              sinal_faixa_cinzenta: true,
              sinal_reincidencia: true,
              sinal_limite_diario: false,
            },
          ]
        : [];

    const buildDetalhe = (): OcorrenciaDetalheGestao => ({
      ocorrencia: {
        id: 'oc-fluxo-1',
        ponto_id: 'ponto-fluxo-1',
        data_registro: '2026-11-01T10:00:00Z',
        created_at: '2026-11-01T10:00:00Z',
        descricao: 'Descarte irregular próximo ao córrego.',
        categoria_principal: 'entulho',
        tipo_residuo: 'entulho',
        volume_estimado: 'grande',
        frequencia_percebida: 'recorrente',
        horario_percebido: 'manha',
        latitude: -23.48,
        longitude: -46.73,
        status: estadoAtual,
        tipo: 'denuncia',
        prazo_resolucao: em2Dias,
        prorrogado_em: null,
      },
      ponto: {
        id: 'ponto-fluxo-1',
        endereco: 'Av. Raimundo Pereira de Magalhães, 500',
        bairro: 'Pirituba',
        subprefeitura: 'Pirituba/Jaraguá',
        status: 'em_analise',
        quantidade_ocorrencias: 2,
        recorrente: true,
      },
      evidencias_paths: [],
      historico_ponto: [],
      moderacoes:
        estadoAtual === 'em_revisao'
          ? [
              {
                id: 'mod-1',
                motivo: 'faixa_cinzenta',
                status: 'pendente',
                observacao: 'Vistoria agendada com subprefeitura.',
                created_at: '2026-11-01T10:00:00Z',
                updated_at: '2026-11-14T15:00:00Z',
              },
            ]
          : [],
      confirmacoes_distintas_ponto: 2,
      ciclos_anteriores: null,
    });

    serviceMocks.fetchModeracoesPendentes.mockImplementation(async () => buildFila());
    serviceMocks.fetchOcorrenciaDetalheGestao.mockImplementation(async () => buildDetalhe());
    serviceMocks.executarAcaoModeracao.mockImplementationOnce(async () => {
      estadoAtual = 'em_revisao';
      return {
        sucesso: true,
        acao: 'manter_em_analise',
        status_ocorrencia: 'em_revisao',
        status_ponto: 'em_analise',
      };
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/gestao/moderacao']}>
          <div className="flex">
            <GestaoSidebar />
            <main>
              <Routes>
                <Route path="/gestao/moderacao" element={<ModerationPage />} />
                <Route path="/gestao/ocorrencias/:id" element={<OcorrenciaDetailPage />} />
              </Routes>
            </main>
          </div>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // 1. Fila carrega com alerta dinâmico do 27º dia e contador lateral "1"
    await waitFor(() => {
      expect(screen.getByText(/Av\. Raimundo Pereira de Magalhães, 500/i)).toBeInTheDocument();
      expect(screen.getByText(/Alerta 27º dia/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Moderação\s*1/i })).toBeInTheDocument();
    });

    // Nenhum PII do cidadão presente na tela
    const textoFila = container.textContent ?? '';
    expect(textoFila).not.toMatch(/registrado_por|cpf|telefone|@gmail|@hotmail/i);

    // 2. Navega para o detalhe da ocorrência sem reload
    await user.click(screen.getByRole('link', { name: /analisar ocorrência/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /detalhe da ocorrência/i })).toBeInTheDocument();
      expect(screen.getByText(/alerta crítico: 27º dia do ciclo/i)).toBeInTheDocument();
    });

    // Botões compatíveis com `pendente` + ponto `em_analise`
    expect(screen.getByRole('button', { name: /^aprovar$/i })).toBeInTheDocument();
    const btnManter = screen.getByRole('button', { name: /manter em análise/i });
    expect(btnManter).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^invalidar$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /prorrogar prazo/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^resolver$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^arquivar$/i })).not.toBeInTheDocument();

    // 3. Executa ação "Manter em análise" pelo modal
    await user.click(btnManter);
    await user.type(
      screen.getByLabelText(/justificativa da decisão/i),
      'Vistoria agendada com subprefeitura.'
    );
    await user.click(screen.getByRole('button', { name: /confirmar análise/i }));

    // Sucesso no modal e invalidação imediata da cache (detalhe, histórico, sidebar counter)
    await waitFor(() =>
      expect(screen.getByText(/ação registrada com sucesso/i)).toBeInTheDocument()
    );

    await user.click(screen.getAllByRole('button', { name: /^fechar$/i })[0]!);

    await waitFor(() => {
      expect(screen.getByText(/vistoria agendada com subprefeitura\./i)).toBeInTheDocument();
      expect(screen.getByText(/^em revisão$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^resolver$/i })).toBeInTheDocument();
    });

    // Contador da fila na barra lateral atualizou de 1 para 0 (badge oculto) sem recarregar
    expect(screen.queryByRole('link', { name: /Moderação\s*1/i })).not.toBeInTheDocument();
  });

  it('oculta todas as ações de moderação quando a ocorrência está em estado final', async () => {
    serviceMocks.fetchModeracoesPendentes.mockResolvedValue([]);
    serviceMocks.fetchOcorrenciaDetalheGestao.mockResolvedValue({
      ocorrencia: {
        id: 'oc-final-1',
        ponto_id: 'ponto-final-1',
        data_registro: '2026-10-01T10:00:00Z',
        created_at: '2026-10-01T10:00:00Z',
        descricao: 'Ocorrência encerrada.',
        categoria_principal: 'domestico',
        tipo_residuo: 'domestico',
        volume_estimado: 'pequeno',
        frequencia_percebida: 'unica',
        horario_percebido: 'tarde',
        latitude: -23.48,
        longitude: -46.73,
        status: 'arquivada',
        tipo: 'denuncia',
        prazo_resolucao: '2026-10-31T10:00:00Z',
        prorrogado_em: null,
      },
      ponto: {
        id: 'ponto-final-1',
        endereco: 'Rua Final, 10',
        bairro: 'Pirituba',
        subprefeitura: 'Pirituba/Jaraguá',
        status: 'arquivado',
        quantidade_ocorrencias: 1,
        recorrente: false,
      },
      evidencias_paths: [],
      historico_ponto: [],
      moderacoes: [],
      confirmacoes_distintas_ponto: 1,
      ciclos_anteriores: null,
    } satisfies OcorrenciaDetalheGestao);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/gestao/ocorrencias/oc-final-1']}>
          <Routes>
            <Route path="/gestao/ocorrencias/:id" element={<OcorrenciaDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() =>
      expect(screen.getByText(/não aceita novas ações de moderação/i)).toBeInTheDocument()
    );

    expect(screen.queryByRole('button', { name: /manter em análise/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /invalidar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resolver/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /arquivar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /prorrogar prazo/i })).not.toBeInTheDocument();
  });
});
