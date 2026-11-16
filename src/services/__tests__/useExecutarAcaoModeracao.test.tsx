import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErroAcaoModeracao } from '@/lib/moderacao';

const { rpcMock, uploadMock, removeMock, fromStorageMock } = vi.hoisted(() => {
  const rpc = vi.fn();
  const upload = vi.fn();
  const remove = vi.fn();
  const fromStorage = vi.fn(() => ({
    upload,
    remove,
    createSignedUrls: vi.fn(),
  }));
  return { rpcMock: rpc, uploadMock: upload, removeMock: remove, fromStorageMock: fromStorage };
});

vi.mock('@/integrations/supabase/client', () => ({
  isSupabaseConfigured: true,
  supabase: {
    rpc: rpcMock,
    storage: {
      from: fromStorageMock,
    },
    from: vi.fn(),
  },
}));

import { listarEvidenciasOrfas } from '@/services/supabase.service';
import { MODERACAO_QUERY_KEYS, useExecutarAcaoModeracao } from '@/services/queries';

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useExecutarAcaoModeracao (KAN-81 & KAN-84)', () => {
  beforeEach(() => {
    rpcMock.mockReset();
    uploadMock.mockReset();
    removeMock.mockReset();
    fromStorageMock.mockReset();
    fromStorageMock.mockImplementation(() => ({
      upload: uploadMock,
      remove: removeMock,
      createSignedUrls: vi.fn(),
    }));
    window.localStorage.clear();
  });

  it('executa ação com sucesso, invalida caches esperados e não usa atualização otimista', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const cachedDetail = { ocorrencia: { status: 'pendente' } };
    queryClient.setQueryData(MODERACAO_QUERY_KEYS.detalheOcorrencia('oc-1'), cachedDetail);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    let resolverRpc!: (val: { data: unknown; error: unknown }) => void;
    rpcMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolverRpc = resolve;
        })
    );

    const { result } = renderHook(() => useExecutarAcaoModeracao(), {
      wrapper: createWrapper(queryClient),
    });

    let promise!: Promise<unknown>;
    act(() => {
      promise = result.current.mutateAsync({
        ocorrenciaId: 'oc-1',
        pontoId: 'ponto-1',
        acao: 'manter_em_analise',
        justificativa: '  Necessita vistoria em campo pela equipe técnica.  ',
      });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    // Sem atualização otimista durante voo da RPC
    expect(queryClient.getQueryData(MODERACAO_QUERY_KEYS.detalheOcorrencia('oc-1'))).toEqual(
      cachedDetail
    );
    expect(invalidateSpy).not.toHaveBeenCalled();

    expect(rpcMock).toHaveBeenCalledWith('executar_acao_moderacao', {
      p_ocorrencia_id: 'oc-1',
      p_acao: 'manter_em_analise',
      p_justificativa: 'Necessita vistoria em campo pela equipe técnica.',
      p_evidencia_path: null,
    });

    await act(async () => {
      resolverRpc({
        data: {
          sucesso: true,
          acao: 'manter_em_analise',
          status_ocorrencia: 'em_revisao',
          status_ponto: 'em_analise',
        },
        error: null,
      });
      await promise;
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: MODERACAO_QUERY_KEYS.filaModeracao,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: MODERACAO_QUERY_KEYS.detalheOcorrencia('oc-1'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: MODERACAO_QUERY_KEYS.detalheOcorrenciaPorPonto('ponto-1'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: MODERACAO_QUERY_KEYS.historicoPonto('ponto-1'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: MODERACAO_QUERY_KEYS.resumoDashboard,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: MODERACAO_QUERY_KEYS.pontosGestor,
    });
  });

  it('em resolver faz upload privado antes da RPC e passa caminho no padrão {id}/{ts}-{uuid}.{ext}', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    uploadMock.mockResolvedValueOnce({ data: { path: 'ok' }, error: null });
    rpcMock.mockResolvedValueOnce({
      data: {
        sucesso: true,
        acao: 'resolver',
        status_ocorrencia: 'aprovada',
        status_ponto: 'resolvido',
      },
      error: null,
    });

    const { result } = renderHook(() => useExecutarAcaoModeracao(), {
      wrapper: createWrapper(queryClient),
    });

    const foto = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], 'limpeza.jpg', {
      type: 'image/jpeg',
    });

    await act(async () => {
      await result.current.mutateAsync({
        ocorrenciaId: '11111111-1111-4111-8111-111111111111',
        pontoId: 'ponto-1',
        acao: 'resolver',
        justificativa: 'Área limpa e desobstruída conforme comprovação.',
        fotoResolucao: foto,
      });
    });

    expect(fromStorageMock).toHaveBeenCalledWith('fotos-resolucao');
    expect(uploadMock).toHaveBeenCalledTimes(1);
    const [uploadedPath] = uploadMock.mock.calls[0] as [string, File, Record<string, unknown>];
    expect(uploadedPath).toMatch(
      /^11111111-1111-4111-8111-111111111111\/\d+-[0-9a-f-]+\.jpg$/
    );

    expect(rpcMock).toHaveBeenCalledWith('executar_acao_moderacao', {
      p_ocorrencia_id: '11111111-1111-4111-8111-111111111111',
      p_acao: 'resolver',
      p_justificativa: 'Área limpa e desobstruída conforme comprovação.',
      p_evidencia_path: uploadedPath,
    });
  });

  it('aborta resolver se o upload falhar sem chamar a RPC', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    uploadMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Storage network failure' },
    });

    const { result } = renderHook(() => useExecutarAcaoModeracao(), {
      wrapper: createWrapper(queryClient),
    });

    const foto = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], 'limpeza.jpg', {
      type: 'image/jpeg',
    });

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.mutateAsync({
          ocorrenciaId: 'oc-upload-err',
          acao: 'resolver',
          justificativa: 'Tentativa de resolução com falha de rede no upload.',
          fotoResolucao: foto,
        });
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeInstanceOf(ErroAcaoModeracao);
    expect((caughtError as ErroAcaoModeracao).codigo).toBe('upload_falhou');
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('registra caminho órfão sem executar DELETE se a RPC falhar após upload', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    uploadMock.mockResolvedValueOnce({ data: { path: 'ok' }, error: null });
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Transição inválida para o estado atual' },
    });

    const { result } = renderHook(() => useExecutarAcaoModeracao(), {
      wrapper: createWrapper(queryClient),
    });

    const foto = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], 'limpeza.jpg', {
      type: 'image/jpeg',
    });

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.mutateAsync({
          ocorrenciaId: 'oc-orfao',
          acao: 'resolver',
          justificativa: 'Resolução após concorrência no banco.',
          fotoResolucao: foto,
        });
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeInstanceOf(ErroAcaoModeracao);
    const err = caughtError as ErroAcaoModeracao;
    expect(err.codigo).toBe('transicao_invalida');
    expect(err.evidenciaOrfaPath).toMatch(/^oc-orfao\/\d+-[0-9a-f-]+\.jpg$/);

    // Nunca executa DELETE no storage
    expect(removeMock).not.toHaveBeenCalled();

    const orfas = listarEvidenciasOrfas();
    expect(orfas).toHaveLength(1);
    expect(orfas[0]?.path).toBe(err.evidenciaOrfaPath);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it.each([
    [
      'transicao_invalida',
      { message: 'Transição inválida de aprovada para resolver' },
      'manter_em_analise' as const,
      /ação não disponível/i,
    ],
    [
      'justificativa_obrigatoria',
      { message: 'Justificativa é obrigatória' },
      'manter_em_analise' as const,
      /preencha a justificativa/i,
    ],
    [
      'foto_obrigatoria',
      { message: 'Foto é obrigatória para concluir resolução' },
      'resolver' as const,
      /anexe a foto/i,
    ],
    [
      'sem_permissao',
      { message: 'Apenas gestão pode executar ações de moderação', code: '42501' },
      'arquivar' as const,
      /permissão insuficiente/i,
    ],
    [
      'prorrogacao_utilizada',
      { message: 'Prorrogação já foi utilizada para esta ocorrência' },
      'prorrogar' as const,
      /já foi prorrogada/i,
    ],
    [
      'invalidacao_fora_analise',
      { message: 'Invalidação só é permitida com ponto em_analise' },
      'invalidar' as const,
      /ainda não confirmados/i,
    ],
  ])(
    'mapeia erro %s da RPC para mensagem em português',
    async (codigoEsperado, rpcError, acao, regexMensagem) => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      rpcMock.mockResolvedValueOnce({ data: null, error: rpcError });

      const { result } = renderHook(() => useExecutarAcaoModeracao(), {
        wrapper: createWrapper(queryClient),
      });

      let caughtError: unknown;
      await act(async () => {
        try {
          await result.current.mutateAsync({
            ocorrenciaId: 'oc-err',
            acao,
            justificativa: 'Justificativa suficientemente longa para chegar à RPC.',
          });
        } catch (err) {
          caughtError = err;
        }
      });

      expect(caughtError).toBeInstanceOf(ErroAcaoModeracao);
      const err = caughtError as ErroAcaoModeracao;
      expect(err.codigo).toBe(codigoEsperado);
      expect(err.message).toMatch(regexMensagem);
    }
  );

  it('impede duplo envio simultâneo no mesmo hook e trata colisão de concorrência entre sessões', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    // Cenário A: dois disparos simultâneos no mesmo hook enquanto o primeiro está em voo
    let liberarPrimeira!: (val: { data: unknown; error: unknown }) => void;
    rpcMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          liberarPrimeira = resolve;
        })
    );

    const { result } = renderHook(() => useExecutarAcaoModeracao(), {
      wrapper: createWrapper(queryClient),
    });

    let p1!: Promise<unknown>;
    let p2Error: unknown;

    act(() => {
      p1 = result.current.mutateAsync({
        ocorrenciaId: 'oc-conc',
        acao: 'prorrogar',
        justificativa: 'Aguardando operação de limpeza programada.',
      });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      try {
        await result.current.mutateAsync({
          ocorrenciaId: 'oc-conc',
          acao: 'prorrogar',
          justificativa: 'Segundo clique simultâneo não deve atingir a RPC.',
        });
      } catch (err) {
        p2Error = err;
      }
    });

    expect(p2Error).toBeInstanceOf(ErroAcaoModeracao);
    expect(rpcMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      liberarPrimeira({
        data: {
          sucesso: true,
          acao: 'prorrogar',
          status_ocorrencia: 'em_revisao',
          status_ponto: 'em_analise',
          prazo_resolucao: '2026-12-30T12:00:00Z',
        },
        error: null,
      });
      await p1;
    });

    // Cenário B: dois moderadores simultâneos na mesma ocorrência (bloqueio FOR UPDATE no banco)
    rpcMock
      .mockResolvedValueOnce({
        data: {
          sucesso: true,
          acao: 'invalidar',
          status_ocorrencia: 'rejeitada',
          status_ponto: 'arquivado',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Transição inválida para ocorrência em estado rejeitada' },
      });

    const hookA = renderHook(() => useExecutarAcaoModeracao(), {
      wrapper: createWrapper(queryClient),
    });
    const hookB = renderHook(() => useExecutarAcaoModeracao(), {
      wrapper: createWrapper(queryClient),
    });

    const outcomes = await Promise.allSettled([
      hookA.result.current.mutateAsync({
        ocorrenciaId: 'oc-race',
        acao: 'invalidar',
        justificativa: 'Moderador A invalidando ocorrência duplicada.',
      }),
      hookB.result.current.mutateAsync({
        ocorrenciaId: 'oc-race',
        acao: 'manter_em_analise',
        justificativa: 'Moderador B tentando alterar simultaneamente.',
      }),
    ]);

    expect(outcomes[0]?.status).toBe('fulfilled');
    expect(outcomes[1]?.status).toBe('rejected');
    if (outcomes[1]?.status === 'rejected') {
      expect((outcomes[1].reason as ErroAcaoModeracao).codigo).toBe('transicao_invalida');
    }
  });
});
