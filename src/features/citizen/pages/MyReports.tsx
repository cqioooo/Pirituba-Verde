import { Spinner, Badge, Button } from '@/components/ui';
import {
  FileText,
  MapPin,
  Calendar,
  ArrowSquareOut,
  Plus,
  Warning,
  Image,
} from '@phosphor-icons/react';
import { useAuth } from '@/providers/AuthProvider';
import { useOcorrenciasUsuario } from '@/services/queries';
import {
  WASTE_CATEGORY_LABELS,
  OCORRENCIA_STATUS_LABELS,
  POINT_STATUS_LABELS,
  POINT_STATUS_VARIANTS,
} from '@/types';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export function MyReports() {
  const { user } = useAuth();
  const { data: ocorrencias = [], isLoading, error } = useOcorrenciasUsuario(user?.id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-surface-500 font-medium">Buscando contribuições...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center">
          <Warning className="w-8 h-8 text-danger-500" weight="duotone" />
        </div>
        <h2 className="text-lg font-bold text-surface-900">Erro ao carregar denúncias</h2>
        <p className="text-sm text-surface-500 max-w-xs">
          Não foi possível buscar suas denúncias. Verifique sua conexão e tente novamente.
        </p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-20 pt-4 max-w-3xl mx-auto"
    >
      <motion.div variants={itemVariants}>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">
          Minhas denúncias
        </h1>
        <p className="text-sm sm:text-base text-surface-500 mt-1">
          Acompanhe o status e histórico de todas as suas contribuições na região.
        </p>
      </motion.div>

      {ocorrencias.length === 0 ? (
        <motion.div variants={itemVariants}>
          <div
            className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface-50 rounded-[32px] border border-surface-200 border-dashed"
            role="status"
            aria-label="Nenhuma denúncia registrada"
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-5 shadow-sm border border-surface-100">
              <FileText className="w-8 h-8 text-surface-400" weight="duotone" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2 tracking-tight">
              Ainda não há registros
            </h2>
            <p className="text-base text-surface-500 max-w-sm mb-8 leading-relaxed">
              Você ainda não registrou nenhuma denúncia ou confirmação. Ajude a monitorar o descarte
              irregular!
            </p>
            <Link to="/app/nova-denuncia">
              <Button size="md" icon={<Plus className="w-5 h-5" />}>
                Registrar agora
              </Button>
            </Link>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {ocorrencias.map((ocorrencia) => {
            const thumbUrl = ocorrencia.fotos?.[0] ?? null;
            const ponto = ocorrencia.pontos_descarte ?? null;
            const pontoStatus = ponto?.status ?? null;
            const pontoStatusVariant = pontoStatus ? POINT_STATUS_VARIANTS[pontoStatus] : undefined;
            const pontoStatusLabel = pontoStatus ? POINT_STATUS_LABELS[pontoStatus] : null;

            return (
              <motion.div key={ocorrencia.id} variants={itemVariants} whileTap={{ scale: 0.98 }}>
                <article
                  className="p-5 sm:p-6 bg-white rounded-[24px] border border-surface-200 shadow-sm hover:shadow-md transition-shadow"
                  aria-label={`Denúncia em ${ponto?.endereco ?? 'localização registrada'}`}
                >
                  <div className="flex gap-4">
                    {/* Thumbnail da foto */}
                    <div className="shrink-0">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt="Foto da denúncia"
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border border-surface-100"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-surface-100 border border-surface-200 flex items-center justify-center"
                          aria-label="Sem foto"
                        >
                          <Image className="w-7 h-7 text-surface-400" weight="duotone" />
                        </div>
                      )}
                    </div>

                    {/* Conteúdo principal */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Badges de status */}
                      <div className="flex flex-wrap items-center gap-2 grid-cols-2">
                        {pontoStatus && pontoStatusVariant && (
                          <Badge variant={pontoStatusVariant}>{pontoStatusLabel}</Badge>
                        )}
                        <span className="text-[10px] font-bold text-surface-500 bg-surface-100 px-2 py-1 rounded uppercase tracking-wider">
                          {ocorrencia.tipo === 'denuncia' ? 'Denúncia' : 'Confirmação'}
                        </span>
                      </div>

                      {/* Endereço e bairro */}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" weight="fill" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-surface-800 leading-snug truncate">
                            {ponto?.endereco ??
                              `${ocorrencia.latitude?.toFixed(5)}, ${ocorrencia.longitude?.toFixed(5)}`}
                          </p>
                          {ponto?.bairro && (
                            <p className="text-xs text-surface-500 mt-0.5">{ponto.bairro}</p>
                          )}
                        </div>
                      </div>

                      {/* Categoria */}
                      {ocorrencia.categoria_principal && (
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" weight="fill" />
                          <p className="text-sm text-surface-700">
                            <span className="font-semibold text-surface-900">Resíduo: </span>
                            {WASTE_CATEGORY_LABELS[ocorrencia.categoria_principal] ??
                              ocorrencia.categoria_principal}
                          </p>
                        </div>
                      )}

                      {/* Data */}
                      <div className="flex items-center gap-1.5 text-xs font-medium text-surface-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <time dateTime={ocorrencia.data_registro}>
                          {formatDate(ocorrencia.data_registro)}
                        </time>
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  {ocorrencia.descricao && (
                    <div className="mt-4">
                      <p className="text-sm text-surface-600 bg-surface-50/50 p-3.5 rounded-xl border border-surface-100 italic">
                        "{ocorrencia.descricao}"
                      </p>
                    </div>
                  )}

                  {/* Observações de revisão */}
                  {ocorrencia.observacoes_revisao && (
                    <div className="mt-4 p-4 bg-warning-50/80 border border-warning-200 rounded-xl">
                      <p className="text-xs font-bold uppercase tracking-wider text-warning-800 mb-1.5">
                        Resposta da Moderação
                      </p>
                      <p className="text-sm font-medium text-warning-900">
                        {ocorrencia.observacoes_revisao}
                      </p>
                    </div>
                  )}

                  {/* Link para o detalhe */}
                  <div className="mt-5 pt-4 border-t border-surface-100 flex justify-end">
                    <Link
                      to={`/app/denuncia/${ocorrencia.id}`}
                      className="flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                      aria-label="Ver detalhes desta denúncia"
                    >
                      Ver detalhes
                      <ArrowSquareOut className="w-4 h-4" weight="bold" />
                    </Link>
                  </div>
                </article>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
