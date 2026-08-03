import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { ReportDraft } from '@/types';
import {
  WASTE_CATEGORY_LABELS,
  WASTE_CATEGORY_COLORS,
  FREQUENCY_LABELS,
  TIME_LABELS,
  VOLUME_LABELS,
} from '@/types';
import { MapPin, Tag, Clock, Ruler, FileText, CheckCircle, Image as ImageIcon } from '@phosphor-icons/react';

const pinIcon = L.divIcon({
  className: 'pv-marker',
  html: `<div style="
    width: 20px; height: 20px;
    background: #2D6A4F;
    border: 3px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 20],
});

interface ReviewStepProps {
  draft: ReportDraft;
  isConfirmation: boolean;
}

function ReviewRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] text-surface-400 uppercase tracking-wider">{label}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />}
          <p className="text-sm text-surface-800 font-medium">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function ReviewStep({ draft, isConfirmation }: ReviewStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-surface-900">
          {isConfirmation ? 'Confirmação de ponto existente' : 'Revise sua denúncia'}
        </h2>
        <p className="text-sm text-surface-500 mt-1">
          {isConfirmation
            ? 'Confira os dados antes de confirmar o ponto.'
            : 'Verifique os dados antes de enviar. Você poderá acompanhar o andamento após o registro.'}
        </p>
      </div>

      {/* Mini map */}
      <div className="rounded-xl overflow-hidden border border-surface-200 h-36">
        <MapContainer
          center={[draft.latitude, draft.longitude]}
          zoom={16}
          className="w-full h-full"
          zoomControl={false}
          dragging={false}
          touchZoom={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
        >
          <TileLayer 
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
          />
          <Marker position={[draft.latitude, draft.longitude]} icon={pinIcon} />
        </MapContainer>
      </div>

      {/* Review data */}
      <div className="bg-white border border-surface-200 rounded-xl divide-y divide-surface-100">
        <div className="px-4">
          <ReviewRow
            icon={MapPin}
            label="Localização"
            value={`${draft.latitude.toFixed(5)}, ${draft.longitude.toFixed(5)}`}
          />
        </div>
        {draft.categoria_principal && (
          <div className="px-4">
            <ReviewRow
              icon={Tag}
              label="Tipo de resíduo"
              value={WASTE_CATEGORY_LABELS[draft.categoria_principal]}
              color={WASTE_CATEGORY_COLORS[draft.categoria_principal]}
            />
          </div>
        )}
        {draft.frequencia_percebida && (
          <div className="px-4">
            <ReviewRow
              icon={Clock}
              label="Frequência percebida"
              value={FREQUENCY_LABELS[draft.frequencia_percebida]}
            />
          </div>
        )}
        {draft.horario_percebido && (
          <div className="px-4">
            <ReviewRow
              icon={Clock}
              label="Horário percebido"
              value={TIME_LABELS[draft.horario_percebido]}
            />
          </div>
        )}
        {draft.volume_estimado && (
          <div className="px-4">
            <ReviewRow
              icon={Ruler}
              label="Volume estimado"
              value={VOLUME_LABELS[draft.volume_estimado]}
            />
          </div>
        )}
        {draft.descricao && (
          <div className="px-4">
            <ReviewRow
              icon={FileText}
              label="Descrição"
              value={draft.descricao}
            />
          </div>
        )}
        {draft.photos.length > 0 && (
          <div className="px-4 py-2.5 flex items-start gap-3">
            <ImageIcon className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-surface-400 uppercase tracking-wider mb-1">Fotos</p>
              <div className="flex gap-2">
                {draft.photos.map((photo, i) => (
                  <img
                    key={i}
                    src={URL.createObjectURL(photo)}
                    alt={`Preview ${i}`}
                    className="w-10 h-10 object-cover rounded shadow-sm border border-surface-200"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation hint */}
      <div className="flex items-start gap-2 bg-primary-50 border border-primary-100 rounded-lg p-3">
        <CheckCircle className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
        <p className="text-xs text-primary-700 leading-relaxed">
          Após o envio, sua denúncia passará por validação. Você receberá atualizações sobre o andamento
          na área de notificações.
        </p>
      </div>
    </div>
  );
}
