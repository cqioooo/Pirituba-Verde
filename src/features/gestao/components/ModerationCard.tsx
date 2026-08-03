import { useState } from 'react';
import { Button, Card, Textarea } from '@/components/ui';
import { WASTE_CATEGORY_LABELS } from '@/types';
import type { ModeracaoOcorrencia, Ocorrencia } from '@/types';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useApproveModeracao, useRejectModeracao } from '@/services/queries';
import { Check, X, Warning } from '@phosphor-icons/react';

interface ModerationCardProps {
  item: ModeracaoOcorrencia & { ocorrencia: Ocorrencia };
}

export function ModerationCard({ item }: ModerationCardProps) {
  const { user } = useAuth();
  const { mutateAsync: approve, isPending: isApproving } = useApproveModeracao();
  const { mutateAsync: reject, isPending: isRejecting } = useRejectModeracao();
  
  const [observacao, setObservacao] = useState('');

  const isPending = isApproving || isRejecting;

  const handleApprove = async () => {
    if (!user) return;
    await approve({ id: item.id, observacao, moderadoPor: user.id });
  };

  const handleReject = async () => {
    if (!user) return;
    await reject({ id: item.id, observacao, moderadoPor: user.id });
  };

  const fotoUrls = item.ocorrencia.fotos || (item.ocorrencia.foto_url ? [item.ocorrencia.foto_url] : []);

  return (
    <Card className="overflow-hidden flex flex-col md:flex-row">
      <div className="w-full md:w-1/3 h-48 md:h-auto bg-surface-100 relative">
        {fotoUrls.length > 0 ? (
          <img 
            src={fotoUrls[0]} 
            alt="Evidência" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-surface-400">
            Sem foto
          </div>
        )}
        <div className="absolute top-2 left-2 bg-warning-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center">
          <Warning className="w-3 h-3 mr-1" />
          {item.motivo}
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-surface-900">
              {item.ocorrencia.categoria_principal ? WASTE_CATEGORY_LABELS[item.ocorrencia.categoria_principal] : 'Categoria não informada'}
            </h3>
            <p className="text-sm text-surface-500">
              {item.ocorrencia.pontos_descarte?.endereco || 'Localização via mapa'} • {formatDate(item.ocorrencia.created_at)}
            </p>
          </div>
          <span className="text-xs font-mono bg-surface-100 px-2 py-1 rounded text-surface-600">
            {item.ocorrencia.id.split('-')[0]}
          </span>
        </div>
        
        <p className="text-sm text-surface-700 mb-4 line-clamp-3">
          "{item.ocorrencia.descricao || 'Sem descrição'}"
        </p>

        <div className="mt-auto space-y-3">
          <Textarea
            label=""
            placeholder="Observação da moderação (opcional)..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={2}
            disabled={isPending}
          />
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              variant="outline"
              onClick={handleReject}
              loading={isRejecting}
              disabled={isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Rejeitar
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleApprove}
              loading={isApproving}
              disabled={isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              Aprovar
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
