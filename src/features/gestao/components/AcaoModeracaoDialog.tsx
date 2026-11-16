import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { CheckCircle, Clock, Image, Info, Warning, X } from '@phosphor-icons/react';
import { Alert, Badge, Button, ResponsiveDialog, Textarea } from '@/components/ui';
import { SignedEvidenceThumbnail } from '@/components/shared/SignedEvidenceThumbnail';
import {
  TIPOS_FOTO_RESOLUCAO_ACEITOS,
  validarArquivoFotoResolucao,
} from '@/lib/imagemResolucao';
import {
  ACAO_MODERACAO_META,
  MIN_JUSTIFICATIVA_CHARS,
  formatarDataCurta,
  formatarMensagemSucessoAcao,
  validarJustificativa,
} from '@/lib/moderacao';
import { useExecutarAcaoModeracao } from '@/services/queries';
import {
  OCORRENCIA_STATUS_LABELS,
  OCORRENCIA_STATUS_VARIANTS,
  POINT_STATUS_LABELS,
  POINT_STATUS_VARIANTS,
  WASTE_CATEGORY_LABELS,
} from '@/types';
import type {
  AcaoModeracao,
  ContextoOcorrenciaModeracao,
  EtapaAcaoModeracao,
  ResultadoAcaoModeracao,
} from '@/types';

interface AcaoModeracaoDialogProps {
  isOpen: boolean;
  acao: AcaoModeracao | null;
  contexto: ContextoOcorrenciaModeracao;
  /** Evidências já registradas pelo morador (exibidas em `invalidar`, sem novo upload). */
  evidenciasExistentes?: string[];
  onClose: () => void;
  onSuccess?: (resultado: ResultadoAcaoModeracao) => void;
}

const ETAPA_LOADING_LABEL: Record<EtapaAcaoModeracao, string> = {
  preparando_foto: 'Preparando foto...',
  enviando_foto: 'Enviando foto...',
  registrando_acao: 'Registrando ação...',
};

function formatarTamanhoArquivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function AcaoModeracaoDialogContent({
  acao,
  contexto,
  evidenciasExistentes = [],
  onClose,
  onSuccess,
}: Omit<AcaoModeracaoDialogProps, 'isOpen' | 'acao'> & { acao: AcaoModeracao }) {
  const meta = ACAO_MODERACAO_META[acao];
  const justificativaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formId = useId();
  const fotoInputId = useId();
  const fotoErrorId = useId();

  const { mutateAsync, isPending, error, etapa } = useExecutarAcaoModeracao();

  const [justificativa, setJustificativa] = useState('');
  const [justificativaErro, setJustificativaErro] = useState<string | null>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoErro, setFotoErro] = useState<string | null>(null);
  const [resultadoSucesso, setResultadoSucesso] = useState<ResultadoAcaoModeracao | null>(null);

  const previewUrl = useMemo(() => {
    if (!foto || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      return null;
    }
    return URL.createObjectURL(foto);
  }, [foto]);

  useEffect(() => {
    return () => {
      if (previewUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const categoriaLabel = contexto.categoria
    ? WASTE_CATEGORY_LABELS[contexto.categoria] ?? contexto.categoria
    : 'Categoria não informada';
  const localLabel =
    [contexto.endereco, contexto.bairro].filter(Boolean).join(' — ') ||
    'Localização registrada no mapa';
  const dataRegistroLabel = formatarDataCurta(contexto.dataRegistro) ?? 'Data indisponível';
  const prazoLabel = formatarDataCurta(contexto.prazoResolucao);
  const statusOcorrenciaAtual = resultadoSucesso?.status_ocorrencia ?? contexto.statusOcorrencia;
  const statusPontoAtual =
    resultadoSucesso?.status_ponto !== undefined
      ? resultadoSucesso.status_ponto
      : contexto.statusPonto;

  const loadingLabel = etapa ? ETAPA_LOADING_LABEL[etapa] : 'Registrando ação...';
  const confirmButtonVariant =
    meta.buttonVariant === 'outline' ? 'primary' : meta.buttonVariant;

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFoto(null);
      setFotoErro(null);
      return;
    }

    const erroValidacao = validarArquivoFotoResolucao(selectedFile);
    if (erroValidacao) {
      setFoto(null);
      setFotoErro(erroValidacao);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setFoto(selectedFile);
    setFotoErro(null);
  };

  const handleClearFoto = () => {
    setFoto(null);
    setFotoErro(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending || resultadoSucesso) return;

    const erroJust = validarJustificativa(justificativa);
    const erroFoto = meta.exigeFoto ? validarArquivoFotoResolucao(foto) : null;

    if (erroJust || erroFoto) {
      setJustificativaErro(erroJust);
      setFotoErro(erroFoto);
      if (erroJust) {
        justificativaRef.current?.focus();
      } else if (erroFoto) {
        fileInputRef.current?.focus();
      }
      return;
    }

    setJustificativaErro(null);
    setFotoErro(null);

    try {
      const resultado = await mutateAsync({
        ocorrenciaId: contexto.ocorrenciaId,
        pontoId: contexto.pontoId,
        acao,
        justificativa: justificativa.trim(),
        fotoResolucao: meta.exigeFoto ? foto : undefined,
      });
      setResultadoSucesso(resultado);
      onSuccess?.(resultado);
    } catch {
      // Erro já exposto pelo estado `error` do hook para renderização inline.
    }
  };

  const footer = resultadoSucesso ? (
    <Button
      type="button"
      variant="primary"
      onClick={onClose}
      className="min-h-11 w-full sm:w-auto"
    >
      Fechar
    </Button>
  ) : (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={onClose}
        disabled={isPending}
        className="min-h-11 w-full sm:w-auto"
      >
        Fechar
      </Button>
      <Button
        type="submit"
        form={formId}
        variant={confirmButtonVariant}
        loading={isPending}
        disabled={isPending}
        className="min-h-11 w-full sm:w-auto"
      >
        {isPending ? loadingLabel : meta.confirmarLabel}
      </Button>
    </>
  );

  return (
    <ResponsiveDialog
      isOpen
      onClose={onClose}
      title={meta.titulo}
      subtitle={meta.descricao}
      closeDisabled={isPending}
      initialFocusRef={justificativaRef}
      footer={footer}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Resumo não-PII da ocorrência */}
        <section
          aria-label="Resumo da ocorrência"
          className="rounded-xl border border-surface-200 bg-surface-50 p-3.5 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-surface-900">{categoriaLabel}</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={OCORRENCIA_STATUS_VARIANTS[statusOcorrenciaAtual]}>
                {OCORRENCIA_STATUS_LABELS[statusOcorrenciaAtual]}
              </Badge>
              {statusPontoAtual && (
                <Badge variant={POINT_STATUS_VARIANTS[statusPontoAtual]}>
                  Ponto: {POINT_STATUS_LABELS[statusPontoAtual]}
                </Badge>
              )}
            </div>
          </div>
          <p className="mt-1.5 text-surface-600">{localLabel}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-surface-500">
            <span>Registro: {dataRegistroLabel}</span>
            {prazoLabel && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Prazo atual: {prazoLabel}
              </span>
            )}
            {contexto.prorrogadoEm && <span>Prorrogação já utilizada</span>}
          </div>
        </section>

        {meta.avisoPreservacao && (
          <Alert variant="info" title="Registro permanente e auditável">
            <p>
              Esta ação é gravada no histórico de moderação e nenhuma ocorrência, evidência ou
              registro anterior é apagado do sistema.
            </p>
          </Alert>
        )}

        {meta.avisoProrrogacao && (
          <Alert variant="warning" title="Prorrogação única de 30 dias">
            <p>
              A prorrogação pode ser aplicada apenas uma vez por ocorrência e adiciona 30 dias ao
              prazo de resolução vigente.
            </p>
          </Alert>
        )}

        {resultadoSucesso ? (
          <Alert variant="success" title="Ação registrada com sucesso">
            <div className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
              <p>{formatarMensagemSucessoAcao(resultadoSucesso)}</p>
            </div>
          </Alert>
        ) : (
          <form id={formId} onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <Alert variant="error" title="Não foi possível concluir a ação">
                <p>{error.message}</p>
                {error.evidenciaOrfaPath && (
                  <p className="mt-1.5 text-xs text-surface-600">
                    A foto foi enviada ao armazenamento privado, mas a moderação falhou. O caminho
                    pendente foi registrado para saneamento posterior.
                  </p>
                )}
              </Alert>
            )}

            <Textarea
              ref={justificativaRef}
              id={`justificativa-${formId}`}
              label="Justificativa da decisão"
              required
              minLength={MIN_JUSTIFICATIVA_CHARS}
              rows={4}
              value={justificativa}
              onChange={(event) => {
                setJustificativa(event.target.value);
                if (justificativaErro) {
                  setJustificativaErro(validarJustificativa(event.target.value));
                }
              }}
              disabled={isPending}
              placeholder="Descreva os motivos técnicos ou operacionais desta decisão (mínimo de 10 caracteres)..."
              hint={`Obrigatória para auditoria interna (mínimo ${MIN_JUSTIFICATIVA_CHARS} caracteres; atual: ${justificativa.trim().length}).`}
              error={justificativaErro ?? undefined}
            />

            {acao === 'invalidar' && (
              <div className="space-y-2 rounded-xl border border-surface-200 bg-white p-3.5">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-info-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-surface-900">
                      Evidência original do morador
                    </p>
                    <p className="text-xs text-surface-600">
                      A invalidação utiliza as evidências já registradas na ocorrência; não é
                      necessário enviar nova foto.
                    </p>
                  </div>
                </div>
                {evidenciasExistentes.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {evidenciasExistentes.slice(0, 3).map((path) => (
                      <div
                        key={path}
                        className="aspect-square overflow-hidden rounded-lg border border-surface-200 bg-surface-100"
                      >
                        <SignedEvidenceThumbnail
                          contextId={contexto.ocorrenciaId}
                          path={path}
                          alt="Evidência já enviada pelo morador"
                          className="h-full w-full object-cover"
                          fallbackClassName="h-full w-full"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-surface-500">
                    Nenhuma fotografia foi anexada no registro original.
                  </p>
                )}
              </div>
            )}

            {meta.exigeFoto && (
              <div className="space-y-2 rounded-xl border border-surface-200 bg-white p-3.5">
                <label
                  htmlFor={fotoInputId}
                  className="block text-sm font-medium text-surface-800"
                >
                  Foto comprobatória da resolução{' '}
                  <span className="text-danger-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <p className="text-xs leading-relaxed text-surface-600">
                  Obrigatória em formato JPEG, PNG ou WebP (até 5 MB). A imagem é otimizada no
                  navegador com remoção de metadados EXIF de localização e salva em área privada.
                </p>

                <input
                  ref={fileInputRef}
                  id={fotoInputId}
                  type="file"
                  accept={TIPOS_FOTO_RESOLUCAO_ACEITOS.join(',')}
                  onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                  disabled={isPending}
                  aria-invalid={Boolean(fotoErro)}
                  aria-describedby={fotoErro ? fotoErrorId : undefined}
                  className="block min-h-11 w-full cursor-pointer rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-700 file:mr-3 file:min-h-8 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary-700 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
                />

                {foto && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-surface-200 bg-surface-50 p-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Pré-visualização da foto de resolução"
                          className="h-12 w-12 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-surface-200 text-surface-600">
                          <Image className="h-5 w-5" aria-hidden="true" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-surface-900">
                          {foto.name}
                        </p>
                        <p className="text-xs text-surface-500">
                          {formatarTamanhoArquivo(foto.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearFoto}
                      disabled={isPending}
                      aria-label="Remover foto selecionada"
                      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-200 hover:text-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {fotoErro && (
                  <p
                    id={fotoErrorId}
                    role="alert"
                    className="flex items-start gap-1.5 text-sm text-danger-600"
                  >
                    <Warning className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{fotoErro}</span>
                  </p>
                )}
              </div>
            )}
          </form>
        )}
      </div>
    </ResponsiveDialog>
  );
}

/** Modal responsivo (`Dialog` no desktop, `Sheet` no mobile) para ações da KAN-80. */
export function AcaoModeracaoDialog({
  isOpen,
  acao,
  ...rest
}: AcaoModeracaoDialogProps) {
  if (!isOpen || !acao) return null;

  return (
    <AcaoModeracaoDialogContent
      key={`${rest.contexto.ocorrenciaId}:${acao}`}
      acao={acao}
      {...rest}
    />
  );
}
