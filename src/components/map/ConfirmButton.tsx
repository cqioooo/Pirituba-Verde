import { useAuth } from '@/providers/AuthProvider';
import { useConfirmarPonto, useVerificarConfirmacao } from '@/services/queries';
import { Button } from '@/components/ui';
import { CheckCircle, ThumbsUp } from '@phosphor-icons/react';
import { useState } from 'react';

interface ConfirmButtonProps {
  pontoId: string;
  onSuccess?: () => void;
}

export function ConfirmButton({ pontoId, onSuccess }: ConfirmButtonProps) {
  const { user } = useAuth();
  const [justConfirmed, setJustConfirmed] = useState(false);
  
  // Queries
  const { data: jaConfirmou, isLoading: isLoadingVerificacao } = useVerificarConfirmacao(pontoId, user?.id);
  const { mutateAsync: confirmar, isPending } = useConfirmarPonto();

  if (!user || isLoadingVerificacao) {
    return null; // ou um skeleton se preferir
  }

  if (jaConfirmou || justConfirmed) {
    return (
      <div className="flex items-center justify-center gap-2 p-2.5 bg-success-50 text-success-700 rounded-lg border border-success-200">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Você já confirmou este ponto</span>
      </div>
    );
  }

  async function handleConfirm() {
    if (!user) return;
    try {
      await confirmar({
        ponto_id: pontoId,
        usuario_id: user.id,
        // No mundo real pegaríamos a geolocalização do usuário aqui,
        // Mas para simplificar vamos passar 0,0 ou pegar do hook depois
        latitude: 0,
        longitude: 0,
      });
      setJustConfirmed(true);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao confirmar:', error);
      alert('Não foi possível registrar a confirmação. Tente novamente.');
    }
  }

  return (
    <Button 
      variant="secondary" 
      fullWidth 
      size="sm" 
      icon={<ThumbsUp className="w-4 h-4" />}
      onClick={handleConfirm}
      loading={isPending}
    >
      Ainda está aqui? Confirmar
    </Button>
  );
}
