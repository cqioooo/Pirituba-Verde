import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, Alert, Button, Spinner } from '@/components/ui';
import { ReportStepper } from '@/features/report/ReportStepper';
import { LocationStep } from '@/features/report/steps/LocationStep';
import { ProximityStep } from '@/features/report/steps/ProximityStep';
import { FormStep } from '@/features/report/steps/FormStep';
import { ReviewStep } from '@/features/report/steps/ReviewStep';
import { validarArquivoFotoResolucao } from '@/lib/imagemResolucao';
import { calcularDistanciaMetros } from '@/lib/moderacao';
import { EMPTY_REPORT_DRAFT } from '@/types';
import type { ReportDraft, ProximityCheckResult } from '@/types';
import { CheckCircle, ArrowLeft, House, ShieldWarning } from '@phosphor-icons/react';
import { useAuth } from '@/hooks/useAuth';
import {
  useConfiguracoes,
  useConfirmarPonto,
  useRateLimit,
  useEnviarOcorrencia,
  usePontoAutenticado,
  usePontosAutenticados,
} from '@/services/queries';

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
  const modo = searchParams.get('modo');

  const { data: configs } = useConfiguracoes();
  const { data: rateLimit, isLoading: rateLimitLoading } = useRateLimit(user?.id);
  const { data: presetPoint } = usePontoAutenticado(presetPointId || undefined);
  const { data: pontosAutenticados = [] } = usePontosAutenticados();
  const { mutateAsync: enviarOcorrencia } = useEnviarOcorrencia();
  const { mutateAsync: confirmarPonto } = useConfirmarPonto();

  const [currentStep, setCurrentStep] = useState(0);
  const [draft, setDraft] = useState<ReportDraft>({
    ...EMPTY_REPORT_DRAFT,
    confirmingPointId:
      presetPointId && (modo === 'renovacao' || modo === 'contestacao') ? presetPointId : null,
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submitLockRef = useRef(false);

  const hasPickedCoords = draft.latitude !== 0 && draft.longitude !== 0;
  const effectiveLatitude = hasPickedCoords ? draft.latitude : (presetPoint?.latitude ?? 0);
  const effectiveLongitude = hasPickedCoords ? draft.longitude : (presetPoint?.longitude ?? 0);
  const effectiveDraft = useMemo<ReportDraft>(
    () =>
      hasPickedCoords || !presetPoint
        ? draft
        : {
            ...draft,
            latitude: presetPoint.latitude,
            longitude: presetPoint.longitude,
          },
    [draft, hasPickedCoords, presetPoint],
  );

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

  const handleAddressChange = useCallback((endereco: string, bairro: string) => {
    setDraft(prev =>
      prev.endereco === endereco && prev.bairro === bairro
        ? prev
        : { ...prev, endereco, bairro }
    );
  }, []);

  const handleProximityResult = useCallback((result: ProximityCheckResult) => {
    setDraft(prev => (prev.proximityResult === result ? prev : { ...prev, proximityResult: result }));
  }, []);

  const handleConfirmPoint = useCallback((pointId: string) => {
    setDraft(prev => ({ ...prev, confirmingPointId: pointId || null }));
  }, []);

  const isRenovacao = modo === 'renovacao' && presetPoint?.status === 'em_confirmacao';
  const isDirectConfirmation =
    Boolean(draft.confirmingPointId) && !isRenovacao && modo !== 'contestacao';
  const minFotosObrigatorias = isRenovacao ? 1 : 2;
  const confirmingPoint = useMemo(() => {
    if (!draft.confirmingPointId) return null;
    return (
      pontosAutenticados.find((p) => p.id === draft.confirmingPointId) ??
      (presetPoint?.id === draft.confirmingPointId ? presetPoint : null)
    );
  }, [draft.confirmingPointId, pontosAutenticados, presetPoint]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!draft.categoria_principal) newErrors.categoria_principal = 'Selecione o tipo de resíduo.';
    if (!draft.frequencia_percebida) newErrors.frequencia_percebida = 'Selecione a frequência percebida.';
    if (!draft.horario_percebido) newErrors.horario_percebido = 'Selecione o período do dia.';
    if (!draft.volume_estimado) newErrors.volume_estimado = 'Selecione o volume estimado.';

    if (draft.photos.length < minFotosObrigatorias) {
      newErrors.photos =
        minFotosObrigatorias === 1
          ? 'Anexe pelo menos 1 foto válida para renovar este registro.'
          : 'Anexe no mínimo 2 fotos comprobatórias válidas para registrar a denúncia.';
    } else if (draft.photos.length > 3) {
      newErrors.photos = 'É possível anexar no máximo 3 fotos por registro.';
    } else {
      for (const file of draft.photos) {
        const fileError = validarArquivoFotoResolucao(file);
        if (fileError) {
          newErrors.photos = fileError;
          break;
        }
      }
    }

    // Description is optional now, but if provided, it should be reasonable
    if (draft.descricao && draft.descricao.length > 500) {
      newErrors.descricao = 'A descrição não pode exceder 500 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [draft, minFotosObrigatorias]);

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 0: return effectiveLatitude !== 0 && effectiveLongitude !== 0;
      case 1: return draft.proximityResult !== null;
      case 2: return true; // validated on "next"
      case 3: return true;
      default: return false;
    }
  }, [currentStep, effectiveLatitude, effectiveLongitude, draft.proximityResult]);

  const classificarErroEnvio = (err: unknown): string => {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code?: unknown }).code)
        : '';

    if (
      code === '42501' ||
      msg.includes('permission') ||
      msg.includes('not authorized') ||
      msg.includes('not confirmed')
    ) {
      return 'Conta sem permissão ou não ativada para registrar ocorrências. Confirme seu e-mail e faça login novamente.';
    }
    if (msg.includes('limite') || msg.includes('rate limit')) {
      return 'Você atingiu o limite diário de novas denúncias permitidas.';
    }
    if (msg.includes('formato') || msg.includes('5 mb') || msg.includes('foto') || msg.includes('vazio')) {
      return err instanceof Error ? err.message : 'Verifique as fotos anexadas antes de enviar.';
    }
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('offline')) {
      return 'Serviço indisponível ou sem conexão no momento. Seus dados foram preservados; tente novamente.';
    }
    return 'Não foi possível concluir o envio da denúncia. Seus dados foram preservados; tente novamente.';
  };

  const handleNext = async () => {
    if (currentStep === 1 && isDirectConfirmation) {
      // Ao confirmar ponto existente, pula o formulário de nova denúncia e vai direto para a confirmação
      setCurrentStep(3);
      return;
    }

    if (currentStep === 2) {
      // Validate form before proceeding
      if (!validateForm()) return;
    }

    if (currentStep === 3) {
      if (!user || submitLockRef.current) return;

      if (isDirectConfirmation && draft.confirmingPointId) {
        const raio = configs?.raio_geofence_metros ?? 15;
        if (confirmingPoint) {
          const dist = calcularDistanciaMetros(
            effectiveLatitude,
            effectiveLongitude,
            confirmingPoint.latitude,
            confirmingPoint.longitude
          );
          if (dist > raio) {
            setErrors({
              submit: `Para confirmar este ponto é necessário estar a até ${raio} m do local (distância atual: ${Math.round(dist)} m).`,
            });
            return;
          }
        }

        submitLockRef.current = true;
        setSubmitLoading(true);
        setErrors((prev) => {
          const next = { ...prev };
          delete next.submit;
          return next;
        });
        try {
          await confirmarPonto({
            ponto_id: draft.confirmingPointId,
            usuario_id: user.id,
            latitude: effectiveLatitude,
            longitude: effectiveLongitude,
          });
          setSubmitted(true);
        } catch (error) {
          const msg = error instanceof Error ? error.message.toLowerCase() : '';
          if (msg.includes('autor')) {
            setErrors({ submit: 'O autor do ponto não pode contabilizar confirmação externa.' });
          } else if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('já confirmou')) {
            setErrors({ submit: 'Você já registrou confirmação para este ponto neste ciclo.' });
          } else {
            setErrors({ submit: classificarErroEnvio(error) });
          }
        } finally {
          submitLockRef.current = false;
          setSubmitLoading(false);
        }
        return;
      }

      if (isRenovacao && presetPoint) {
        const raio = configs?.raio_geofence_metros ?? 15;
        const dist = calcularDistanciaMetros(
          effectiveLatitude,
          effectiveLongitude,
          presetPoint.latitude,
          presetPoint.longitude
        );
        if (dist > raio) {
          setErrors({
            submit: `Para renovar este ponto é necessário estar a até ${raio} m do local (você está a ${Math.round(dist)} m).`,
          });
          return;
        }
      }

      submitLockRef.current = true;
      setSubmitLoading(true);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.submit;
        return next;
      });
      try {
        await enviarOcorrencia({
          ocorrencia: {
            registrado_por: user.id,
            latitude: effectiveLatitude,
            longitude: effectiveLongitude,
            ponto_id: draft.confirmingPointId || (modo === 'contestacao' ? presetPointId : undefined),
            tipo: draft.confirmingPointId ? 'confirmacao' : 'denuncia',
            status: 'pendente',
            tipo_residuo: draft.categoria_principal ? [draft.categoria_principal] : undefined,
            volume_estimado: draft.volume_estimado || undefined,
            frequencia_percebida: draft.frequencia_percebida || undefined,
            horario_percebido: draft.horario_percebido || undefined,
            descricao: draft.descricao || undefined,
          },
          files: draft.photos,
          faixaCinzentaMotivo: draft.proximityResult?.scenario === 'faixa_cinzenta' ? 'faixa_cinzenta' : undefined,
          enderecoInicial: draft.endereco || undefined,
          bairroInicial: draft.bairro || undefined,
        });
        setSubmitted(true);
      } catch (error) {
        console.error('Erro ao enviar denúncia:', error);
        setErrors({ submit: classificarErroEnvio(error) });
      } finally {
        submitLockRef.current = false;
        setSubmitLoading(false);
      }
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = useCallback(() => {
    if (currentStep === 3 && isDirectConfirmation) {
      setCurrentStep(1);
      return;
    }
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, [currentStep, isDirectConfirmation]);

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
          <h2 className="text-xl font-bold text-surface-900 mb-2">
            {isDirectConfirmation ? 'Confirmação registrada!' : 'Denúncia registrada!'}
          </h2>
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

  const nextLabel =
    currentStep === 1 && isDirectConfirmation
      ? 'Confirmar ponto selecionado'
      : currentStep === 3
        ? isDirectConfirmation
          ? 'Confirmar ponto'
          : 'Registrar denúncia'
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
              latitude={effectiveLatitude}
              longitude={effectiveLongitude}
              endereco={draft.endereco}
              onLocationChange={handleLocationChange}
              onAddressChange={handleAddressChange}
            />
          )}
          {currentStep === 1 && (
            <ProximityStep
              latitude={effectiveLatitude}
              longitude={effectiveLongitude}
              onResult={handleProximityResult}
              onConfirmPoint={handleConfirmPoint}
              result={draft.proximityResult}
              confirmingPointId={draft.confirmingPointId}
            />
          )}
          {currentStep === 2 && (
            <FormStep
              draft={effectiveDraft}
              onChange={updateDraft}
              errors={errors}
            />
          )}
          {currentStep === 3 && (
            <ReviewStep
              draft={effectiveDraft}
              isConfirmation={isDirectConfirmation}
              confirmingPoint={confirmingPoint}
            />
          )}
        </ReportStepper>
      </Card>
    </div>
  );
}
