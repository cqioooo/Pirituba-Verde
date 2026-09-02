import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useDetalheDenuncia } from '@/services/queries';
import { Spinner, Badge, Button } from '@/components/ui';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Image,
  Clock,
  Warning,
  CheckCircle,
  FileText,
  Scales,
  SunHorizon,
  Users,
} from '@phosphor-icons/react';
import {
  POINT_STATUS_LABELS,
  POINT_STATUS_VARIANTS,
  FREQUENCY_LABELS,
  VOLUME_LABELS,
  TIME_LABELS,
} from '@/types';
import type { HistoricoStatusPontoCidadao } from '@/types';
import { motion } from 'framer-motion';

// ── Helpers ──

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function normalizePhotos(fotos: string[] | null, fotoUrl: string | null): string[] {
  if (fotos && fotos.length > 0) return fotos;
  if (fotoUrl) return [fotoUrl];
  return [];
}

// ── Skeleton de carregamento ──

function DenunciaDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto pb-20 pt-4 space-y-6 animate-pulse">
      <div className="h-5 w-32 bg-surface-200 rounded" />
      <div className="bg-white rounded-[24px] border border-surface-200 p-6 space-y-4">
        <div className="flex gap-3">
          <div className="h-6 w-20 bg-surface-200 rounded-full" />
          <div className="h-6 w-16 bg-surface-200 rounded-full" />
        </div>
        <div className="h-5 w-3/4 bg-surface-200 rounded" />
        <div className="h-4 w-1/2 bg-surface-100 rounded" />
        <div className="h-4 w-1/3 bg-surface-100 rounded" />
      </div>
      <div className="bg-white rounded-[24px] border border-surface-200 p-6">
        <div className="h-4 w-24 bg-surface-200 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-square bg-surface-100 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="bg-white rounded-[24px] border border-surface-200 p-6 space-y-4">
        <div className="h-4 w-28 bg-surface-200 rounded" />
        {[1, 2].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-surface-100 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-2/3 bg-surface-100 rounded" />
              <div className="h-3 w-1/2 bg-surface-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Estado: não encontrado / sem acesso ──

function DenunciaNotFound() {
  return (
    <div className="max-w-lg mx-auto py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-5">
        <FileText className="w-8 h-8 text-surface-400" weight="duotone" />
      </div>
      <h1 className="text-xl font-bold text-surface-900 mb-2">Denúncia não encontrada</h1>
      <p className="text-sm text-surface-500 mb-8 leading-relaxed">
        A denúncia solicitada não existe ou você não possui acesso a ela.
      </p>
      <Link to="/app/minhas-denuncias">
        <Button size="sm" variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>
          Voltar para minhas denúncias
        </Button>
      </Link>
    </div>
  );
}

// ── Evento da Timeline ──

function TimelineEvent({
  event,
  isLast,
}: {
  event: HistoricoStatusPontoCidadao;
  isLast: boolean;
}) {
  const statusLabel =
    POINT_STATUS_LABELS[event.status_novo as keyof typeof POINT_STATUS_LABELS] ??
    event.status_novo;
  const variant =
    POINT_STATUS_VARIANTS[event.status_novo as keyof typeof POINT_STATUS_VARIANTS] ?? 'neutral';

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-surface-100 border border-surface-200 flex items-center justify-center shrink-0">
          <CheckCircle className="w-3.5 h-3.5 text-surface-400" weight="fill" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-surface-200 my-1 min-h-[20px]" />}
      </div>
      <div className="pb-4 min-w-0">
        <Badge variant={variant}>{statusLabel}</Badge>
        <p className="text-xs text-surface-400 flex items-center gap-1 mt-1">
          <Clock className="w-3 h-3" />
          {formatDateTime(event.created_at)}
        </p>
        {event.motivo && (
          <p className="text-xs text-surface-500 mt-1.5 italic">{event.motivo}</p>
        )}
      </div>
    </div>
  );
}

// ── Página Principal ──

export function DenunciaDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: denuncia, isLoading, isError } = useDetalheDenuncia(id, user?.id);

  if (isLoading) return <DenunciaDetailSkeleton />;
  if (isError || !denuncia) return <DenunciaNotFound />;

  const ponto = denuncia.pontos_descarte;
  const fotos = normalizePhotos(denuncia.fotos, denuncia.foto_url);
  const pontoStatusLabel = ponto ? (POINT_STATUS_LABELS[ponto.status] ?? ponto.status) : null;
  const pontoStatusVariant = ponto
    ? (POINT_STATUS_VARIANTS[ponto.status] ?? 'neutral')
    : null;

  const tipoResiduo = Array.isArray(denuncia.tipo_residuo)
    ? denuncia.tipo_residuo.join(', ')
    : denuncia.tipo_residuo;

  const hasDetails =
    Boolean(denuncia.descricao) ||
    Boolean(tipoResiduo) ||
    Boolean(denuncia.volume_estimado) ||
    Boolean(denuncia.frequencia_percebida) ||
    Boolean(denuncia.horario_percebido);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="max-w-2xl mx-auto pb-20 pt-4 space-y-5"
    >
      {/* Botão Voltar */}
      <Link
        to="/app/minhas-denuncias"
        className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 transition-colors"
        aria-label="Voltar para minhas denúncias"
      >
        <ArrowLeft className="w-4 h-4" />
        Minhas denúncias
      </Link>

      {/* ── Cabeçalho ── */}
      <section
        className="bg-white rounded-[24px] border border-surface-200 shadow-sm p-5 sm:p-6 space-y-3"
        aria-label="Informações do ponto"
      >
        <div className="flex flex-wrap items-center gap-2">
          {pontoStatusLabel && pontoStatusVariant && (
            <Badge variant={pontoStatusVariant}>{pontoStatusLabel}</Badge>
          )}
          <span className="text-[10px] font-bold text-surface-500 bg-surface-100 px-2 py-1 rounded uppercase tracking-wider">
            Denúncia
          </span>
        </div>

        <div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" weight="fill" />
            <h1 className="text-base font-bold text-surface-900 leading-snug">
              {ponto?.endereco ?? 'Endereço não disponível'}
            </h1>
          </div>
          {(ponto?.bairro || ponto?.subprefeitura) && (
            <p className="text-sm text-surface-500 mt-1 ml-6">
              {[ponto?.bairro, ponto?.subprefeitura].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-surface-400 font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>Registrada em {formatDate(denuncia.data_registro)}</span>
        </div>
      </section>

      {/* ── Fotos ── */}
      <section
        className="bg-white rounded-[24px] border border-surface-200 shadow-sm p-5 sm:p-6"
        aria-label="Fotos da denúncia"
      >
        <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-4">
          Fotos
        </h2>
        {fotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {fotos.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square rounded-2xl overflow-hidden border border-surface-100 hover:opacity-90 transition-opacity"
                aria-label={`Abrir foto ${i + 1}`}
              >
                <img
                  src={url}
                  alt={`Foto ${i + 1} da denúncia`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-3">
              <Image className="w-6 h-6 text-surface-400" weight="duotone" />
            </div>
            <p className="text-sm text-surface-400">Nenhuma foto disponível</p>
          </div>
        )}
      </section>

      {/* ── Informações do Registro ── */}
      <section
        className="bg-white rounded-[24px] border border-surface-200 shadow-sm p-5 sm:p-6"
        aria-label="Informações do registro"
      >
        <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-4">
          Informações do registro
        </h2>
        {hasDetails ? (
          <dl className="space-y-4">
            {denuncia.descricao && (
              <div>
                <dt className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
                  Descrição
                </dt>
                <dd className="text-sm text-surface-700 bg-surface-50 p-3.5 rounded-xl border border-surface-100 italic leading-relaxed">
                  "{denuncia.descricao}"
                </dd>
              </div>
            )}
            {tipoResiduo && (
              <div className="flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" weight="fill" />
                <div>
                  <dt className="text-xs font-semibold text-surface-500">Tipo de resíduo</dt>
                  <dd className="text-sm text-surface-800 font-medium">{tipoResiduo}</dd>
                </div>
              </div>
            )}
            {denuncia.volume_estimado && (
              <div className="flex items-start gap-2.5">
                <Scales className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" weight="fill" />
                <div>
                  <dt className="text-xs font-semibold text-surface-500">Volume estimado</dt>
                  <dd className="text-sm text-surface-800 font-medium">
                    {VOLUME_LABELS[denuncia.volume_estimado] ?? denuncia.volume_estimado}
                  </dd>
                </div>
              </div>
            )}
            {denuncia.frequencia_percebida && (
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" weight="fill" />
                <div>
                  <dt className="text-xs font-semibold text-surface-500">Frequência percebida</dt>
                  <dd className="text-sm text-surface-800 font-medium">
                    {FREQUENCY_LABELS[denuncia.frequencia_percebida] ?? denuncia.frequencia_percebida}
                  </dd>
                </div>
              </div>
            )}
            {denuncia.horario_percebido && (
              <div className="flex items-start gap-2.5">
                <SunHorizon className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" weight="fill" />
                <div>
                  <dt className="text-xs font-semibold text-surface-500">Horário percebido</dt>
                  <dd className="text-sm text-surface-800 font-medium">
                    {TIME_LABELS[denuncia.horario_percebido] ?? denuncia.horario_percebido}
                  </dd>
                </div>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-sm text-surface-400 italic">
            Nenhuma informação adicional foi fornecida no registro.
          </p>
        )}
      </section>

      {/* ── Acompanhamento ── */}
      {ponto && (
        <section
          className="bg-white rounded-[24px] border border-surface-200 shadow-sm p-5 sm:p-6"
          aria-label="Acompanhamento do ponto"
        >
          <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-4">
            Acompanhamento
          </h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary-600" weight="fill" />
              </div>
              <div>
                <p className="text-xl font-bold text-surface-900 leading-none tabular-nums">
                  {ponto.confirmacoes}
                </p>
                <p className="text-xs text-surface-500 mt-0.5">Confirmações</p>
              </div>
            </div>

            {ponto.criticidade != null && ponto.criticidade > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-warning-50 flex items-center justify-center">
                  <Warning className="w-4 h-4 text-warning-500" weight="fill" />
                </div>
                <div>
                  <p className="text-xl font-bold text-surface-900 leading-none tabular-nums">
                    {ponto.criticidade.toFixed(1)}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">Índice*</p>
                </div>
              </div>
            )}
          </div>
          {ponto.criticidade != null && ponto.criticidade > 0 && (
            <p className="text-[10px] text-surface-400 mt-4 leading-relaxed">
              * Índice calculado automaticamente. Pode não refletir a situação atual.
            </p>
          )}
        </section>
      )}

      {/* ── Linha do Tempo ── */}
      <section
        className="bg-white rounded-[24px] border border-surface-200 shadow-sm p-5 sm:p-6"
        aria-label="Histórico de status"
      >
        <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-5">
          Histórico de status
        </h2>
        {denuncia.historico.length > 0 ? (
          <div>
            {denuncia.historico.map((event, i) => (
              <TimelineEvent
                key={event.id}
                event={event}
                isLast={i === denuncia.historico.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="w-8 h-8 text-surface-300 mb-3" weight="duotone" />
            <p className="text-sm text-surface-400">
              Ainda não há atualizações de status para esta denúncia.
            </p>
          </div>
        )}
      </section>
    </motion.div>
  );
}
