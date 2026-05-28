import { Card, Spinner, Badge } from '@/components/ui';
import { FileText, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useOcorrenciasUsuario } from '@/services/queries';
import { WASTE_CATEGORY_LABELS, OCORRENCIA_STATUS_LABELS } from '@/types';
import { Link } from 'react-router-dom';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
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

export function MyReports() {
  const { user } = useAuth();
  const { data: ocorrencias = [], isLoading } = useOcorrenciasUsuario(user?.id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-surface-500">Buscando suas contribuições...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-bold text-surface-900">Minhas denúncias</h1>
        <p className="text-sm text-surface-500 mt-1">
          Acompanhe o status de todas as suas contribuições.
        </p>
      </div>

      {ocorrencias.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-primary-600" />
          </div>
          <h2 className="text-lg font-semibold text-surface-900 mb-2">
            Nenhuma denúncia registrada
          </h2>
          <p className="text-sm text-surface-500 max-w-sm mb-6">
            Você ainda não registrou nenhuma denúncia ou confirmação. Ajude a mapear os pontos de descarte irregular em Pirituba!
          </p>
          <Link to="/app/nova-denuncia" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Registrar nova denúncia
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {ocorrencias.map(ocorrencia => (
            <Card key={ocorrencia.id} className="p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(ocorrencia.status)}>
                    {OCORRENCIA_STATUS_LABELS[ocorrencia.status]}
                  </Badge>
                  <span className="text-xs font-medium text-surface-500 bg-surface-100 px-2 py-0.5 rounded uppercase tracking-wider">
                    {ocorrencia.tipo === 'denuncia' ? 'Nova Denúncia' : 'Confirmação'}
                  </span>
                </div>
                <div className="text-xs text-surface-400 flex items-center gap-1 shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(ocorrencia.created_at)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-surface-700 leading-snug">
                    {ocorrencia.pontos_descarte?.endereco || `${ocorrencia.latitude.toFixed(5)}, ${ocorrencia.longitude.toFixed(5)}`}
                  </p>
                </div>
                
                {ocorrencia.categoria_principal && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-surface-700">
                      <span className="font-medium text-surface-900">Resíduo: </span>
                      {WASTE_CATEGORY_LABELS[ocorrencia.categoria_principal] || ocorrencia.categoria_principal}
                    </p>
                  </div>
                )}
                
                {ocorrencia.descricao && (
                  <p className="text-sm text-surface-600 bg-surface-50 p-3 rounded-lg border border-surface-100 mt-2 italic">
                    "{ocorrencia.descricao}"
                  </p>
                )}

                {ocorrencia.observacoes_revisao && (
                  <div className="mt-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <p className="text-xs font-semibold text-warning-800 mb-1">Nota da moderação:</p>
                    <p className="text-xs text-warning-700">{ocorrencia.observacoes_revisao}</p>
                  </div>
                )}
              </div>

              {ocorrencia.ponto_id && (
                <div className="mt-4 pt-3 border-t border-surface-100 flex justify-end">
                  <Link 
                    to={`/app/mapa?pointId=${ocorrencia.ponto_id}`}
                    className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Ver ponto no mapa
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
