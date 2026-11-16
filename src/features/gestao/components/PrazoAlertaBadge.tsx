import { Clock, Warning, WarningCircle } from '@phosphor-icons/react';
import { Alert, Badge } from '@/components/ui';
import { calcularAlertaPrazo, formatarMensagemAlertaPrazo } from '@/lib/prazoAlerta';
import { useConfiguracoes } from '@/services/queries';
import type { StatusOcorrencia } from '@/types';

interface PrazoAlertaBadgeProps {
  prazoResolucao: string | null | undefined;
  statusOcorrencia: StatusOcorrencia;
  /** `badge` para cards da fila; `banner` para o detalhe da ocorrência. */
  variant?: 'badge' | 'banner';
  className?: string;
}

/**
 * Alerta visual de prazo baseado nos dias configurados em `configuracoes_sistema`
 * e no campo `prazo_resolucao` da ocorrência.
 */
export function PrazoAlertaBadge({
  prazoResolucao,
  statusOcorrencia,
  variant = 'badge',
  className,
}: PrazoAlertaBadgeProps) {
  const { data: configs } = useConfiguracoes();

  const alerta = calcularAlertaPrazo({
    prazoResolucao,
    statusOcorrencia,
    config: {
      diasAlerta: configs?.alerta_prazo_dias ?? [],
      cicloDias: configs?.prazo_ciclo_dias ?? null,
    },
  });

  if (!alerta) return null;

  const { titulo, descricao } = formatarMensagemAlertaPrazo(alerta);

  if (variant === 'banner') {
    return (
      <Alert
        variant={alerta.nivel === 'atencao' ? 'warning' : 'error'}
        title={titulo}
        className={className}
      >
        <p>{descricao}</p>
      </Alert>
    );
  }

  const badgeVariant = alerta.nivel === 'atencao' ? 'warning' : 'danger';
  const BadgeIcon =
    alerta.nivel === 'vencido'
      ? WarningCircle
      : alerta.nivel === 'critico'
        ? Warning
        : Clock;

  const textoCurto =
    alerta.nivel === 'vencido'
      ? `Prazo vencido (${Math.abs(alerta.diasRestantes)}d)`
      : `Alerta ${alerta.diaAlerta ?? alerta.diaCiclo}º dia · ${
          alerta.diasRestantes === 0
            ? 'vence hoje'
            : `${alerta.diasRestantes}d restantes`
        }`;

  return (
    <Badge
      variant={badgeVariant}
      title={`${titulo} — ${descricao}`}
      className={className}
    >
      <BadgeIcon className="mr-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{textoCurto}</span>
    </Badge>
  );
}
