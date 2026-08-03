import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Alert, Button, Spinner } from '@/components/ui';
import { ReportStepper } from '@/features/report/ReportStepper';
import { LocationStep } from '@/features/report/steps/LocationStep';
import { ProximityStep } from '@/features/report/steps/ProximityStep';
import { FormStep } from '@/features/report/steps/FormStep';
import { ReviewStep } from '@/features/report/steps/ReviewStep';
import { EMPTY_REPORT_DRAFT } from '@/types';
import type { ReportDraft, ProximityCheckResult } from '@/types';
import { CheckCircle, ArrowLeft, House, ShieldWarning } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useRateLimit, useEnviarOcorrencia, usePontoAutenticado } from '@/services/queries';

const STEPS = [
  { label: 'Localização', shortLabel: 'Local' },
  { label: 'Verificação', shortLabel: 'Verif.' },
  { label: 'Detalhes', shortLabel: 'Dados' },
  { label: 'Revisão', shortLabel: 'Enviar' },
];

export function NewReportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetPointId = searchParams.get('pointId');

  const { data: rateLimit, isLoading: rateLimitLoading } = useRateLimit(user?.id);
  const { data: presetPoint } = usePontoAutenticado(presetPointId || undefined);
  const { mutateAsync: enviarOcorrencia } = useEnviarOcorrencia();

  const [currentStep, setCurrentStep] = useState(0);
  const [draft, setDraft] = useState<ReportDraft>({ ...EMPTY_REPORT_DRAFT });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // If preset pointId, pre-fill location from that point
  useEffect(() => {
    if (presetPoint) {
      setDraft(prev => ({
        ...prev,
        latitude: presetPoint.latitude,
        longitude: presetPoint.longitude,
      }));
    }
  }, [presetPoint]);

  const updateDraft = useCallback(<K extends keyof ReportDraft>(field: K, value: ReportDraft[K]) => {
    setDraft(prev => ({ ...prev, [field]: value }));
    // Clear error for field
    setErrors(prev => {
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  }, []);

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setDraft(prev => ({ ...prev, latitude: lat, longitude: lng }));
  }, []);

  const handleProximityResult = useCallback((result: ProximityCheckResult) => {
    setDraft(prev => ({ ...prev, proximityResult: result }));
  }, []);

  const handleConfirmPoint = useCallback((pointId: string) => {
    setDraft(prev => ({ ...prev, confirmingPointId: pointId || null }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!draft.categoria_principal) newErrors.categoria_principal = 'Selecione o tipo de resíduo.';
    if (!draft.frequencia_percebida) newErrors.frequencia_percebida = 'Selecione a frequência percebida.';
    if (!draft.horario_percebido) newErrors.horario_percebido = 'Selecione o período do dia.';
    if (!draft.volume_estimado) newErrors.volume_estimado = 'Selecione o volume estimado.';
    
    // Description is optional now, but if provided, it should be reasonable
    if (draft.descricao && draft.descricao.length > 500) {
      newErrors.descricao = 'A descrição não pode exceder 500 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [draft]);

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 0: return draft.latitude !== 0 && draft.longitude !== 0;
      case 1: return draft.proximityResult !== null;
      case 2: return true; // validated on "next"
      case 3: return true;
      default: return false;
    }
  }, [currentStep, draft]);

  const handleNext = async () => {
    if (currentStep === 2) {
      // Validate form before proceeding
      if (!validateForm()) return;
    }

    if (currentStep === 3) {
      if (!user) return;
      // Submit
      setSubmitLoading(true);
      try {
        await enviarOcorrencia({
          ocorrencia: {
            registrado_por: user.id,
            latitude: draft.latitude,
            longitude: draft.longitude,
            ponto_id: draft.confirmingPointId || undefined,
            tipo: draft.confirmingPointId ? 'confirmacao' : 'denuncia',
            status: draft.proximityResult?.scenario === 'faixa_cinzenta' ? 'em_revisao' : 'pendente',
            tipo_residuo: draft.categoria_principal,
            volume_estimado: draft.volume_estimado || undefined,
            frequencia_percebida: draft.frequencia_percebida || undefined,
            horario_percebido: draft.horario_percebido || undefined,
            descricao: draft.descricao || undefined,
          },
          files: draft.photos,
          faixaCinzentaMotivo: draft.proximityResult?.scenario === 'faixa_cinzenta' ? 'faixa_cinzenta' : undefined,
        });
        setSubmitted(true);
      } catch (error) {
        console.error('Erro ao enviar denúncia:', error);
        setErrors({ submit: 'Erro ao enviar denúncia. Tente novamente.' });
      } finally {
        setSubmitLoading(false);
      }
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  // Rate Limit check
  if (rateLimitLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-surface-500">Verificando disponibilidade...</p>
      </div>
    );
  }

  if (rateLimit && !rateLimit.permitido && !submitted) {
    return (
      <div className="max-w-lg mx-auto py-10">
        <Card className="text-center py-10 px-6">
          <div className="w-16 h-16 mx-auto bg-warning-50 rounded-2xl flex items-center justify-center mb-4">
            <ShieldWarning className="w-8 h-8 text-warning-500" />
          </div>
          <h2 className="text-xl font-bold text-surface-900 mb-2">Limite diário atingido</h2>
          <p className="text-sm text-surface-600 mb-6 leading-relaxed">
            Você atingiu o limite de {rateLimit.limite} denúncias por dia. 
            Isso nos ajuda a manter a qualidade dos dados e evita sobrecarga no sistema de triagem.
            Por favor, tente novamente amanhã.
          </p>
          <Link to="/app">
            <Button size="sm" fullWidth icon={<House className="w-4 h-4" />}>
              Voltar ao início
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Success screen
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-10">
        <Card className="text-center py-10 px-6">
          <div className="w-16 h-16 mx-auto bg-success-50 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
          <h2 className="text-xl font-bold text-surface-900 mb-2">Denúncia registrada!</h2>
          <p className="text-sm text-surface-600 max-w-sm mx-auto mb-6 leading-relaxed">
            {draft.confirmingPointId
              ? 'Confirmação registrada com sucesso! Ela fortalece o ponto já existente.'
              : draft.proximityResult?.scenario === 'faixa_cinzenta'
              ? 'Sua denúncia foi recebida e será analisada pela nossa equipe, pois há outro ponto próximo na mesma área.'
              : 'Sua denúncia foi registrada com sucesso! Ela passará por validação.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/app/mapa">
              <Button size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                Voltar ao mapa
              </Button>
            </Link>
            <Link to="/app/minhas-denuncias">
              <Button variant="secondary" size="sm" icon={<House className="w-4 h-4" />}>
                Ver minhas denúncias
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isConfirmation = !!draft.confirmingPointId;
  const nextLabel =
    currentStep === 3
      ? isConfirmation ? 'Confirmar ponto' : 'Registrar denúncia'
      : 'Continuar';

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <h1 className="text-xl font-bold text-surface-900">Nova denúncia</h1>
        <p className="text-sm text-surface-500 mt-1">
          Registre um problema de descarte irregular na sua região.
        </p>
      </div>

      {errors.submit && (
        <Alert variant="error" className="mb-4">{errors.submit}</Alert>
      )}

      <Card>
        <ReportStepper
          steps={STEPS}
          currentStep={currentStep}
          onBack={handleBack}
          onNext={handleNext}
          nextLabel={nextLabel}
          nextDisabled={!canProceed()}
          nextLoading={submitLoading}
        >
          {currentStep === 0 && (
            <LocationStep
              latitude={draft.latitude}
              longitude={draft.longitude}
              onLocationChange={handleLocationChange}
            />
          )}
          {currentStep === 1 && (
            <ProximityStep
              latitude={draft.latitude}
              longitude={draft.longitude}
              onResult={handleProximityResult}
              onConfirmPoint={handleConfirmPoint}
              result={draft.proximityResult}
              confirmingPointId={draft.confirmingPointId}
            />
          )}
          {currentStep === 2 && (
            <FormStep
              draft={draft}
              onChange={updateDraft}
              errors={errors}
            />
          )}
          {currentStep === 3 && (
            <ReviewStep
              draft={draft}
              isConfirmation={isConfirmation}
            />
          )}
        </ReportStepper>
      </Card>
    </div>
  );
}
