import { Lightbulb } from '@phosphor-icons/react';
import type { ScenarioSummary } from '@/types/operational';

interface ScenarioSummaryCardProps {
  data: ScenarioSummary | null;
}

export function ScenarioSummaryCard({ data }: ScenarioSummaryCardProps) {
  if (!data) return null;

  return (
    <div className="flex flex-col h-full border-b border-surface-200 pb-8">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center mt-0.5">
          <Lightbulb className="w-6 h-6 text-primary-600" weight="bold" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-1">{data.title}</p>
          <p className="text-xl font-heading font-bold leading-tight text-surface-900">{data.headline}</p>
          {data.supportingText && (
            <p className="text-sm text-surface-600 mt-2 leading-relaxed">{data.supportingText}</p>
          )}
        </div>
      </div>
    </div>
  );
}
