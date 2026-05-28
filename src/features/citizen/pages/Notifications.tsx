import { Card } from '@/components/ui';
import { Bell } from 'lucide-react';

export function Notifications() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-900">Notificações</h1>
        <p className="text-sm text-surface-500 mt-1">
          Alertas e atualizações sobre áreas que você acompanha.
        </p>
      </div>

      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
          <Bell className="w-7 h-7 text-primary-600" />
        </div>
        <h2 className="text-lg font-semibold text-surface-900 mb-2">
          Nenhuma notificação
        </h2>
        <p className="text-sm text-surface-500 max-w-sm">
          Quando houver atualizações sobre pontos que você acompanha ou
          denúncias que registrou, as notificações aparecerão aqui.
        </p>
      </Card>
    </div>
  );
}
