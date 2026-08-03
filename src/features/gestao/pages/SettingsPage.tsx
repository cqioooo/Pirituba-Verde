import { useConfiguracoes } from '@/services/queries';
import { Spinner, Card, Input } from '@/components/ui';
import { Gear, Lock } from '@phosphor-icons/react';

export function SettingsPage() {
  const { data: configs, isLoading } = useConfiguracoes();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Configurações do Sistema</h1>
        <p className="text-surface-500 text-sm mt-1">
          Parâmetros globais que afetam o comportamento da plataforma.
        </p>
      </div>

      <div className="bg-info-50 text-info-700 p-4 rounded-lg flex gap-3 border border-info-100">
        <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold">Modo Somente Leitura</p>
          <p>A edição de configurações pelo painel de gestão estará disponível na Fase 2 do projeto. Por enquanto, as alterações devem ser feitas diretamente no banco de dados.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-surface-100 pb-4">
            <Gear className="w-5 h-5 text-surface-400" />
            <h2 className="text-lg font-semibold text-surface-900">Parâmetros Atuais</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Raio Geofence (metros)"
              value={configs?.raio_geofence_metros || ''}
              disabled
              hint="Distância máxima permitida entre a localização atual e a selecionada."
            />
            <Input
              label="Raio Agrupamento (metros)"
              value={configs?.raio_agrupamento_metros || ''}
              disabled
              hint="Distância para agrupar pontos idênticos."
            />
            <Input
              label="Raio Faixa Cinzenta (metros)"
              value={configs?.raio_faixa_cinzenta_metros || ''}
              disabled
              hint="Distância para alertar sobre denúncia próxima."
            />
            <Input
              label="Confirmações para Validar"
              value={configs?.confirmacoes_para_validar || ''}
              disabled
              hint="Número de validações cidadãs para automatizar o status."
            />
            <Input
              label="Limite de Denúncias/Dia"
              value={configs?.limite_denuncias_por_dia || ''}
              disabled
              hint="Limite rate-limit por usuário."
            />
            <Input
              label="Dias Visibilidade Resolvido"
              value={configs?.dias_visibilidade_resolvido || ''}
              disabled
              hint="Dias que um ponto resolvido permanece no mapa cidadão."
            />
            <Input
              label="Ruído Geolocalização (metros)"
              value={configs?.ruido_geolocalizacao_metros || ''}
              disabled
              hint="Adição de ruído aleatório nas coordenadas públicas."
            />
          </div>
        </Card>
      )}
    </div>
  );
}
