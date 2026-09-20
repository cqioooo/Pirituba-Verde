import { POINT_STATUS_LABELS, WASTE_CATEGORY_LABELS, classificarCriticidade } from '@/types';
import type { PontoGestor } from '@/types';
import { formatDate } from '@/lib/utils';
import { X, MapPin, WarningCircle, Check } from '@phosphor-icons/react';
import { Button, Badge } from '@/components/ui';
import { CriticidadeBadge } from './CriticidadeBadge';
import { useNavigate } from 'react-router-dom';
import { SignedEvidenceThumbnail } from '@/components/shared/SignedEvidenceThumbnail';

interface MapSidePanelProps {
  ponto: PontoGestor | null;
  onClose: () => void;
}

export function MapSidePanel({ ponto, onClose }: MapSidePanelProps) {
  const navigate = useNavigate();

  if (!ponto) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl z-[1000] flex flex-col transform transition-transform animate-in slide-in-from-right-full duration-300">
      <div className="p-4 border-b border-surface-200 flex justify-between items-start bg-surface-50">
        <div>
          <h2 className="font-semibold text-surface-900">Detalhes do Ponto</h2>
          <p className="text-xs text-surface-500 font-mono mt-1">ID: {ponto.id.split('-')[0]}</p>
        </div>
        <button 
          onClick={onClose}
          className="text-surface-400 hover:text-surface-600 p-1 rounded-full hover:bg-surface-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Status e Criticidade */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={ponto.status === 'resolvido' ? 'success' : ponto.status === 'invalido' ? 'danger' : 'warning'}>
            {POINT_STATUS_LABELS[ponto.status]}
          </Badge>
          <CriticidadeBadge criticidade={classificarCriticidade(ponto.criticidade)} />
          {ponto.recorrente && (
            <Badge variant="danger">Recorrente</Badge>
          )}
        </div>

        {/* Categoria */}
        <div>
          <p className="text-sm text-surface-500 mb-1">Categoria Principal</p>
          <p className="font-medium text-surface-900">
            {ponto.categoria_principal ? WASTE_CATEGORY_LABELS[ponto.categoria_principal] : 'Não informada'}
          </p>
        </div>

        {/* Localização */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-surface-400 mt-0.5 flex-shrink-0" />
          <p className="text-surface-700">
            {ponto.endereco || 'Endereço não informado'}
            {ponto.bairro && <><br />{ponto.bairro}</>}
          </p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-50 p-3 rounded-lg border border-surface-100">
            <p className="text-xs text-surface-500 flex items-center gap-1">
              <WarningCircle className="w-3 h-3" />
              Denúncias
            </p>
            <p className="font-semibold text-lg mt-1">{ponto.total_denuncias}</p>
          </div>
          <div className="bg-surface-50 p-3 rounded-lg border border-surface-100">
            <p className="text-xs text-surface-500 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Confirmações
            </p>
            <p className="font-semibold text-lg mt-1">{ponto.total_confirmacoes}</p>
          </div>
        </div>

        {/* Datas */}
        <div className="text-sm space-y-2">
          <div className="flex justify-between border-b border-surface-100 pb-2">
            <span className="text-surface-500">Primeiro registro</span>
            <span className="text-surface-900 font-medium">
              {ponto.data_primeira_ocorrencia ? formatDate(ponto.data_primeira_ocorrencia) : '-'}
            </span>
          </div>
          <div className="flex justify-between border-b border-surface-100 pb-2">
            <span className="text-surface-500">Último registro</span>
            <span className="text-surface-900 font-medium">
              {ponto.data_ultima_ocorrencia ? formatDate(ponto.data_ultima_ocorrencia) : '-'}
            </span>
          </div>
        </div>
        
        {/* Thumbnail da ultima foto */}
        {ponto.ultima_foto_url && (
          <div>
             <p className="text-xs text-surface-500 mb-2">Última imagem registrada</p>
             <div className="aspect-video w-full rounded-lg overflow-hidden bg-surface-100">
               <SignedEvidenceThumbnail
                 contextId={ponto.id}
                 path={ponto.ultima_foto_url}
                 alt="Última evidência"
                 className="h-full w-full object-cover"
                 fallbackClassName="h-full w-full"
               />
             </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-surface-200 bg-white">
        <Button onClick={() => navigate(`/gestao/pontos/${ponto.id}`)} className="w-full">
          Ver Detalhes Completos
        </Button>
      </div>
    </div>
  );
}
