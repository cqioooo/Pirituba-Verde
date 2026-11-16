import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AcaoModeracaoDialog } from '../AcaoModeracaoDialog';
import { mockViewportMatchMedia } from '@/test/setup';
import type { ContextoOcorrenciaModeracao } from '@/types';

const { rpcMock, uploadMock, createSignedUrlsMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  uploadMock: vi.fn(),
  createSignedUrlsMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  isSupabaseConfigured: true,
  supabase: {
    rpc: rpcMock,
    storage: {
      from: vi.fn(() => ({
        upload: uploadMock,
        createSignedUrls: createSignedUrlsMock,
      })),
    },
    from: vi.fn(),
  },
}));

const BASE_CONTEXTO: ContextoOcorrenciaModeracao = {
  ocorrenciaId: 'oc-modal-1',
  pontoId: 'ponto-modal-1',
  statusOcorrencia: 'pendente',
  statusPonto: 'em_analise',
  categoria: 'entulho',
  endereco: 'Rua Monte Alegre, 120',
  bairro: 'Pirituba',
  dataRegistro: '2026-11-01T14:00:00Z',
  prazoResolucao: '2026-12-01T14:00:00Z',
  prorrogadoEm: null,
};

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('AcaoModeracaoDialog (KAN-80)', () => {
  beforeEach(() => {
    rpcMock.mockReset();
    uploadMock.mockReset();
    createSignedUrlsMock.mockReset();
    mockViewportMatchMedia(true);
    createSignedUrlsMock.mockResolvedValue({
      data: [{ path: 'cidadao/foto-1.jpg', signedUrl: 'https://signed.local/foto-1.jpg' }],
      error: null,
    });
  });

  it('valida justificativa obrigatória mínima de 10 caracteres antes de enviar', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <AcaoModeracaoDialog
        isOpen
        acao="manter_em_analise"
        contexto={BASE_CONTEXTO}
        onClose={vi.fn()}
      />
    );

    const textarea = screen.getByLabelText(/justificativa da decisão/i);
    expect(document.activeElement).toBe(textarea);

    // Tentativa vazia
    await user.click(screen.getByRole('button', { name: /confirmar análise/i }));
    expect(screen.getByText(/preencha a justificativa/i)).toBeInTheDocument();
    expect(rpcMock).not.toHaveBeenCalled();

    // Tentativa abaixo do mínimo de 10 caracteres
    await user.type(textarea, 'curto');
    await user.click(screen.getByRole('button', { name: /confirmar análise/i }));
    expect(screen.getByText(/pelo menos 10 caracteres/i)).toBeInTheDocument();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('exige foto válida para resolver e bloqueia envio sem arquivo válido', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <AcaoModeracaoDialog
        isOpen
        acao="resolver"
        contexto={{ ...BASE_CONTEXTO, statusOcorrencia: 'em_revisao' }}
        onClose={vi.fn()}
      />
    );

    await user.type(
      screen.getByLabelText(/justificativa da decisão/i),
      'Limpeza executada e área isolada pela equipe.'
    );

    // Sem foto
    await user.click(screen.getByRole('button', { name: /confirmar resolução/i }));
    expect(screen.getByText(/anexe uma foto de resolução/i)).toBeInTheDocument();
    expect(uploadMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();

    // Arquivo inválido (.pdf)
    const userSemFiltroAccept = userEvent.setup({ applyAccept: false });
    const fileInput = screen.getByLabelText(/foto comprobatória da resolução/i) as HTMLInputElement;
    const pdfFile = new File(['%PDF-1.4'], 'laudo.pdf', { type: 'application/pdf' });
    await userSemFiltroAccept.upload(fileInput, pdfFile);
    expect(screen.getByText(/formato de imagem inválido/i)).toBeInTheDocument();

    // Arquivo válido
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

    const jpgFile = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], 'depois.jpg', {
      type: 'image/jpeg',
    });
    await user.upload(fileInput, jpgFile);
    await user.click(screen.getByRole('button', { name: /confirmar resolução/i }));

    await waitFor(() =>
      expect(screen.getByText(/ação registrada com sucesso/i)).toBeInTheDocument()
    );
    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });

  it('exibe avisos de preservação e evidência existente do morador em invalidar/arquivar, e aviso único em prorrogar', async () => {
    const { rerender } = renderWithQuery(
      <AcaoModeracaoDialog
        isOpen
        acao="invalidar"
        contexto={BASE_CONTEXTO}
        evidenciasExistentes={['cidadao/foto-1.jpg']}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/registro permanente e auditável/i)).toBeInTheDocument();
    expect(screen.getByText(/evidência original do morador/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/foto comprobatória/i)).not.toBeInTheDocument();

    rerender(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <AcaoModeracaoDialog
          isOpen
          acao="arquivar"
          contexto={{ ...BASE_CONTEXTO, statusOcorrencia: 'aprovada' }}
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );
    expect(screen.getByText(/registro permanente e auditável/i)).toBeInTheDocument();

    rerender(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <AcaoModeracaoDialog
          isOpen
          acao="prorrogar"
          contexto={BASE_CONTEXTO}
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );
    expect(screen.getByText(/prorrogação única de 30 dias/i)).toBeInTheDocument();
    expect(screen.getByText(/adiciona 30 dias ao prazo/i)).toBeInTheDocument();
  });

  it('mostra estados de carregamento, erro da RPC e sucesso sem expor dados pessoais, fechando com Esc', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    let liberarRpc!: (val: { data: unknown; error: unknown }) => void;
    rpcMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          liberarRpc = resolve;
        })
    );

    renderWithQuery(
      <AcaoModeracaoDialog
        isOpen
        acao="prorrogar"
        contexto={BASE_CONTEXTO}
        onClose={onClose}
      />
    );

    // Alvos de toque >= 44px (`min-h-11`)
    const fecharBotoes = screen.getAllByRole('button', { name: /fechar/i });
    for (const btn of fecharBotoes) {
      expect(btn.className).toMatch(/min-h-11/);
    }

    await user.type(
      screen.getByLabelText(/justificativa da decisão/i),
      'Dependendo de caminhão caçamba para coleta.'
    );
    await user.click(screen.getByRole('button', { name: /confirmar prorrogação/i }));

    await waitFor(() => expect(screen.getByText(/registrando ação/i)).toBeInTheDocument());

    // Enquanto pendente, Esc não fecha
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();

    // Falha da RPC exibe erro inline
    liberarRpc({
      data: null,
      error: { message: 'Prorrogação já foi utilizada nesta ocorrência' },
    });

    await waitFor(() =>
      expect(screen.getByText(/já foi prorrogada/i)).toBeInTheDocument()
    );

    // Agora Esc fecha normalmente
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('adapta para Dialog no desktop e Sheet no viewport mobile de 375px', () => {
    mockViewportMatchMedia(true);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { rerender } = render(
      <QueryClientProvider client={client}>
        <AcaoModeracaoDialog
          isOpen
          acao="manter_em_analise"
          contexto={BASE_CONTEXTO}
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('data-variant', 'dialog');

    mockViewportMatchMedia(false);
    rerender(
      <QueryClientProvider client={client}>
        <AcaoModeracaoDialog
          isOpen
          acao="prorrogar"
          contexto={BASE_CONTEXTO}
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('data-variant', 'sheet');
  });
});
