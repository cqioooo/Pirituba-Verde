import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ItemFilaModeracao, StatusOcorrencia, StatusPonto } from '@/types';

const { rpcMock, fromMock, serviceMocks } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  fromMock: vi.fn(),
  serviceMocks: {
    fetchConfiguracoes: vi.fn(),
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
    from: fromMock,
    auth: { signOut: vi.fn() },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        createSignedUrls: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
  },
}));

vi.mock('@/services/supabase.service', async () => {
  const actual = await vi.importActual<typeof import('@/services/supabase.service')>(
    '@/services/supabase.service'
  );
  return {
    ...actual,
    fetchConfiguracoes: serviceMocks.fetchConfiguracoes,
    fetchEvidenciasAssinadas: serviceMocks.fetchEvidenciasAssinadas,
    executarAcaoModeracao: serviceMocks.executarAcaoModeracao,
    uploadFotoResolucao: serviceMocks.uploadFotoResolucao,
    registrarEvidenciaOrfa: serviceMocks.registrarEvidenciaOrfa,
  };
});

import { GestaoSidebar } from '@/components/layout/GestaoSidebar';
import { ModerationPage } from '../../pages/ModerationPage';
import { fetchModeracoesPendentes } from '@/services/supabase.service';

function makeFilaItem(overrides: Partial<ItemFilaModeracao> = {}): ItemFilaModeracao {
  return {
    id: overrides.id ?? 'oc-padrao-1',
    data_registro: overrides.data_registro ?? '2026-11-15T10:00:00Z',
    created_at: overrides.created_at ?? '2026-11-15T10:00:00Z',
    status: overrides.status ?? 'pendente',
    descricao: overrides.descricao ?? 'Descarte em via pública.',
    tipo_residuo: overrides.tipo_residuo ?? ['entulho'],
    volume_estimado: overrides.volume_estimado ?? 'medio',
    frequencia_percebida: overrides.frequencia_percebida ?? 'unica',
    horario_percebido: overrides.horario_percebido ?? 'manha',
    foto_url: overrides.foto_url !== undefined ? overrides.foto_url : null,
    fotos: overrides.fotos !== undefined ? overrides.fotos : [],
    prazo_resolucao: overrides.prazo_resolucao ?? '2026-12-15T10:00:00Z',
    prorrogado_em: overrides.prorrogado_em !== undefined ? overrides.prorrogado_em : null,
    categoria_principal: overrides.categoria_principal ?? 'entulho',
    ponto_id: overrides.ponto_id !== undefined ? overrides.ponto_id : 'ponto-1',
    endereco: overrides.endereco ?? 'Rua Alfa, 100',
    bairro: overrides.bairro ?? 'Pirituba',
    subprefeitura: overrides.subprefeitura ?? 'Pirituba/Jaraguá',
    ponto_status: overrides.ponto_status !== undefined ? overrides.ponto_status : 'em_analise',
    confirmacoes: overrides.confirmacoes !== undefined ? overrides.confirmacoes : 1,
    sinal_duplicata: overrides.sinal_duplicata ?? false,
    sinal_faixa_cinzenta: overrides.sinal_faixa_cinzenta ?? false,
    sinal_reincidencia: overrides.sinal_reincidencia ?? false,
    sinal_limite_diario: overrides.sinal_limite_diario ?? false,
  };
}

function renderFila() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/gestao/moderacao']}>
        <div className="flex">
          <GestaoSidebar />
          <main className="flex-1">
            <ModerationPage />
          </main>
        </div>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Fila de Moderação (KAN-76 / F4.1) — casos obrigatórios', () => {
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

  it('consulta fallback direta em `ocorrencias` filtra apenas `status = pendente`, preserva itens sem sinal, calcula sinais espaciais e omite PII', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function public.listar_fila_moderacao' },
    });

    const eqSpy = vi.fn();
    const orderSpy = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'oc-sem-sinal',
          ponto_id: 'p-1',
          data_registro: '2026-11-15T08:00:00Z',
          created_at: '2026-11-15T08:00:00Z',
          status: 'pendente',
          descricao: 'Sem sinal algum.',
          tipo_residuo: ['entulho'],
          volume_estimado: 'pequeno',
          frequencia_percebida: 'unica',
          horario_percebido: 'manha',
          foto_url: null,
          fotos: [],
          prazo_resolucao: '2026-12-15T08:00:00Z',
          prorrogado_em: null,
          categoria_principal: 'entulho',
          latitude: -23.48,
          longitude: -46.73,
          pontos_descarte: {
            id: 'p-1',
            endereco: 'Rua Sem Sinal, 1',
            bairro: 'Pirituba',
            subprefeitura: 'Pirituba/Jaraguá',
            status: 'em_analise',
            categoria_principal: 'entulho',
            confirmacoes: 1,
            recorrente: false,
            quantidade_ocorrencias: 1,
            latitude: -23.48,
            longitude: -46.73,
          },
          moderacao_ocorrencias: [],
        },
        {
          id: 'oc-faixa',
          ponto_id: 'p-2',
          data_registro: '2026-11-15T09:00:00Z',
          created_at: '2026-11-15T09:00:00Z',
          status: 'pendente',
          descricao: 'Faixa cinzenta 75m.',
          tipo_residuo: ['moveis'],
          volume_estimado: 'grande',
          frequencia_percebida: 'unica',
          horario_percebido: 'tarde',
          foto_url: null,
          fotos: ['uid/foto.jpg'],
          prazo_resolucao: '2026-12-15T09:00:00Z',
          prorrogado_em: null,
          categoria_principal: 'moveis',
          latitude: -23.5,
          longitude: -46.75,
          pontos_descarte: {
            id: 'p-2',
            endereco: 'Rua Faixa Cinzenta, 75',
            bairro: 'Pirituba',
            subprefeitura: 'Pirituba/Jaraguá',
            status: 'em_analise',
            categoria_principal: 'moveis',
            confirmacoes: 1,
            recorrente: false,
            quantidade_ocorrencias: 1,
            latitude: -23.5,
            longitude: -46.75,
          },
          moderacao_ocorrencias: [],
        },
      ],
      error: null,
    });

    const selectOcorrencias = vi.fn((cols: string) => {
      expect(cols).not.toMatch(/registrado_por|email|cpf|telefone|nome/i);
      return {
        eq: (col: string, val: string) => {
          eqSpy(col, val);
          return { order: orderSpy };
        },
      };
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'ocorrencias') {
        return { select: selectOcorrencias };
      }
      if (table === 'pontos_descarte') {
        return {
          select: () =>
            Promise.resolve({
              data: [
                // ~75m ao norte de -23.5, -46.75 (0.000675 deg lat)
                { id: 'p-vizinho-75m', latitude: -23.499325, longitude: -46.75, status: 'novo' },
              ],
              error: null,
            }),
        };
      }
      throw new Error(`Tabela inesperada: ${table}`);
    });

    const resultado = await fetchModeracoesPendentes();

    expect(eqSpy).toHaveBeenCalledTimes(1);
    expect(eqSpy).toHaveBeenCalledWith('status', 'pendente');
    expect(resultado.map(item => item.id)).toEqual(['oc-faixa', 'oc-sem-sinal']);
    expect(resultado[0]?.sinal_faixa_cinzenta).toBe(true);
    expect(resultado[0]?.sinal_duplicata).toBe(false);
    expect(resultado[1]?.sinal_faixa_cinzenta).toBe(false);
    expect(resultado[1]?.sinal_duplicata).toBe(false);
  });

  it('bloqueia acesso se a RPC retornar erro de permissão (sem bypass para perfil não-gestão)', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { code: '42501', message: 'Apenas gestão pode consultar a fila de moderação' },
    });

    await expect(fetchModeracoesPendentes()).rejects.toMatchObject({ code: '42501' });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('casos 1 a 5 e 10: exibe ocorrências sem sinal, com duplicata, faixa cinzenta, sem foto e com foto com total exato no cabeçalho', async () => {
    const filaMock: ItemFilaModeracao[] = [
      makeFilaItem({
        id: 'oc-caso-2-duplicata',
        descricao: 'Ocorrência com sinal de possível duplicata.',
        endereco: 'Rua Duplicata, 50',
        sinal_duplicata: true,
        foto_url: null,
        fotos: [],
      }),
      makeFilaItem({
        id: 'oc-caso-3-faixa',
        descricao: 'Ocorrência em faixa cinzenta.',
        endereco: 'Rua Cinzenta, 75',
        sinal_faixa_cinzenta: true,
        foto_url: null,
        fotos: [],
      }),
      makeFilaItem({
        id: 'oc-caso-1-limpa',
        descricao: 'Ocorrência nova sem sinal de inconsistência.',
        endereco: 'Rua Limpa, 10',
        foto_url: null,
        fotos: [],
      }),
      makeFilaItem({
        id: 'oc-caso-4-sem-foto',
        descricao: 'Ocorrência nova sem foto anexada.',
        endereco: 'Rua Sem Foto, 20',
        foto_url: null,
        fotos: [],
      }),
      makeFilaItem({
        id: 'oc-caso-5-com-foto',
        descricao: 'Ocorrência nova com foto anexada.',
        endereco: 'Rua Com Foto, 30',
        fotos: ['cidadao/evidencia-1.jpg'],
      }),
    ];

    rpcMock.mockResolvedValue({ data: filaMock, error: null });

    const { container } = renderFila();

    await waitFor(() => {
      expect(screen.getByText(/Rua Limpa, 10/i)).toBeInTheDocument();
    });

    // Casos 1, 4 e 5 sem ocultar itens sem sinal ou sem/com foto
    expect(screen.getByText(/Ocorrência nova sem sinal de inconsistência\./i)).toBeInTheDocument();
    expect(screen.getByText(/Ocorrência nova sem foto anexada\./i)).toBeInTheDocument();
    expect(screen.getByText(/Ocorrência nova com foto anexada\./i)).toBeInTheDocument();

    // Casos 2 e 3 com suas badges específicas
    expect(screen.getByText('Possível duplicata')).toBeInTheDocument();
    expect(screen.getByText('Faixa cinzenta')).toBeInTheDocument();

    // Caso 10: total exibido no cabeçalho e na barra lateral corresponde a todas as 5 pendentes
    expect(screen.getByTestId('fila-total-contador')).toHaveTextContent('5 ocorrências pendentes');
    expect(screen.getByRole('link', { name: /Moderação\s*5/i })).toBeInTheDocument();

    expect(container.textContent ?? '').not.toMatch(/registrado_por|cpf|telefone|@gmail|@hotmail/i);
  });

  it('casos 6 e 9: prorrogar mantém na fila (pendente); manter_em_analise remove da fila (em_revisao)', async () => {
    const user = userEvent.setup();

    let estadoAtual: StatusOcorrencia = 'pendente';
    let prorrogadoAtual: string | null = null;

    rpcMock.mockImplementation(async () => ({
      data:
        estadoAtual === 'pendente'
          ? [
              makeFilaItem({
                id: 'oc-transicoes-1',
                status: estadoAtual,
                ponto_status: 'em_analise',
                prorrogado_em: prorrogadoAtual,
                descricao: 'Ocorrência para validar transições da fila.',
                endereco: 'Rua das Transições, 200',
              }),
            ]
          : [],
      error: null,
    }));

    renderFila();

    await waitFor(() => {
      expect(screen.getByTestId('fila-total-contador')).toHaveTextContent('1 ocorrência pendente');
    });

    // Caso 9: Prorrogar mantém a ocorrência pendente e na fila
    serviceMocks.executarAcaoModeracao.mockImplementationOnce(async () => {
      prorrogadoAtual = '2026-11-15T12:00:00Z';
      return {
        sucesso: true,
        acao: 'prorrogar',
        status_ocorrencia: 'pendente',
        status_ponto: 'em_analise',
        prazo_resolucao: '2027-01-14T10:00:00Z',
      };
    });

    await user.click(screen.getByRole('button', { name: /mais ações/i }));
    await user.click(screen.getByRole('menuitem', { name: /prorrogar prazo/i }));
    await user.type(
      screen.getByLabelText(/justificativa da decisão/i),
      'Aguardando equipe de fiscalização em campo.'
    );
    await user.click(screen.getByRole('button', { name: /confirmar prorrogação/i }));
    await waitFor(() =>
      expect(within(screen.getByRole('dialog')).getByText(/prazo prorrogado em 30 dias/i)).toBeInTheDocument()
    );
    await user.click(within(screen.getByRole('dialog')).getAllByRole('button', { name: /^fechar$/i })[0]!);

    await waitFor(() => {
      expect(screen.getByTestId('fila-total-contador')).toHaveTextContent('1 ocorrência pendente');
      expect(screen.getByText(/Rua das Transições, 200/i)).toBeInTheDocument();
    });

    // Caso 6: Manter em análise remove da fila (status -> em_revisao)
    serviceMocks.executarAcaoModeracao.mockImplementationOnce(async () => {
      estadoAtual = 'em_revisao';
      return {
        sucesso: true,
        acao: 'manter_em_analise',
        status_ocorrencia: 'em_revisao',
        status_ponto: 'em_analise',
      };
    });

    await user.click(screen.getByRole('button', { name: /manter em análise/i }));
    await user.type(
      screen.getByLabelText(/justificativa da decisão/i),
      'Encaminhada para revisão técnica aprofundada.'
    );
    await user.click(screen.getByRole('button', { name: /confirmar análise/i }));
    await waitFor(() =>
      expect(screen.getByText(/ocorrência movida para em revisão/i)).toBeInTheDocument()
    );

    await waitFor(() => {
      expect(estadoAtual).toBe('em_revisao');
      expect(screen.getByTestId('fila-total-contador')).toHaveTextContent('0 ocorrências pendentes');
      expect(screen.getByText(/Fila Vazia!/i)).toBeInTheDocument();
    });
  });

  it('caso 7: aprovar ocorrência pendente remove da fila e passa para aprovada', async () => {
    const user = userEvent.setup();
    let estadoAtual: StatusOcorrencia = 'pendente';

    rpcMock.mockImplementation(async () => ({
      data:
        estadoAtual === 'pendente'
          ? [
              makeFilaItem({
                id: 'oc-aprovar-1',
                status: estadoAtual,
                ponto_status: 'em_analise',
                descricao: 'Ocorrência pendente para aprovação direta.',
                endereco: 'Rua Aprovada, 300',
              }),
            ]
          : [],
      error: null,
    }));

    serviceMocks.executarAcaoModeracao.mockImplementationOnce(async () => {
      estadoAtual = 'aprovada';
      return {
        sucesso: true,
        acao: 'aprovar',
        status_ocorrencia: 'aprovada',
        status_ponto: 'novo',
      };
    });

    renderFila();

    await waitFor(() => {
      expect(screen.getByText(/Rua Aprovada, 300/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /mais ações/i }));
    await user.click(screen.getByRole('menuitem', { name: /aprovar ocorrência/i }));
    await user.type(
      screen.getByLabelText(/justificativa da decisão/i),
      'Evidências confirmam descarte irregular no local.'
    );
    await user.click(screen.getByRole('button', { name: /confirmar aprovação/i }));
    await waitFor(() =>
      expect(screen.getByText(/ocorrência aprovada e ponto marcado como novo/i)).toBeInTheDocument()
    );

    await waitFor(() => {
      expect(estadoAtual).toBe('aprovada');
      expect(screen.getByTestId('fila-total-contador')).toHaveTextContent('0 ocorrências pendentes');
      expect(screen.getByText(/Fila Vazia!/i)).toBeInTheDocument();
    });
  });

  it('caso 8: invalidar ocorrência pendente vinculada a ponto em_analise remove da fila e arquiva o ponto', async () => {
    const user = userEvent.setup();
    let estadoAtual: StatusOcorrencia = 'pendente';
    let pontoStatusAtual: StatusPonto = 'em_analise';

    rpcMock.mockImplementation(async () => ({
      data:
        estadoAtual === 'pendente'
          ? [
              makeFilaItem({
                id: 'oc-invalidar-1',
                status: estadoAtual,
                ponto_status: pontoStatusAtual,
                descricao: 'Ocorrência improcedente para invalidação.',
                endereco: 'Rua Invalida, 404',
              }),
            ]
          : [],
      error: null,
    }));

    serviceMocks.executarAcaoModeracao.mockImplementationOnce(async () => {
      estadoAtual = 'rejeitada';
      pontoStatusAtual = 'arquivado';
      return {
        sucesso: true,
        acao: 'invalidar',
        status_ocorrencia: 'rejeitada',
        status_ponto: 'arquivado',
      };
    });

    renderFila();

    await waitFor(() => {
      expect(screen.getByText(/Rua Invalida, 404/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /mais ações/i }));
    await user.click(screen.getByRole('menuitem', { name: /invalidar ocorrência/i }));
    await user.type(
      screen.getByLabelText(/justificativa da decisão/i),
      'Foto não corresponde a descarte irregular.'
    );
    await user.click(screen.getByRole('button', { name: /confirmar invalidação/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/ocorrência marcada como rejeitada e ponto alterado para arquivado/i)
      ).toBeInTheDocument()
    );

    await waitFor(() => {
      expect(estadoAtual).toBe('rejeitada');
      expect(pontoStatusAtual).toBe('arquivado');
      expect(screen.getByTestId('fila-total-contador')).toHaveTextContent('0 ocorrências pendentes');
      expect(screen.getByText(/Fila Vazia!/i)).toBeInTheDocument();
    });
  });

  it('exibe datas pt-BR corretas, mantém pendentes sem sinais visíveis, filtra só manualmente e distingue sem foto de erro de foto', async () => {
    const user = userEvent.setup();
    const itens = [
      makeFilaItem({
        id: 'oc-com-foto-1',
        data_registro: '2026-11-12T14:20:00Z',
        prazo_resolucao: null,
        foto_url: 'oc-1/foto.jpg',
        fotos: ['oc-1/foto.jpg'],
        endereco: 'Rua da Foto, 10',
        ponto_status: 'em_confirmacao',
        sinal_faixa_cinzenta: true,
      }),
      makeFilaItem({
        id: 'oc-sem-foto-2',
        data_registro: '2026-11-01',
        prazo_resolucao: '2026-12-01',
        foto_url: null,
        fotos: [],
        endereco: null,
        ponto_id: null,
        ponto_status: null,
        descricao: 'Ocorrência sem foto e sem sinais para triagem.',
        sinal_faixa_cinzenta: false,
      }),
      makeFilaItem({
        id: 'oc-erro-foto-3',
        data_registro: 'data-corrompida',
        prazo_resolucao: null,
        foto_url: 'oc-3/expirada.jpg',
        fotos: ['oc-3/expirada.jpg'],
        endereco: 'Rua Falha Foto, 30',
        ponto_status: 'novo',
        sinal_duplicata: false,
      }),
    ];

    rpcMock.mockResolvedValue({ data: itens, error: null });
    serviceMocks.fetchEvidenciasAssinadas.mockImplementation(async (paths: string[]) => {
      if (paths[0] === 'oc-1/foto.jpg') {
        return [
          {
            path: 'oc-1/foto.jpg',
            bucket: 'fotos-ocorrencias',
            signed_url: 'https://example.com/foto.jpg',
            disponivel: true,
          },
        ];
      }
      if (paths[0] === 'oc-3/expirada.jpg') {
        return [
          {
            path: 'oc-3/expirada.jpg',
            bucket: 'fotos-ocorrencias',
            signed_url: null,
            disponivel: false,
          },
        ];
      }
      return [];
    });

    renderFila();

    await waitFor(() => {
      expect(screen.getByTestId('fila-total-contador')).toHaveTextContent('3 ocorrências pendentes');
    });

    // Datas pt-BR válidas (zero distorção tipo 20/26/1115) e fallback seguro
    expect(screen.getByText(/Registrada em 12\/11\/2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Registrada em 01\/11\/2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Data de registro indisponível/i)).toBeInTheDocument();
    expect(screen.queryByText(/20\/26\/1115/)).not.toBeInTheDocument();

    // Separação clara entre status do ponto e sem foto vs erro ao carregar
    expect(screen.getByText(/Ponto: Em confirmação/i)).toBeInTheDocument();
    expect(screen.getByText(/Sem foto disponível/i)).toBeInTheDocument();
    expect(await screen.findByText(/Não foi possível carregar a foto/i)).toBeInTheDocument();
    expect(screen.getByText(/Ocorrência sem foto e sem sinais para triagem\./i)).toBeInTheDocument();

    // Ordenação alternativa mantém todos os itens na fila
    await user.selectOptions(screen.getByLabelText(/ordenação ativa/i), 'antigas');
    expect(screen.getByText(/Rua Falha Foto, 30/i)).toBeInTheDocument();

    // Filtro opcional inicia desligado; ao ligar preserva total pendente no cabeçalho
    const filtroBtn = screen.getByRole('button', { name: /somente com sinais de atenção \(1\)/i });
    expect(filtroBtn).toHaveAttribute('aria-pressed', 'false');
    await user.click(filtroBtn);
    expect(filtroBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('fila-total-contador')).toHaveTextContent('3 ocorrências pendentes');
    expect(screen.queryByText(/Rua Falha Foto, 30/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /mostrar todas as pendentes/i }));
    expect(screen.getByText(/Rua Falha Foto, 30/i)).toBeInTheDocument();

    // Teclado (Esc) fecha "Mais ações" e retorna foco; "Entender sinais" expande significado; zoom abre modal
    const maisAcoesBotoes = screen.getAllByRole('button', { name: /mais ações/i });
    await user.click(maisAcoesBotoes[0]!);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(maisAcoesBotoes[0]).toHaveFocus();

    await user.click(screen.getByRole('button', { name: /entender sinais/i }));
    expect(screen.getByText(/Localização entre 50 m e 100 m de ponto ativo/i)).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: /ampliar/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Evidência fotográfica/i)).toBeInTheDocument();
  });
});
