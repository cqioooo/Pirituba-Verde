import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Badge, Spinner } from '@/components/ui';
import { MapTrifold, FileText, Bell, ArrowRight, Plus, Users, ChartLineUp } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { usePontosAutenticados, useOcorrenciasUsuario } from '@/services/queries';

const quickLinks = [
  {
    to: '/app/minhas-denuncias',
    icon: FileText,
    label: 'Minhas denúncias',
    description: 'Acompanhe o status das suas contribuições.',
  },
  {
    to: '/app/notificacoes',
    icon: Bell,
    label: 'Notificações',
    description: 'Receba alertas sobre áreas que você acompanha.',
  },
];

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
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || 'Cidadão';
  const firstName = displayName.split(' ')[0];

  const { data: pontos = [], isLoading: isLoadingPontos } = usePontosAutenticados();
  const { data: minhasOcorrencias = [], isLoading: isLoadingOcorrencias } = useOcorrenciasUsuario(user?.id);

  const isLoading = isLoadingPontos || isLoadingOcorrencias;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-surface-500 font-medium">Carregando seus dados...</p>
      </div>
    );
  }

  const pendentesCount = minhasOcorrencias.filter(o => o.status === 'pendente' || o.status === 'em_revisao').length;

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="space-y-8 max-w-4xl mx-auto pb-20 pt-6"
    >
      
      {/* Cabeçalho */}
      <motion.div variants={itemVariants} className="text-center sm:text-left mb-2">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-surface-900 tracking-tight">
          Olá, {firstName}
        </h1>
        <p className="text-surface-600 mt-2 text-base sm:text-lg max-w-2xl">
          Como você quer impactar Pirituba hoje?
        </p>
      </motion.div>

      {/* Grid de Estatísticas (Bento) */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-[24px] border border-surface-200 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left transition-colors hover:border-surface-300">
          <div className="w-10 h-10 rounded-full bg-surface-50 flex items-center justify-center mb-3 text-surface-600">
            <Users className="w-5 h-5" weight="duotone" />
          </div>
          <p className="text-3xl font-bold text-surface-900 font-mono tracking-tighter">{pontos.length}</p>
          <p className="text-[11px] sm:text-xs font-semibold text-surface-500 uppercase tracking-wider mt-1">Pontos Mapeados</p>
        </div>

        <div className="p-5 bg-primary-50 rounded-[24px] border border-primary-100 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left transition-colors hover:border-primary-200">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-3 text-primary-700 shadow-sm">
            <ChartLineUp className="w-5 h-5" weight="duotone" />
          </div>
          <p className="text-3xl font-bold text-primary-900 font-mono tracking-tighter">{minhasOcorrencias.length}</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
            <p className="text-[11px] sm:text-xs font-semibold text-primary-700 uppercase tracking-wider">Meu Impacto</p>
            {pendentesCount > 0 && (
              <Badge variant="warning" className="text-[10px] py-0">{pendentesCount} em análise</Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Ações Principais */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card Registrar Denúncia */}
        <Link to="/app/nova-denuncia" className="group block h-full">
          <div className="h-full relative overflow-hidden rounded-[24px] bg-primary-700 p-6 sm:p-8 transition-transform duration-300 hover:scale-[1.02] shadow-md flex flex-col">
            <div className="relative z-10 flex flex-col flex-1 h-full">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-white" weight="bold" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-white mb-2 tracking-tight">Nova denúncia</h2>
              <p className="text-primary-100 text-sm flex-1 mb-4">
                Encontrou descarte irregular? Informe agora.
              </p>
              <div className="flex items-center text-white text-sm font-bold gap-2 group-hover:gap-3 transition-all mt-auto">
                Registrar <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>

        {/* Card Explorar Mapa */}
        <Link to="/app/mapa" className="group block h-full">
          <div className="h-full rounded-[24px] bg-surface-100 p-6 sm:p-8 transition-colors duration-300 hover:bg-surface-200/80 border border-surface-200/50 flex flex-col">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 text-surface-600 shadow-sm">
              <MapTrifold className="w-6 h-6" weight="fill" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-surface-900 mb-2 tracking-tight">Mapa</h2>
            <p className="text-surface-600 text-sm flex-1 mb-4">
              Navegue pelos pontos já reportados pela comunidade.
            </p>
            <div className="flex items-center text-primary-700 text-sm font-bold gap-2 group-hover:gap-3 transition-all mt-auto">
              Explorar <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Atalhos */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map((link) => (
            <motion.div key={link.to} variants={itemVariants}>
              <Link to={link.to} className="group block h-full">
                <div className="flex items-center gap-4 p-5 rounded-[20px] bg-white border border-surface-200 shadow-sm hover:shadow-md hover:border-surface-300 transition-all duration-300 h-full">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-surface-50 flex items-center justify-center text-surface-600 group-hover:bg-primary-50 group-hover:text-primary-700 transition-colors">
                    <link.icon className="w-5 h-5" weight="duotone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-base font-bold text-surface-900 tracking-tight">
                      {link.label}
                    </h3>
                    <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">
                      {link.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-primary-600 shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
    </motion.div>
  );
}
