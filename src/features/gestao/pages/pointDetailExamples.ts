import type { OcorrenciaDetailData } from '../components/OcorrenciaDetailView';

// Fixtures de apresentação dos quatro pontos mock da lista. Não representam registros reais.
interface DetailExample {
  data: OcorrenciaDetailData;
  denuncias: number;
  confirmacoes: number;
  eventos: { data: string; titulo: string; descricao: string }[];
}

export const pointDetailExamples: Record<string, DetailExample> = {
  'mock-1': {
    data: {
      ponto: { id: 'mock-1', endereco: 'Rua Agostinho de Azevedo, 150', bairro: 'Jd. Felicidade', status: 'novo' },
      ocorrencia: { id: 'demo-oc-1', categoria_principal: 'entulho', tipo_residuo: 'Restos de construção, tijolos e concreto', status: 'pendente', data_registro: '2026-06-15T08:30:00Z', frequencia_percebida: 'semanal', volume_estimado: 'grande', horario_percebido: 'madrugada', descricao: 'Exemplo fictício: restos de obra acumulados junto à calçada, dificultando a passagem de pedestres. Há sacos de cimento, pedaços de tijolo e concreto. O descarte foi percebido novamente após o fim de semana.' },
    },
    denuncias: 4, confirmacoes: 3,
    eventos: [
      { data: '01/06/2026 · 07:00', titulo: 'Ponto registrado · Novo', descricao: 'Registro inicial de exemplo recebido para avaliação.' },
      { data: '15/06/2026 · 05:30', titulo: 'Nova denúncia recebida', descricao: 'Relato fictício adicionado ao ponto. A ocorrência segue pendente de análise humana.' },
    ],
  },
  'mock-2': {
    data: {
      ponto: { id: 'mock-2', endereco: 'Avenida Mutinga, 2000', bairro: 'Vila Zatt', status: 'em_confirmacao' },
      ocorrencia: { id: 'demo-oc-2', categoria_principal: 'volumoso', tipo_residuo: 'Sofá e armários desmontados', status: 'pendente', data_registro: '2026-06-10T14:00:00Z', frequencia_percebida: 'Mensal', volume_estimado: 'medio', horario_percebido: 'tarde', descricao: 'Exemplo fictício: sofá de dois lugares e peças de armário deixados próximos ao passeio. Parte da calçada permanece ocupada, obrigando pedestres a desviar. Não foi possível identificar quando os objetos foram deixados.' },
    },
    denuncias: 1, confirmacoes: 1,
    eventos: [
      { data: '10/06/2026 · 11:00', titulo: 'Denúncia registrada', descricao: 'Exemplo de relato sobre móveis descartados.' },
      { data: '10/06/2026 · 15:00', titulo: 'Ponto aguardando confirmações', descricao: 'Cenário demonstrativo com uma confirmação externa.' },
    ],
  },
  'mock-3': {
    data: {
      ponto: { id: 'mock-3', endereco: 'Rua Doutor Joy Arruda, 50', bairro: 'Pirituba', status: 'confirmado' },
      ocorrencia: { id: 'demo-oc-3', categoria_principal: 'domiciliar', tipo_residuo: 'Sacos de lixo doméstico', status: 'aprovada', data_registro: '2026-06-14T21:00:00Z', frequencia_percebida: 'diaria', volume_estimado: 'pequeno', horario_percebido: 'noite', descricao: 'Exemplo fictício: sacos de lixo depositados fora do horário de coleta. Alguns estão abertos e há resíduos espalhados junto ao meio-fio. O relato menciona odor e repetição do descarte durante a semana.' },
    },
    denuncias: 8, confirmacoes: 12,
    eventos: [
      { data: '15/05/2026 · 17:00', titulo: 'Ponto registrado', descricao: 'Primeiro relato do cenário de demonstração.' },
      { data: '14/06/2026 · 18:00', titulo: 'Ocorrência aprovada · exemplo', descricao: 'Equipe de gestão (fictícia): relato considerado pertinente para acompanhamento.' },
      { data: '14/06/2026 · 18:30', titulo: 'Ponto confirmado', descricao: 'Estado simulado para visualizar o badge e o histórico. Não houve alteração no banco.' },
    ],
  },
  'mock-4': {
    data: {
      ponto: { id: 'mock-4', endereco: 'Rua Professor José Jorge, 100', bairro: 'Pirituba', status: 'resolvido' },
      ocorrencia: { id: 'demo-oc-4', categoria_principal: 'Eletrônicos', tipo_residuo: 'Televisão e monitores', status: 'aprovada', data_registro: '2026-05-25T11:00:00Z', frequencia_percebida: 'ocasional', volume_estimado: 'pequeno', horario_percebido: 'manha', descricao: 'Exemplo fictício: televisão antiga e dois monitores abandonados ao lado da calçada. O cenário representa um ponto que já recebeu atendimento, mantendo o registro original disponível para consulta.' },
    },
    denuncias: 2, confirmacoes: 5,
    eventos: [
      { data: '20/05/2026 · 06:00', titulo: 'Ponto registrado', descricao: 'Relato fictício de descarte de equipamentos eletrônicos.' },
      { data: '25/05/2026 · 08:00', titulo: 'Novo relato associado', descricao: 'Segundo registro de exemplo recebido no mesmo ponto.' },
      { data: '28/05/2026 · 07:00', titulo: 'Ponto resolvido · exemplo', descricao: 'Equipe de gestão (fictícia): retirada simulada dos equipamentos. A evidência real de resolução não está implementada nesta demonstração.' },
    ],
  },
};
