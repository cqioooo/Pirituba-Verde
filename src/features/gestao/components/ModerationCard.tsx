import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarBlank,
  CaretDown,
  Check,
  Clock,
  Compass,
  Copy,
  Info,
  MapPin,
  Prohibit,
  Repeat,
  Timer,
  WarningCircle,
} from '@phosphor-icons/react';
import { Badge, Button, Card } from '@/components/ui';
import { SignedEvidenceThumbnail } from '@/components/shared/SignedEvidenceThumbnail';
import {
  ACAO_MODERACAO_META,
  formatarDataCurta,
  formatarTempoDecorrido,
  obterAcoesDisponiveis,
} from '@/lib/moderacao';
import { calcularResumoPrazo } from '@/lib/prazoAlerta';
import { cn } from '@/lib/utils';
import { useConfiguracoes } from '@/services/queries';
import {
  FREQUENCY_LABELS,
  POINT_STATUS_LABELS,
  POINT_STATUS_VARIANTS,
  TIME_LABELS,
  VOLUME_LABELS,
  WASTE_CATEGORY_LABELS,
} from '@/types';
import type {
  AcaoModeracao,
  ContextoOcorrenciaModeracao,
  ItemFilaModeracao,
  ResultadoAcaoModeracao,
} from '@/types';
import { AcaoModeracaoDialog } from './AcaoModeracaoDialog';

interface ModerationCardProps {
  item: ItemFilaModeracao;
  onActionSuccess?: (resultado: ResultadoAcaoModeracao) => void;
}

interface SinalMeta {
  key: 'reincidencia' | 'duplicata' | 'faixa_cinzenta' | 'limite_diario';
  label: string;
  explicacao: string;
  ativo: boolean;
}

const VOLUME_RESUMO: Record<string, string> = {
  pequeno: 'Volume pequeno',
  medio: 'Volume médio',
  grande: 'Volume grande',
  muito_grande: 'Volume muito grande',
};

const FREQUENCIA_EXTRA: Record<string, string> = {
  unica: 'Ocorrência única',
  ...FREQUENCY_LABELS,
};

function formatarTituloResiduo(item: ItemFilaModeracao): string {
  const tokens: string[] = [];
  if (item.categoria_principal) tokens.push(item.categoria_principal);
  if (Array.isArray(item.tipo_residuo)) {
    tokens.push(...item.tipo_residuo);
  } else if (item.tipo_residuo) {
    tokens.push(item.tipo_residuo);
  }

  const labelsUnicos: string[] = [];
  const vistos = new Set<string>();
  for (const token of tokens) {
    const limpo = token.trim();
    if (!limpo) continue;
    const label = WASTE_CATEGORY_LABELS[limpo] ?? limpo;
    const chave = label.toLowerCase();
    if (!vistos.has(chave)) {
      vistos.add(chave);
      labelsUnicos.push(label);
    }
  }

  return labelsUnicos.length > 0 ? labelsUnicos.join(', ') : 'Resíduo não informado';
}

function formatarContextoRegiao(bairro: string | null, subprefeitura: string | null): string | null {
  const partes: string[] = [];
  const vistos = new Set<string>();
  for (const valor of [bairro, subprefeitura]) {
    const limpo = valor?.trim();
    if (!limpo) continue;
    const chave = limpo.toLowerCase();
    if (!vistos.has(chave)) {
      vistos.add(chave);
      partes.push(limpo);
    }
  }
  return partes.length > 0 ? partes.join(' · ') : null;
}

function SinalIcon({ signalKey }: { signalKey: SinalMeta['key'] }) {
  switch (signalKey) {
    case 'reincidencia':
      return <Repeat className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
    case 'duplicata':
      return <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
    case 'faixa_cinzenta':
      return <Compass className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
    case 'limite_diario':
      return <Timer className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
  }
}

export function ModerationCard({ item, onActionSuccess }: ModerationCardProps) {
  const [acaoSelecionada, setAcaoSelecionada] = useState<AcaoModeracao | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [mostrarAjudaSinais, setMostrarAjudaSinais] = useState(false);
  const [descricaoExpandida, setDescricaoExpandida] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const menuContainerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const menuId = useId();
  const sinaisHelpId = useId();

  const { data: configs } = useConfiguracoes();

  const categoria = item.categoria_principal;
  const statusPonto = item.ponto_status;
  const dataRegistroRaw = item.data_registro || item.created_at;
  const dataRegistroFormatada = formatarDataCurta(dataRegistroRaw);
  const tempoDecorrido = formatarTempoDecorrido(dataRegistroRaw);
  const prorrogadoFormatado = formatarDataCurta(item.prorrogado_em);
  const idCurto = item.id.split('-')[0] || item.id.slice(0, 8);

  const tituloResiduo = formatarTituloResiduo(item);
  const enderecoTexto =
    item.endereco?.trim() ||
    (item.ponto_id ? 'Endereço não informado' : 'Localização a confirmar');
  const regiaoTexto = formatarContextoRegiao(item.bairro, item.subprefeitura);

  const fotoUrls = item.fotos?.length
    ? item.fotos
    : item.foto_url
      ? [item.foto_url]
      : [];

  const resumoPrazo = calcularResumoPrazo({
    prazoResolucao: item.prazo_resolucao,
    statusOcorrencia: item.status,
    config: {
      diasAlerta: configs?.alerta_prazo_dias ?? [],
      cicloDias: configs?.prazo_ciclo_dias ?? null,
    },
  });

  const candidatosSinais: SinalMeta[] = [
    {
      key: 'reincidencia',
      label: 'Reincidência',
      explicacao: 'Nova ocorrência vinculada a um ponto já conhecido no território.',
      ativo: item.sinal_reincidencia,
    },
    {
      key: 'duplicata',
      label: 'Possível duplicata',
      explicacao:
        'Há registro ativo a até 50 m. Verifique fotos e endereço antes de decidir.',
      ativo: item.sinal_duplicata,
    },
    {
      key: 'faixa_cinzenta',
      label: 'Faixa cinzenta',
      explicacao:
        'Localização entre 50 m e 100 m de ponto ativo; confirme se é o mesmo ponto.',
      ativo: item.sinal_faixa_cinzenta,
    },
    {
      key: 'limite_diario',
      label: 'Limite diário',
      explicacao: 'Envio próximo ao limite diário configurado para prevenção de spam.',
      ativo: item.sinal_limite_diario,
    },
  ];
  const sinaisAtivos = candidatosSinais.filter((s) => s.ativo);

  const acoesDisponiveis = obterAcoesDisponiveis({
    statusOcorrencia: item.status,
    statusPonto,
    prorrogadoEm: item.prorrogado_em,
  });
  const podeManterEmAnalise = acoesDisponiveis.includes('manter_em_analise');
  const acoesMenu: AcaoModeracao[] = (
    ['prorrogar', 'aprovar', 'invalidar'] as const
  ).filter((acao) => acoesDisponiveis.includes(acao));

  useEffect(() => {
    if (!menuAberto) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setMenuAberto(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuAberto(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuAberto]);

  const handleCopyId = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(item.id);
      }
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  };

  const metadataSecundaria: string[] = [];
  if (item.volume_estimado) {
    metadataSecundaria.push(
      VOLUME_RESUMO[item.volume_estimado] ??
        VOLUME_LABELS[item.volume_estimado] ??
        item.volume_estimado
    );
  }
  if (item.frequencia_percebida) {
    const freqLabel =
      FREQUENCIA_EXTRA[item.frequencia_percebida] ?? item.frequencia_percebida;
    metadataSecundaria.push(`Frequência: ${freqLabel}`);
  }
  if (item.horario_percebido) {
    const horarioLabel =
      TIME_LABELS[item.horario_percebido] ?? item.horario_percebido;
    metadataSecundaria.push(`Horário: ${horarioLabel}`);
  }
  if (item.confirmacoes !== null) {
    metadataSecundaria.push(
      item.confirmacoes === 1
        ? '1 confirmação no ponto'
        : `${item.confirmacoes} confirmações no ponto`
    );
  }

  const descricaoLimpa = item.descricao?.trim() || null;
  const descricaoEhLonga = (descricaoLimpa?.length ?? 0) > 150;

  const contextoModal: ContextoOcorrenciaModeracao = {
    ocorrenciaId: item.id,
    pontoId: item.ponto_id,
    statusOcorrencia: item.status,
    statusPonto,
    categoria,
    endereco: item.endereco,
    bairro: item.bairro,
    dataRegistro: dataRegistroRaw,
    prazoResolucao: item.prazo_resolucao,
    prorrogadoEm: item.prorrogado_em,
  };

  return (
    <>
      <article aria-labelledby={titleId}>
        <Card
          padding="none"
          className="rounded-2xl border border-surface-200 bg-white shadow-none transition-colors hover:border-surface-300"
        >
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:gap-5 lg:p-5">
            {/* NÍVEL 3 (Mídia): Thumbnail equilibrada ou placeholder compacto */}
            <div
              className={cn(
                'w-full shrink-0 overflow-hidden rounded-xl border border-surface-200 bg-surface-100 lg:w-48',
                fotoUrls.length > 0 ? 'h-44 lg:h-40' : 'h-24 lg:h-32'
              )}
            >
              <SignedEvidenceThumbnail
                contextId={item.id}
                path={fotoUrls[0]}
                allPaths={fotoUrls}
                alt={`Evidência fotográfica da ocorrência de ${tituloResiduo}`}
                className="h-full w-full object-cover"
                fallbackClassName="h-full w-full"
                enableZoom
                showStatusLabel
                zoomSubtitle={`${tituloResiduo} · ${enderecoTexto}`}
              />
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              {/* NÍVEL 1: Identificação e localização */}
              <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <h2
                    id={titleId}
                    className="font-heading text-lg font-semibold leading-snug text-surface-900 sm:text-xl"
                  >
                    {tituloResiduo}
                  </h2>

                  <p className="flex items-start gap-1.5 text-[15px] font-medium text-surface-800">
                    <MapPin
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary-700"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 break-words">
                      {enderecoTexto}
                      {regiaoTexto && (
                        <span className="font-normal text-surface-600">
                          {' '}
                          · {regiaoTexto}
                        </span>
                      )}
                    </span>
                  </p>
                </div>

                {/* ID curto como metadado terciário com cópia acessível */}
                <div className="flex shrink-0 items-center gap-1 self-start">
                  <button
                    type="button"
                    onClick={() => void handleCopyId()}
                    aria-label={`Copiar código completo da ocorrência ${idCurto}`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-2.5 py-1 font-mono text-xs text-surface-700 hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <span>#{idCurto}</span>
                    {copiado ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-success-700" aria-hidden="true" />
                        <span className="font-sans font-medium text-success-700">
                          Copiado
                        </span>
                      </>
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-surface-500" aria-hidden="true" />
                    )}
                  </button>
                  <span className="sr-only" role="status" aria-live="polite">
                    {copiado ? `Código ${idCurto} copiado para a área de transferência.` : ''}
                  </span>
                </div>
              </header>

              {/* NÍVEL 2: Estados separados, sinais de atenção e tempo/prazo */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">
                    Ocorrência: Pendente de análise
                  </Badge>

                  {statusPonto ? (
                    <Badge variant={POINT_STATUS_VARIANTS[statusPonto]}>
                      Ponto: {POINT_STATUS_LABELS[statusPonto] ?? statusPonto}
                    </Badge>
                  ) : (
                    <Badge variant="neutral">Ponto: Sem vínculo ainda</Badge>
                  )}
                </div>

                {sinaisAtivos.length > 0 && (
                  <div className="rounded-lg border border-warning-500/25 bg-warning-50/50 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div
                        className="flex flex-wrap items-center gap-1.5"
                        aria-label="Sinais de atenção para triagem"
                      >
                        {sinaisAtivos.map((sinal) => (
                          <span
                            key={sinal.key}
                            title={sinal.explicacao}
                            className="inline-flex items-center gap-1 rounded-md border border-warning-500/30 bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700"
                          >
                            <SinalIcon signalKey={sinal.key} />
                            <span>{sinal.label}</span>
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        aria-expanded={mostrarAjudaSinais}
                        aria-controls={sinaisHelpId}
                        onClick={() => setMostrarAjudaSinais((v) => !v)}
                        className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-warning-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{mostrarAjudaSinais ? 'Ocultar significado' : 'Entender sinais'}</span>
                      </button>
                    </div>

                    {mostrarAjudaSinais && (
                      <ul
                        id={sinaisHelpId}
                        className="mt-2 space-y-1 border-t border-warning-500/20 pt-2 text-xs text-surface-700"
                      >
                        {sinaisAtivos.map((sinal) => (
                          <li key={sinal.key}>
                            <strong className="font-semibold text-surface-900">
                              {sinal.label}:
                            </strong>{' '}
                            {sinal.explicacao}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1 text-sm text-surface-700 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
                  <p className="inline-flex items-center gap-1.5">
                    <CalendarBlank
                      className="h-4 w-4 shrink-0 text-surface-600"
                      aria-hidden="true"
                    />
                    <span>
                      {dataRegistroFormatada
                        ? `Registrada em ${dataRegistroFormatada}${
                            tempoDecorrido ? ` (${tempoDecorrido})` : ''
                          }`
                        : 'Data de registro indisponível'}
                    </span>
                  </p>

                  <p
                    className={cn(
                      'inline-flex flex-wrap items-center gap-1.5',
                      resumoPrazo.status === 'vencido'
                        ? 'font-medium text-danger-700'
                        : resumoPrazo.alerta?.nivel === 'critico'
                          ? 'font-medium text-danger-700'
                          : resumoPrazo.status === 'hoje' || resumoPrazo.alerta
                            ? 'font-medium text-warning-700'
                            : 'text-surface-700'
                    )}
                  >
                    {resumoPrazo.status === 'vencido' ? (
                      <WarningCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      {resumoPrazo.status === 'ausente'
                        ? 'Prazo de resolução: não informado'
                        : `Prazo: ${resumoPrazo.textoPrincipal} · ${resumoPrazo.dataFormatada}`}
                    </span>
                    {resumoPrazo.alerta && resumoPrazo.status !== 'vencido' && (
                      <span className="rounded bg-warning-50 px-1.5 py-0.5 text-xs font-semibold text-warning-700 border border-warning-500/30">
                        Alerta {resumoPrazo.alerta.diaAlerta ?? resumoPrazo.alerta.diaCiclo}º dia
                      </span>
                    )}
                  </p>

                  {prorrogadoFormatado && (
                    <p className="text-xs text-surface-600">
                      Prorrogada em {prorrogadoFormatado} (prorrogação única utilizada)
                    </p>
                  )}
                </div>
              </div>

              {/* NÍVEL 3 (Contexto textual): Descrição resumida + metadados operacionais */}
              <div className="space-y-2 border-t border-surface-100 pt-3">
                {descricaoLimpa ? (
                  <div>
                    <p
                      className={cn(
                        'text-[15px] leading-relaxed text-surface-800',
                        !descricaoExpandida && 'line-clamp-2'
                      )}
                    >
                      {descricaoLimpa}
                    </p>
                    {descricaoEhLonga && (
                      <button
                        type="button"
                        aria-expanded={descricaoExpandida}
                        onClick={() => setDescricaoExpandida((prev) => !prev)}
                        className="mt-1 inline-flex min-h-8 items-center text-xs font-medium text-primary-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        {descricaoExpandida
                          ? 'Mostrar menos da descrição'
                          : 'Ler descrição completa'}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm italic text-surface-600">
                    Descrição não informada pela pessoa denunciante.
                  </p>
                )}

                {metadataSecundaria.length > 0 && (
                  <p className="text-sm text-surface-600">
                    {metadataSecundaria.join(' · ')}
                  </p>
                )}
              </div>

              {/* NÍVEL 4: Ações com foco em análise consciente */}
              <div className="flex flex-col gap-2.5 border-t border-surface-100 pt-3.5 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  to={`/gestao/ocorrencias/${item.id}`}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary-600/50 bg-primary-700 px-4 py-2.5 text-sm font-medium text-surface-50 shadow-sm transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:w-auto"
                >
                  <span>Analisar ocorrência</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>

                {podeManterEmAnalise && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setAcaoSelecionada('manter_em_analise')}
                    className="min-h-11 w-full sm:w-auto"
                  >
                    {ACAO_MODERACAO_META.manter_em_analise.label}
                  </Button>
                )}

                {(acoesMenu.length > 0 || Boolean(item.prorrogado_em)) && (
                  <div ref={menuContainerRef} className="relative w-full sm:w-auto">
                    <Button
                      ref={menuButtonRef}
                      type="button"
                      variant="ghost"
                      aria-haspopup="menu"
                      aria-expanded={menuAberto}
                      aria-controls={menuId}
                      onClick={() => setMenuAberto((aberto) => !aberto)}
                      className="min-h-11 w-full justify-between border border-surface-200 bg-white sm:w-auto sm:justify-center"
                    >
                      <span>Mais ações</span>
                      <CaretDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          menuAberto && 'rotate-180'
                        )}
                        aria-hidden="true"
                      />
                    </Button>

                    {menuAberto && (
                      <div
                        id={menuId}
                        role="menu"
                        aria-label={`Mais ações para ocorrência ${idCurto}`}
                        className="mt-1.5 w-full rounded-xl border border-surface-200 bg-white p-1.5 shadow-lg sm:absolute sm:right-0 sm:z-30 sm:min-w-64"
                      >
                        {acoesMenu.map((acao) => {
                          const meta = ACAO_MODERACAO_META[acao];
                          const isDestructive = acao === 'invalidar';
                          const acaoTitulo =
                            acao === 'aprovar'
                              ? 'Aprovar ocorrência'
                              : acao === 'invalidar'
                                ? 'Invalidar ocorrência'
                                : meta.label;

                          return (
                            <button
                              key={acao}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setMenuAberto(false);
                                setAcaoSelecionada(acao);
                              }}
                              className={cn(
                                'flex min-h-11 w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                                isDestructive
                                  ? 'text-danger-700 hover:bg-danger-50'
                                  : 'text-surface-800 hover:bg-surface-100'
                              )}
                            >
                              {isDestructive && (
                                <Prohibit
                                  className="mt-0.5 h-4 w-4 shrink-0"
                                  aria-hidden="true"
                                />
                              )}
                              <div className="min-w-0">
                                <span className="block font-medium">{acaoTitulo}</span>
                                <span className="block text-xs text-surface-600">
                                  {acao === 'prorrogar'
                                    ? 'Adiciona 30 dias ao prazo vigente'
                                    : acao === 'aprovar'
                                      ? 'Confirma ponto como novo'
                                      : 'Rejeita e arquiva ponto não confirmado'}
                                </span>
                              </div>
                            </button>
                          );
                        })}

                        {item.prorrogado_em && !acoesMenu.includes('prorrogar') && (
                          <div
                            role="menuitem"
                            aria-disabled="true"
                            className="flex min-h-11 items-center rounded-lg px-3 py-2 text-xs text-surface-600 opacity-75"
                          >
                            Prorrogação única já utilizada
                            {prorrogadoFormatado ? ` (${prorrogadoFormatado})` : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </article>

      <AcaoModeracaoDialog
        isOpen={acaoSelecionada !== null}
        acao={acaoSelecionada}
        contexto={contextoModal}
        evidenciasExistentes={fotoUrls}
        onClose={() => setAcaoSelecionada(null)}
        onSuccess={(resultado) => onActionSuccess?.(resultado)}
      />
    </>
  );
}
