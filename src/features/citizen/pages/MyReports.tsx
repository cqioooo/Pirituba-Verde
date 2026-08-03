import { Spinner, Badge, Button } from '@/components/ui';
import { FileText, MapPin, Calendar, ArrowSquareOut, Plus } from '@phosphor-icons/react';
import { useAuth } from '@/providers/AuthProvider';
import { useOcorrenciasUsuario } from '@/services/queries';
import { WASTE_CATEGORY_LABELS, OCORRENCIA_STATUS_LABELS } from '@/types';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pendente': return 'warning';
    case 'em_revisao': return 'warning';
    case 'aprovada': return 'success';
    case 'rejeitada': return 'danger';
    default: return 'neutral';
  }
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
  const { data: ocorrencias = [], isLoading } = useOcorrenciasUsuario(user?.id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-surface-500 font-medium">Buscando contribuições...</p>
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
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">Minhas denúncias</h1>
        <p className="text-sm sm:text-base text-surface-500 mt-1">
          Acompanhe o status e histórico de todas as suas contribuições na região.
        </p>
      </motion.div>

      {ocorrencias.length === 0 ? (
        <motion.div variants={itemVariants}>
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface-50 rounded-[32px] border border-surface-200 border-dashed">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-5 shadow-sm border border-surface-100">
              <FileText className="w-8 h-8 text-surface-400" weight="duotone" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2 tracking-tight">
              Ainda não há registros
            </h2>
            <p className="text-base text-surface-500 max-w-sm mb-8 leading-relaxed">
              Você ainda não registrou nenhuma denúncia ou confirmação. Ajude a monitorar o descarte irregular!
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
          {ocorrencias.map(ocorrencia => (
            <motion.div key={ocorrencia.id} variants={itemVariants} whileTap={{ scale: 0.98 }}>
              <div className="p-5 sm:p-6 bg-white rounded-[24px] border border-surface-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getStatusColor(ocorrencia.status)}>
                      {OCORRENCIA_STATUS_LABELS[ocorrencia.status]}
                    </Badge>
                    <span className="text-[10px] font-bold text-surface-500 bg-surface-100 px-2 py-1 rounded uppercase tracking-wider">
                      {ocorrencia.tipo === 'denuncia' ? 'Denúncia' : 'Confirmação'}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-surface-400 flex items-center gap-1.5 shrink-0 bg-surface-50 px-2.5 py-1 rounded-full">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(ocorrencia.created_at)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-50 flex items-center justify-center shrink-0 mt-0.5 text-surface-500">
                      <MapPin className="w-4 h-4" weight="fill" />
                    </div>
                    <p className="text-sm font-medium text-surface-800 leading-snug pt-1.5">
                      {ocorrencia.pontos_descarte?.endereco || `${ocorrencia.latitude.toFixed(5)}, ${ocorrencia.longitude.toFixed(5)}`}
                    </p>
                  </div>
                  
                  {ocorrencia.categoria_principal && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-50 flex items-center justify-center shrink-0 text-surface-500">
                        <FileText className="w-4 h-4" weight="fill" />
                      </div>
                      <p className="text-sm text-surface-700 pt-1.5">
                        <span className="font-semibold text-surface-900">Resíduo: </span>
                        {WASTE_CATEGORY_LABELS[ocorrencia.categoria_principal] || ocorrencia.categoria_principal}
                      </p>
                    </div>
                  )}
                  
                  {ocorrencia.descricao && (
                    <div className="pl-11 pr-2">
                      <p className="text-sm text-surface-600 bg-surface-50/50 p-3.5 rounded-xl border border-surface-100 italic">
                        "{ocorrencia.descricao}"
                      </p>
                    </div>
                  )}

                  {ocorrencia.observacoes_revisao && (
                    <div className="mt-4 p-4 bg-warning-50/80 border border-warning-200 rounded-xl">
                      <p className="text-xs font-bold uppercase tracking-wider text-warning-800 mb-1.5">Resposta da Moderação</p>
                      <p className="text-sm font-medium text-warning-900">{ocorrencia.observacoes_revisao}</p>
                    </div>
                  )}
                </div>

                {ocorrencia.ponto_id && (
                  <div className="mt-5 pt-4 border-t border-surface-100 flex justify-end">
                    <Link 
                      to={`/app/mapa?pointId=${ocorrencia.ponto_id}`}
                      className="flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Acessar no mapa
                      <ArrowSquareOut className="w-4 h-4" weight="bold" />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
