import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface Step {
  label: string;
  shortLabel?: string;
}

interface ReportStepperProps {
  steps: Step[];
  currentStep: number;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  showBack?: boolean;
  showNext?: boolean;
}

export function ReportStepper({
  steps,
  currentStep,
  children,
  onBack,
  onNext,
  nextLabel = 'Continuar',
  nextDisabled = false,
  nextLoading = false,
  showBack = true,
  showNext = true,
}: ReportStepperProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="shrink-0 px-4 sm:px-0 pb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => {
            const isCompleted = i < currentStep;
            const isCurrent = i === currentStep;

            return (
              <div key={i} className="flex items-center flex-1">
                {/* Step circle */}
                <div className="flex flex-col items-center relative">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                      isCompleted
                        ? 'bg-primary-600 text-white'
                        : isCurrent
                        ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500 ring-offset-2'
                        : 'bg-surface-100 text-surface-400'
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      'absolute -bottom-5 text-[10px] font-medium whitespace-nowrap',
                      isCurrent ? 'text-primary-700' : isCompleted ? 'text-primary-600' : 'text-surface-400'
                    )}
                  >
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.shortLabel || step.label}</span>
                  </span>
                </div>

                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2',
                      i < currentStep ? 'bg-primary-500' : 'bg-surface-200'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto pt-8">
        {children}
      </div>

      {/* Navigation */}
      <div className="shrink-0 pt-4 mt-4 border-t border-surface-100 flex items-center justify-between gap-3">
        {showBack && currentStep > 0 ? (
          <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft className="w-4 h-4" />}>
            Voltar
          </Button>
        ) : (
          <div />
        )}

        {showNext && (
          <Button
            size="sm"
            onClick={onNext}
            disabled={nextDisabled}
            loading={nextLoading}
            icon={currentStep === steps.length - 1 ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          >
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
