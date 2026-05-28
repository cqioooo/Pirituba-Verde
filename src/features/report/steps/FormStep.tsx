import type { ReportDraft } from '@/types';
import {
  WASTE_CATEGORY_LABELS,
  WASTE_CATEGORY_COLORS,
  FREQUENCY_LABELS,
  TIME_LABELS,
  VOLUME_LABELS,
} from '@/types';
import { Camera, X } from 'lucide-react';

interface FormStepProps {
  draft: ReportDraft;
  onChange: <K extends keyof ReportDraft>(field: K, value: ReportDraft[K]) => void;
  errors: Partial<Record<string, string>>;
}

const categories = Object.entries(WASTE_CATEGORY_LABELS);
const frequencies = Object.entries(FREQUENCY_LABELS);
const times = Object.entries(TIME_LABELS);
const volumes = Object.entries(VOLUME_LABELS);

function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-surface-700 mb-1.5">
      {label}
      {required && <span className="text-danger-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-xs text-danger-500 mt-1" role="alert">{error}</p>;
}

export function FormStep({ draft, onChange, errors }: FormStepProps) {
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onChange('photos', [...draft.photos, ...newFiles]);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...draft.photos];
    newPhotos.splice(index, 1);
    onChange('photos', newPhotos);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-surface-900">Detalhes da ocorrência</h2>
        <p className="text-sm text-surface-500 mt-1">
          Informe o que você observou. Quanto mais detalhes, melhor para a análise.
        </p>
      </div>

      {/* Category */}
      <div>
        <FieldLabel label="Tipo de resíduo predominante" required />
        <div className="grid grid-cols-2 gap-2">
          {categories.map(([key, label]) => {
            const selected = draft.categoria_principal === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange('categoria_principal', key)}
                className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-all ${
                  selected
                    ? 'border-primary-300 bg-primary-50 text-primary-800 ring-1 ring-primary-300'
                    : 'border-surface-200 bg-white text-surface-700 hover:border-surface-300'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: WASTE_CATEGORY_COLORS[key] }}
                />
                <span className="font-medium text-xs">{label}</span>
              </button>
            );
          })}
        </div>
        <FieldError error={errors.categoria_principal} />
      </div>

      {/* Frequency */}
      <div>
        <FieldLabel label="Com que frequência você percebe esse descarte?" required />
        <div className="grid grid-cols-2 gap-2">
          {frequencies.map(([key, label]) => {
            const selected = draft.frequencia_percebida === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange('frequencia_percebida', key)}
                className={`p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  selected
                    ? 'border-primary-300 bg-primary-50 text-primary-700'
                    : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <FieldError error={errors.frequencia_percebida} />
      </div>

      {/* Perceived time */}
      <div>
        <FieldLabel label="Em que período do dia costuma ocorrer?" required />
        <div className="grid grid-cols-2 gap-2">
          {times.map(([key, label]) => {
            const selected = draft.horario_percebido === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange('horario_percebido', key)}
                className={`p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  selected
                    ? 'border-primary-300 bg-primary-50 text-primary-700'
                    : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <FieldError error={errors.horario_percebido} />
      </div>

      {/* Volume */}
      <div>
        <FieldLabel label="Volume estimado" required />
        <div className="space-y-2">
          {volumes.map(([key, label]) => {
            const selected = draft.volume_estimado === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange('volume_estimado', key)}
                className={`w-full text-left p-3 rounded-lg border text-xs font-medium transition-all ${
                  selected
                    ? 'border-primary-300 bg-primary-50 text-primary-700'
                    : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <FieldError error={errors.volume_estimado} />
      </div>

      {/* Description */}
      <div>
        <FieldLabel label="Descrição do problema" />
        <textarea
          value={draft.descricao}
          onChange={(e) => onChange('descricao', e.target.value)}
          placeholder="Descreva o que você observou (opcional)"
          rows={3}
          className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none"
        />
        <FieldError error={errors.descricao} />
        <p className="text-[10px] text-surface-400 mt-1">{draft.descricao.length}/500 caracteres</p>
      </div>

      {/* Photos */}
      <div>
        <FieldLabel label="Fotos (opcional, máximo 3)" />
        {draft.photos.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {draft.photos.map((photo, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-surface-200 shadow-sm">
                <img src={URL.createObjectURL(photo)} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {draft.photos.length < 3 && (
          <label className="cursor-pointer border-2 border-dashed border-surface-200 rounded-lg p-6 text-center bg-surface-50/50 hover:bg-surface-50 hover:border-primary-300 transition-colors block">
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              className="hidden" 
              onChange={handlePhotoUpload} 
            />
            <Camera className="w-8 h-8 text-surface-400 hover:text-primary-500 transition-colors mx-auto mb-2" />
            <p className="text-xs text-surface-600 font-medium">Toque para anexar fotos</p>
          </label>
        )}
      </div>
    </div>
  );
}
