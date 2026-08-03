import { useState } from 'react';
import { Button, Modal, Textarea } from '@/components/ui';
import { POINT_STATUS_LABELS, STATUS_TRANSITIONS } from '@/types';
import type { StatusPonto } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { useUpdatePontoStatus } from '@/services/queries';

interface StatusActionsProps {
  pontoId: string;
  currentStatus: StatusPonto;
}

export function StatusActions({ pontoId, currentStatus }: StatusActionsProps) {
  const { user } = useAuth();
  const { mutateAsync: updateStatus, isPending } = useUpdatePontoStatus();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<StatusPonto | null>(null);
  const [motivo, setMotivo] = useState('');

  const availableTransitions = STATUS_TRANSITIONS[currentStatus] || [];

  if (availableTransitions.length === 0) {
    return null; // Nenhuma ação disponível
  }

  const handleActionClick = (status: StatusPonto) => {
    setTargetStatus(status);
    setMotivo('');
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!targetStatus || !user) return;
    
    try {
      await updateStatus({
        id: pontoId,
        status: targetStatus,
        motivo: motivo.trim() || undefined,
        alteradoPor: user.id
      });
      setModalOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Ocorreu um erro ao atualizar o status.');
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {availableTransitions.map((status) => (
          <Button
            key={status}
            variant="outline"
            size="sm"
            onClick={() => handleActionClick(status)}
          >
            Mudar para {POINT_STATUS_LABELS[status]}
          </Button>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => !isPending && setModalOpen(false)}
        title={`Alterar status para ${targetStatus ? POINT_STATUS_LABELS[targetStatus] : ''}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} loading={isPending}>
              Confirmar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-surface-600">
            Você está prestes a alterar o status deste ponto. Opcionalmente, adicione um motivo ou observação para ficar registrado no histórico.
          </p>
          <Textarea
            label="Motivo / Observação (opcional)"
            placeholder="Ex: Equipe de limpeza já foi acionada..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            disabled={isPending}
            rows={3}
          />
        </div>
      </Modal>
    </>
  );
}
