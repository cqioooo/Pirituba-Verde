import { useParams, useNavigate } from 'react-router-dom';
import { 
  usePontoGestor, 
  useHistoricoPonto, 
  useOcorrenciasByPonto, 
  useConfirmacoesByPonto 
} from '@/services/queries';
import { 
  POINT_STATUS_LABELS, 
  WASTE_CATEGORY_LABELS, 
  VOLUME_LABELS, 
  FREQUENCY_LABELS, 
  TIME_LABELS,
  classificarCriticidade 
} from '@/types';
import { formatDate } from '@/lib/utils';
import { Button, Badge, Spinner, Card } from '@/components/ui';
import { CriticidadeBadge } from '../components/CriticidadeBadge';
import { StatusTimeline } from '../components/StatusTimeline';
import { StatusActions } from '../components/StatusActions';
import { PhotoGallery } from '../components/PhotoGallery';
import { CaretLeft, MapPin, WarningCircle, CheckCircle, ArrowsClockwise } from '@phosphor-icons/react';

export function PointDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: ponto, isLoading: isPontoLoading } = usePontoGestor(id);
  const { data: historico = [], isLoading: isHistLoading } = useHistoricoPonto(id);
  const { data: ocorrencias = [], isLoading: isOcLoading } = useOcorrenciasByPonto(id);
  const { data: confirmacoes = [], isLoading: isConfLoading } = useConfirmacoesByPonto(id);

  const isLoading = isPontoLoading || isHistLoading || isOcLoading || isConfLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!ponto) {
    return (
      <div className="bg-danger-50 text-danger-600 p-6 rounded-xl text-center">
        Ponto não encontrado.
      </div>
    );
  }

  const todasFotos = ocorrencias
    .flatMap(o => o.fotos || (o.foto_url ? [o.foto_url] : []))
    .filter(Boolean) as string[];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header com Navegação */}
      <div>
        <Button onClick={() => navigate('/gestao/pontos')} variant="ghost" className="-ml-4 mb-2 text-surface-500">
          <CaretLeft className="w-4 h-4 mr-1" />
          Voltar para lista
        </Button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 tracking-tight flex items-center gap-3">
              Detalhes do Ponto
              <span className="text-sm font-mono bg-surface-200 text-surface-700 px-2 py-1 rounded">
                {ponto.id.split('-')[0]}
              </span>
            </h1>
            <p className="text-surface-500 text-sm mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {ponto.endereco || 'Endereço não informado'} • {ponto.bairro || 'Bairro desconhecido'}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Badge variant={ponto.status === 'resolvido' ? 'success' : ponto.status === 'invalido' ? 'danger' : 'warning'} className="text-sm px-3 py-1">
              {POINT_STATUS_LABELS[ponto.status]}
            </Badge>
            <CriticidadeBadge criticidade={classificarCriticidade(ponto.criticidade)} className="text-sm px-3 py-1" />
          </div>
        </div>
      </div>

      {/* Ações de Status */}
      <Card className="p-4 bg-primary-50/50 border-primary-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-primary-900">Ações de Gestão</h3>
            <p className="text-sm text-primary-700">Mude o status oficial deste ponto para refletir a ação em campo.</p>
          </div>
          <StatusActions pontoId={ponto.id} currentStatus={ponto.status} />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-surface-900 mb-4 border-b border-surface-100 pb-2">Informações do Ponto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-surface-500">Categoria Principal</p>
                <p className="font-medium">{ponto.categoria_principal ? WASTE_CATEGORY_LABELS[ponto.categoria_principal] : 'Não informada'}</p>
              </div>
              <div>
                <p className="text-sm text-surface-500">Tipo de Resíduo</p>
                <p className="font-medium capitalize">{ponto.tipo_residuo?.replace(/_/g, ' ') || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-surface-500">Volume Estimado</p>
                <p className="font-medium">{ponto.volume_estimado ? VOLUME_LABELS[ponto.volume_estimado] : 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-surface-500">Frequência</p>
                <p className="font-medium">{ponto.frequencia_percebida ? FREQUENCY_LABELS[ponto.frequencia_percebida] : 'Não informada'}</p>
              </div>
              <div>
                <p className="text-sm text-surface-500">Horário Comum</p>
                <p className="font-medium">{ponto.horario_percebido ? TIME_LABELS[ponto.horario_percebido] : 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-surface-500">Características</p>
                <div className="flex gap-2 mt-1">
                  {ponto.recorrente ? <Badge variant="danger">Recorrente</Badge> : <Badge variant="neutral">Não recorrente</Badge>}
                  {ponto.validado ? <Badge variant="success">Validado</Badge> : <Badge variant="warning">Em validação</Badge>}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-surface-900 mb-4 border-b border-surface-100 pb-2">Evidências Fotográficas ({todasFotos.length})</h2>
            <PhotoGallery photos={todasFotos} />
          </Card>

          <Card className="p-6">
             <h2 className="text-lg font-semibold text-surface-900 mb-4 border-b border-surface-100 pb-2">Ocorrências Base ({ocorrencias.length})</h2>
             <div className="space-y-4">
               {ocorrencias.map(oc => (
                 <div key={oc.id} className="bg-surface-50 rounded-lg p-4 border border-surface-100">
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-mono text-surface-500">{oc.id.split('-')[0]}</span>
                     <span className="text-xs text-surface-500">{formatDate(oc.created_at)}</span>
                   </div>
                   <p className="text-sm text-surface-800">"{oc.descricao || 'Sem descrição'}"</p>
                 </div>
               ))}
               {ocorrencias.length === 0 && <p className="text-sm text-surface-500">Nenhuma ocorrência encontrada.</p>}
             </div>
          </Card>
        </div>

        {/* Barra Lateral */}
        <div className="space-y-6">
          {/* Métricas resumidas */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <WarningCircle className="w-6 h-6 text-warning-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{ponto.total_denuncias}</p>
              <p className="text-xs text-surface-500 uppercase tracking-wide mt-1">Denúncias</p>
            </Card>
            <Card className="p-4 text-center">
              <CheckCircle className="w-6 h-6 text-success-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{ponto.total_confirmacoes}</p>
              <p className="text-xs text-surface-500 uppercase tracking-wide mt-1">Confirmações</p>
            </Card>
          </div>

          {/* Histórico de Status */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-surface-900 mb-4 uppercase tracking-wide">Linha do Tempo</h2>
            <StatusTimeline historico={historico} />
          </Card>

          {/* Cidadãos envolvidos */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-surface-900 mb-4 uppercase tracking-wide">Comunidade</h2>
            <p className="text-sm text-surface-600 mb-4">Pessoas que interagiram com este ponto.</p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-surface-50 p-2 rounded border border-surface-100">
                 <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                   <ArrowsClockwise className="w-3.5 h-3.5" />
                 </div>
                 <div>
                   <p className="text-sm font-medium text-surface-900">Relator Original</p>
                   <p className="text-xs text-surface-500">ID oculto por privacidade</p>
                 </div>
              </div>
              <div className="flex items-center justify-between text-sm text-surface-500 pl-2">
                <span>+ {confirmacoes.length} cidadãos confirmaram</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
