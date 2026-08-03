/**
 * Serviço de dados acionáveis do dashboard.
 * 
 * Contém a base mock expandida (40+ pontos), ranking acionável,
 * insights contextuais e resolução de contexto por target.
 * Estruturado para substituição futura por queries reais.
 */

import type {
  ActionableItem,
  InsightItem,
  ContextResultItem,
  ContextResultResponse,
  ActionableTarget,
  CriticidadeLabel,
} from '@/types/operational';

// ═══════════════════════════════════════════════
// BASE MOCK EXPANDIDA — 40 pontos coerentes
// ═══════════════════════════════════════════════

export interface MockPonto {
  id: string;
  endereco: string;
  bairro: string;
  status: string;
  categoria: string;
  criticidade: number;
  criticidadeLabel: CriticidadeLabel;
  recorrente: boolean;
  confirmacoes: number;
  diasAtivo: number;
  volume: string;
  horarioPrincipal: string;
  lastOccurrenceAt: string;
}

const MOCK_PONTOS: MockPonto[] = [
  // ── Pirituba ──
  { id: 'PV-001', endereco: 'Rua Agostinho de Azevedo, 150', bairro: 'Pirituba', status: 'em_analise', categoria: 'Entulho', criticidade: 92, criticidadeLabel: 'Crítica', recorrente: true, confirmacoes: 8, diasAtivo: 45, volume: 'Grande', horarioPrincipal: 'Madrugada', lastOccurrenceAt: '2026-06-15' },
  { id: 'PV-003', endereco: 'Rua Doutor Joy Arruda, 50', bairro: 'Pirituba', status: 'confirmado', categoria: 'Lixo Doméstico', criticidade: 85, criticidadeLabel: 'Crítica', recorrente: true, confirmacoes: 12, diasAtivo: 34, volume: 'Médio', horarioPrincipal: 'Noite', lastOccurrenceAt: '2026-06-14' },
  { id: 'PV-005', endereco: 'Rua Silvestre Vasconcelos, 88', bairro: 'Pirituba', status: 'em_analise', categoria: 'Volumosos', criticidade: 68, criticidadeLabel: 'Alta', recorrente: true, confirmacoes: 6, diasAtivo: 31, volume: 'Grande', horarioPrincipal: 'Tarde', lastOccurrenceAt: '2026-06-13' },
  { id: 'PV-025', endereco: 'Rua José Pires, 180', bairro: 'Pirituba', status: 'novo', categoria: 'Entulho', criticidade: 45, criticidadeLabel: 'Média', recorrente: false, confirmacoes: 0, diasAtivo: 2, volume: 'Médio', horarioPrincipal: 'Manhã', lastOccurrenceAt: '2026-06-16' },
  { id: 'PV-033', endereco: 'Rua Cel. Francisco Amaro, 90', bairro: 'Pirituba', status: 'em_confirmacao', categoria: 'Entulho', criticidade: 35, criticidadeLabel: 'Média', recorrente: false, confirmacoes: 1, diasAtivo: 5, volume: 'Pequeno', horarioPrincipal: 'Manhã', lastOccurrenceAt: '2026-06-14' },
  { id: 'PV-041', endereco: 'Av. Benedito Lopes, 320', bairro: 'Pirituba', status: 'resolvido', categoria: 'Poda', criticidade: 15, criticidadeLabel: 'Baixa', recorrente: false, confirmacoes: 3, diasAtivo: 0, volume: 'Pequeno', horarioPrincipal: 'Manhã', lastOccurrenceAt: '2026-06-08' },
  { id: 'PV-042', endereco: 'Rua Itapecerica, 55', bairro: 'Pirituba', status: 'encaminhado', categoria: 'Recicláveis Misturados', criticidade: 52, criticidadeLabel: 'Alta', recorrente: false, confirmacoes: 4, diasAtivo: 12, volume: 'Médio', horarioPrincipal: 'Tarde', lastOccurrenceAt: '2026-06-11' },

  // ── Jd. Felicidade ──
  { id: 'PV-007', endereco: 'Av. Benedito de Luca, 400', bairro: 'Jd. Felicidade', status: 'em_confirmacao', categoria: 'Volumosos', criticidade: 78, criticidadeLabel: 'Crítica', recorrente: true, confirmacoes: 5, diasAtivo: 14, volume: 'Grande', horarioPrincipal: 'Noite', lastOccurrenceAt: '2026-06-17' },
  { id: 'PV-009', endereco: 'Rua das Acácias, 120', bairro: 'Jd. Felicidade', status: 'novo', categoria: 'Entulho', criticidade: 62, criticidadeLabel: 'Alta', recorrente: true, confirmacoes: 2, diasAtivo: 3, volume: 'Grande', horarioPrincipal: 'Madrugada', lastOccurrenceAt: '2026-06-17' },
  { id: 'PV-010', endereco: 'Trav. São Benedito, 30', bairro: 'Jd. Felicidade', status: 'confirmado', categoria: 'Lixo Doméstico', criticidade: 55, criticidadeLabel: 'Alta', recorrente: true, confirmacoes: 7, diasAtivo: 22, volume: 'Médio', horarioPrincipal: 'Noite', lastOccurrenceAt: '2026-06-12' },
  { id: 'PV-028', endereco: 'Rua Projetada 3, s/n', bairro: 'Jd. Felicidade', status: 'em_analise', categoria: 'Entulho', criticidade: 71, criticidadeLabel: 'Alta', recorrente: false, confirmacoes: 3, diasAtivo: 9, volume: 'Grande', horarioPrincipal: 'Tarde', lastOccurrenceAt: '2026-06-15' },
  { id: 'PV-044', endereco: 'Rua Manoel Vieira, 85', bairro: 'Jd. Felicidade', status: 'cancelado', categoria: 'Eletrônicos', criticidade: 10, criticidadeLabel: 'Baixa', recorrente: false, confirmacoes: 0, diasAtivo: 0, volume: 'Pequeno', horarioPrincipal: 'Manhã', lastOccurrenceAt: '2026-05-20' },

  // ── Vila Mangalot ──
  { id: 'PV-012', endereco: 'Rua Marcos Arruda, 220', bairro: 'Vila Mangalot', status: 'novo', categoria: 'Entulho', criticidade: 72, criticidadeLabel: 'Alta', recorrente: false, confirmacoes: 3, diasAtivo: 1, volume: 'Grande', horarioPrincipal: 'Madrugada', lastOccurrenceAt: '2026-06-17' },
  { id: 'PV-013', endereco: 'Rua Caiapós, 340', bairro: 'Vila Mangalot', status: 'em_confirmacao', categoria: 'Volumosos', criticidade: 58, criticidadeLabel: 'Alta', recorrente: true, confirmacoes: 4, diasAtivo: 8, volume: 'Grande', horarioPrincipal: 'Noite', lastOccurrenceAt: '2026-06-16' },
  { id: 'PV-029', endereco: 'Rua Campos Sales, 60', bairro: 'Vila Mangalot', status: 'resolvido', categoria: 'Lixo Doméstico', criticidade: 20, criticidadeLabel: 'Baixa', recorrente: false, confirmacoes: 5, diasAtivo: 0, volume: 'Pequeno', horarioPrincipal: 'Manhã', lastOccurrenceAt: '2026-06-05' },
  { id: 'PV-046', endereco: 'Av. Itaberaba, 1500', bairro: 'Vila Mangalot', status: 'em_analise', categoria: 'Resíduo de Saúde', criticidade: 88, criticidadeLabel: 'Crítica', recorrente: false, confirmacoes: 2, diasAtivo: 6, volume: 'Pequeno', horarioPrincipal: 'Manhã', lastOccurrenceAt: '2026-06-16' },

  // ── Jd. Santo Elias ──
  { id: 'PV-014', endereco: 'Rua Salvador Tolezano, 75', bairro: 'Jd. Santo Elias', status: 'em_confirmacao', categoria: 'Entulho', criticidade: 80, criticidadeLabel: 'Crítica', recorrente: true, confirmacoes: 6, diasAtivo: 18, volume: 'Grande', horarioPrincipal: 'Madrugada', lastOccurrenceAt: '2026-06-16' },
  { id: 'PV-015', endereco: 'Rua Barão de Tefé, 200', bairro: 'Jd. Santo Elias', status: 'novo', categoria: 'Poda', criticidade: 30, criticidadeLabel: 'Média', recorrente: false, confirmacoes: 0, diasAtivo: 1, volume: 'Médio', horarioPrincipal: 'Manhã', lastOccurrenceAt: '2026-06-18' },
  { id: 'PV-035', endereco: 'Rua Comendador Elias, 95', bairro: 'Jd. Santo Elias', status: 'encaminhado', categoria: 'Volumosos', criticidade: 42, criticidadeLabel: 'Média', recorrente: false, confirmacoes: 3, diasAtivo: 15, volume: 'Grande', horarioPrincipal: 'Tarde', lastOccurrenceAt: '2026-06-10' },

  // ── City Pinheirinho ──
  { id: 'PV-016', endereco: 'Rua Oscar Caravelas, 110', bairro: 'City Pinheirinho', status: 'confirmado', categoria: 'Entulho', criticidade: 65, criticidadeLabel: 'Alta', recorrente: true, confirmacoes: 9, diasAtivo: 28, volume: 'Grande', horarioPrincipal: 'Noite', lastOccurrenceAt: '2026-06-13' },
  { id: 'PV-017', endereco: 'Rua Pedro Ivo, 45', bairro: 'City Pinheirinho', status: 'novo', categoria: 'Lixo Doméstico', criticidade: 38, criticidadeLabel: 'Média', recorrente: false, confirmacoes: 1, diasAtivo: 3, volume: 'Pequeno', horarioPrincipal: 'Noite', lastOccurrenceAt: '2026-06-17' },
  { id: 'PV-036', endereco: 'Av. Pinheirinho, 800', bairro: 'City Pinheirinho', status: 'invalido', categoria: 'Recicláveis Misturados', criticidade: 12, criticidadeLabel: 'Baixa', recorrente: false, confirmacoes: 0, diasAtivo: 0, volume: 'Pequeno', horarioPrincipal: 'Tarde', lastOccurrenceAt: '2026-05-30' },

  // ── Parque São Domingos ──
  { id: 'PV-018', endereco: 'Travessa do Comércio, 15', bairro: 'Pq. São Domingos', status: 'encaminhado', categoria: 'Lixo Doméstico', criticidade: 55, criticidadeLabel: 'Alta', recorrente: false, confirmacoes: 4, diasAtivo: 20, volume: 'Médio', horarioPrincipal: 'Noite', lastOccurrenceAt: '2026-06-10' },
  { id: 'PV-019', endereco: 'Rua Santa Efigênia, 250', bairro: 'Pq. São Domingos', status: 'em_confirmacao', categoria: 'Eletrônicos', criticidade: 40, criticidadeLabel: 'Média', recorrente: false, confirmacoes: 2, diasAtivo: 7, volume: 'Pequeno', horarioPrincipal: 'Tarde', lastOccurrenceAt: '2026-06-15' },
  { id: 'PV-037', endereco: 'Rua Domingos Jorge, 170', bairro: 'Pq. São Domingos', status: 'novo', categoria: 'Volumosos', criticidade: 48, criticidadeLabel: 'Média', recorrente: false, confirmacoes: 0, diasAtivo: 2, volume: 'Grande', horarioPrincipal: 'Madrugada', lastOccurrenceAt: '2026-06-17' },

  // ── Jaraguá ──
  { id: 'PV-020', endereco: 'Estr. de Taipas, 1200', bairro: 'Jaraguá', status: 'confirmado', categoria: 'Entulho', criticidade: 76, criticidadeLabel: 'Crítica', recorrente: true, confirmacoes: 10, diasAtivo: 40, volume: 'Grande', horarioPrincipal: 'Madrugada', lastOccurrenceAt: '2026-06-11' },
  { id: 'PV-022', endereco: 'Rua Cabo João Soares, 85', bairro: 'Jaraguá', status: 'em_analise', categoria: 'Poda', criticidade: 32, criticidadeLabel: 'Média', recorrente: false, confirmacoes: 2, diasAtivo: 10, volume: 'Médio', horarioPrincipal: 'Manhã', lastOccurrenceAt: '2026-06-14' },
  { id: 'PV-039', endereco: 'Rua Araguaia, 300', bairro: 'Jaraguá', status: 'novo', categoria: 'Lixo Doméstico', criticidade: 42, criticidadeLabel: 'Média', recorrente: false, confirmacoes: 0, diasAtivo: 1, volume: 'Pequeno', horarioPrincipal: 'Noite', lastOccurrenceAt: '2026-06-18' },
  { id: 'PV-047', endereco: 'Av. Jaraguá, 600', bairro: 'Jaraguá', status: 'arquivado', categoria: 'Entulho', criticidade: 8, criticidadeLabel: 'Baixa', recorrente: false, confirmacoes: 1, diasAtivo: 0, volume: 'Pequeno', horarioPrincipal: 'Manhã', lastOccurrenceAt: '2026-04-10' },

  // ── Taipas ──
  { id: 'PV-021', endereco: 'Rua Padre Estêvão Pernet, 300', bairro: 'Taipas', status: 'em_confirmacao', categoria: 'Volumosos', criticidade: 48, criticidadeLabel: 'Média', recorrente: true, confirmacoes: 2, diasAtivo: 11, volume: 'Grande', horarioPrincipal: 'Tarde', lastOccurrenceAt: '2026-06-16' },
  { id: 'PV-023', endereco: 'Rua Monte Castelo, 40', bairro: 'Taipas', status: 'novo', categoria: 'Recicláveis Misturados', criticidade: 28, criticidadeLabel: 'Média', recorrente: false, confirmacoes: 0, diasAtivo: 2, volume: 'Pequeno', horarioPrincipal: 'Tarde', lastOccurrenceAt: '2026-06-17' },
  { id: 'PV-040', endereco: 'Rua São Roque, 120', bairro: 'Taipas', status: 'confirmado', categoria: 'Entulho', criticidade: 52, criticidadeLabel: 'Alta', recorrente: false, confirmacoes: 5, diasAtivo: 16, volume: 'Médio', horarioPrincipal: 'Noite', lastOccurrenceAt: '2026-06-10' },

  // ── Vila Zatt ──
  { id: 'PV-024', endereco: 'Avenida Mutinga, 2000', bairro: 'Vila Zatt', status: 'em_confirmacao', categoria: 'Volumosos', criticidade: 45, criticidadeLabel: 'Média', recorrente: false, confirmacoes: 1, diasAtivo: 9, volume: 'Médio', horarioPrincipal: 'Tarde', lastOccurrenceAt: '2026-06-14' },
  { id: 'PV-026', endereco: 'Rua Frei Tomé, 150', bairro: 'Vila Zatt', status: 'novo', categoria: 'Lixo Doméstico', criticidade: 35, criticidadeLabel: 'Média', recorrente: false, confirmacoes: 0, diasAtivo: 1, volume: 'Pequeno', horarioPrincipal: 'Noite', lastOccurrenceAt: '2026-06-18' },
  { id: 'PV-043', endereco: 'Rua Prof. Alberto Cardoso, 70', bairro: 'Vila Zatt', status: 'resolvido', categoria: 'Poda', criticidade: 18, criticidadeLabel: 'Baixa', recorrente: false, confirmacoes: 3, diasAtivo: 0, volume: 'Pequeno', horarioPrincipal: 'Manhã', lastOccurrenceAt: '2026-06-06' },

  // ── Pontos extras para variedade ──
  { id: 'PV-030', endereco: 'Av. Paula Ferreira, 500', bairro: 'Jd. Santo Elias', status: 'novo', categoria: 'Lixo Doméstico', criticidade: 30, criticidadeLabel: 'Média', recorrente: false, confirmacoes: 0, diasAtivo: 4, volume: 'Pequeno', horarioPrincipal: 'Noite', lastOccurrenceAt: '2026-06-15' },
  { id: 'PV-031', endereco: 'Rua Antonio Raposo, 420', bairro: 'Pirituba', status: 'novo', categoria: 'Eletrônicos', criticidade: 40, criticidadeLabel: 'Média', recorrente: false, confirmacoes: 1, diasAtivo: 3, volume: 'Pequeno', horarioPrincipal: 'Tarde', lastOccurrenceAt: '2026-06-16' },
  { id: 'PV-038', endereco: 'Rua Mário Cardim, 45', bairro: 'Jd. Santo Elias', status: 'em_confirmacao', categoria: 'Entulho', criticidade: 22, criticidadeLabel: 'Baixa', recorrente: false, confirmacoes: 1, diasAtivo: 7, volume: 'Pequeno', horarioPrincipal: 'Manhã', lastOccurrenceAt: '2026-06-12' },
  { id: 'PV-045', endereco: 'Rua Gen. Argolo, 200', bairro: 'Vila Mangalot', status: 'novo', categoria: 'Entulho', criticidade: 50, criticidadeLabel: 'Média', recorrente: false, confirmacoes: 0, diasAtivo: 1, volume: 'Médio', horarioPrincipal: 'Madrugada', lastOccurrenceAt: '2026-06-18' },
];

export { MOCK_PONTOS };

// ═══════════════════════════════════════════════
// Ranking Acionável
// ═══════════════════════════════════════════════

export function getActionableRanking(_periodo: string): ActionableItem[] {
  return [
    {
      id: 'action-01',
      kind: 'point',
      title: 'Ponto PV-001 exige atenção imediata',
      subtitle: 'Criticidade crítica, recorrência e atividade recente.',
      label: 'Prioridade alta',
      reason: 'É um ponto recorrente com 45 dias ativo, criticidade 92 e 8 confirmações comunitárias.',
      metric: { value: 92, label: 'Criticidade' },
      priorityLevel: 'prioritario',
      target: { type: 'point', pointId: 'PV-001', title: 'Detalhe do ponto PV-001' }
    },
    {
      id: 'action-02',
      kind: 'group',
      title: 'Pirituba concentra novos pontos no período',
      subtitle: 'O bairro registrou crescimento acima da média recente.',
      label: 'Atenção territorial',
      reason: 'O aumento recente indica pressão operacional concentrada na região.',
      metric: { value: 7, label: 'Pontos no bairro' },
      priorityLevel: 'prioritario',
      target: { type: 'group', filterKey: 'bairro', filterValue: 'Pirituba', title: 'Pontos em Pirituba' }
    },
    {
      id: 'action-03',
      kind: 'point',
      title: 'PV-046 — resíduo de saúde requer protocolo especial',
      subtitle: 'Material potencialmente perigoso em via pública.',
      label: 'Prioridade alta',
      reason: 'Resíduo de saúde detectado na Vila Mangalot com criticidade 88 — exige encaminhamento urgente.',
      metric: { value: 88, label: 'Criticidade' },
      priorityLevel: 'prioritario',
      target: { type: 'point', pointId: 'PV-046', title: 'Detalhe do ponto PV-046' }
    },
    {
      id: 'action-04',
      kind: 'group',
      title: 'Entulho lidera os registros ativos',
      subtitle: 'A categoria continua dominante entre os pontos do período.',
      label: 'Padrão categórico',
      reason: 'Entulho representa mais de 40% dos pontos ativos, concentrado em bairros com reincidência.',
      metric: { value: '43%', label: 'dos registros' },
      priorityLevel: 'atencao',
      target: { type: 'group', filterKey: 'categoria', filterValue: 'Entulho', title: 'Pontos de Entulho' }
    },
    {
      id: 'action-05',
      kind: 'group',
      title: 'Grupo de pontos em confirmação precisa acompanhamento',
      subtitle: '7 pontos aguardam validação da comunidade.',
      label: 'Fila operacional',
      reason: 'Os pontos em confirmação ainda representam uma parte relevante da fila operacional.',
      metric: { value: 7, label: 'Pontos' },
      priorityLevel: 'atencao',
      target: { type: 'group', filterKey: 'status', filterValue: 'em_confirmacao', title: 'Pontos em confirmação' }
    },
    {
      id: 'action-06',
      kind: 'group',
      title: 'Pontos recorrentes seguem concentrados no mesmo eixo',
      subtitle: 'Pirituba, Jd. Felicidade e Taipas concentram a reincidência.',
      label: 'Padrão recorrente',
      reason: 'Os bairros com maior reincidência já tinham histórico recente.',
      metric: { value: 11, label: 'Recorrentes' },
      priorityLevel: 'informativo',
      target: { type: 'group', filterKey: 'recorrente', filterValue: true, title: 'Pontos recorrentes' }
    },
    {
      id: 'action-07',
      kind: 'point',
      title: 'PV-020 acumula 40 dias ativo sem resolução',
      subtitle: 'Entulho de grande volume no Jaraguá, com 10 confirmações.',
      label: 'Tempo crítico',
      reason: 'Ponto ativo há mais tempo, criticidade crítica e confirmação elevada.',
      metric: { value: 40, label: 'Dias ativo' },
      priorityLevel: 'atencao',
      target: { type: 'point', pointId: 'PV-020', title: 'Detalhe do ponto PV-020' }
    },
  ];
}

// ═══════════════════════════════════════════════
// Insights Curtos
// ═══════════════════════════════════════════════

export function getActionableInsights(_periodo: string): InsightItem[] {
  return [
    {
      id: 'insight-01',
      category: 'reincidencia',
      priority: 'high',
      text: 'Os novos pontos cresceram mais em áreas onde o problema já era recorrente.',
      target: { type: 'group', filterKey: 'recorrente', filterValue: true, title: 'Pontos recorrentes' }
    },
    {
      id: 'insight-02',
      category: 'categoria_residuo',
      priority: 'high',
      text: 'Entulho continua sendo o tipo de descarte mais comum entre os pontos ativos.',
      target: { type: 'group', filterKey: 'categoria', filterValue: 'Entulho', title: 'Pontos de Entulho' }
    },
    {
      id: 'insight-03',
      category: 'criticidade',
      priority: 'medium',
      text: 'A maior parte dos pontos críticos ainda está concentrada em Pirituba e Jd. Felicidade.',
      target: { type: 'group', filterKey: 'bairro', filterValue: 'Pirituba', title: 'Pontos críticos em Pirituba' }
    },
    {
      id: 'insight-04',
      category: 'horario',
      priority: 'medium',
      text: 'Os registros do período indicam maior atividade no fim da tarde e à noite.',
    },
    {
      id: 'insight-05',
      category: 'status_operacional',
      priority: 'low',
      text: 'Os pontos em confirmação ainda representam uma parte importante da fila operacional.',
      target: { type: 'group', filterKey: 'status', filterValue: 'em_confirmacao', title: 'Pontos em confirmação' }
    },
    {
      id: 'insight-06',
      category: 'bairro',
      priority: 'medium',
      text: 'Vila Mangalot registrou um ponto de resíduo de saúde que exige protocolo diferenciado.',
      target: { type: 'point', pointId: 'PV-046', title: 'Detalhe do ponto PV-046' }
    },
  ];
}

// ═══════════════════════════════════════════════
// Resultado Contextual (por target)
// ═══════════════════════════════════════════════

function pontoToContextItem(p: MockPonto): ContextResultItem {
  return {
    id: p.id,
    label: p.id,
    endereco: p.endereco,
    bairro: p.bairro,
    status: p.status,
    criticidade: p.criticidade,
    criticidadeLabel: p.criticidadeLabel,
    recorrente: p.recorrente,
    categoria: p.categoria,
    lastOccurrenceAt: p.lastOccurrenceAt,
  };
}

export function getContextResults(target: ActionableTarget): ContextResultResponse {
  if (target.type === 'point') {
    const p = MOCK_PONTOS.find(m => m.id === target.pointId);
    return {
      title: target.title,
      subtitle: p ? `${p.endereco} — ${p.bairro}` : 'Ponto não encontrado.',
      total: p ? 1 : 0,
      items: p ? [pontoToContextItem(p)] : [],
    };
  }

  // Grupo
  let filtered: MockPonto[] = [];
  const key = target.filterKey;
  const val = target.filterValue;

  if (key === 'bairro') filtered = MOCK_PONTOS.filter(p => p.bairro === val);
  else if (key === 'categoria') filtered = MOCK_PONTOS.filter(p => p.categoria === String(val));
  else if (key === 'status') filtered = MOCK_PONTOS.filter(p => p.status === val);
  else if (key === 'recorrente') filtered = MOCK_PONTOS.filter(p => p.recorrente === true);
  else if (key === 'criticidade') filtered = MOCK_PONTOS.filter(p => p.criticidade >= 76);
  else filtered = MOCK_PONTOS;

  // Excluir resolvidos/arquivados/cancelados por padrão para grupos
  const activeStatuses = ['novo', 'em_confirmacao', 'confirmado', 'em_analise', 'encaminhado'];
  filtered = filtered.filter(p => activeStatuses.includes(p.status));

  return {
    title: target.title,
    subtitle: `Lista dos pontos que compõem este agrupamento.`,
    total: filtered.length,
    items: filtered.sort((a, b) => b.criticidade - a.criticidade).map(pontoToContextItem),
  };
}

export function getQuickPointSummary(pointId: string): MockPonto | null {
  return MOCK_PONTOS.find(p => p.id === pointId) || null;
}
