import { useModeracoesPendentes } from '@/services/queries';
import { ModerationCard } from '../components/ModerationCard';
import { Spinner } from '@/components/ui';
import { CheckCircle } from '@phosphor-icons/react';

export function ModerationPage() {
  const { data: moderacoes = [], isLoading } = useModeracoesPendentes();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Fila de Moderação</h1>
        <p className="text-surface-500 text-sm mt-1">
          Revise denúncias marcadas como suspeitas, duplicadas ou que caíram na faixa cinzenta.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : moderacoes.length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-200 p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-success-50 text-success-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-medium text-surface-900 mb-1">Fila Vazia!</h2>
          <p className="text-surface-500 max-w-md">
            Excelente trabalho. Não há nenhuma denúncia pendente de moderação no momento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {moderacoes.map((item) => (
            <ModerationCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
