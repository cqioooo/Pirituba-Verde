import { Card } from '@/components/ui';
import { History as HistoryIcon } from 'lucide-react';

export function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-900">Histórico</h1>
        <p className="text-sm text-surface-500 mt-1">
          Acompanhe todas as atividades e atualizações.
        </p>
      </div>

      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
          <HistoryIcon className="w-7 h-7 text-primary-600" />
        </div>
        <h2 className="text-lg font-semibold text-surface-900 mb-2">
          Histórico vazio
        </h2>
        <p className="text-sm text-surface-500 max-w-sm">
          Suas atividades e atualizações sobre pontos monitorados aparecerão
          aqui conforme você utilizar a plataforma.
        </p>
      </Card>
    </div>
  );
}
