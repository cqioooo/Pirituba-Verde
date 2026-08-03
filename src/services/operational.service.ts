import type { ScenarioSummary, OperationalAlert, PriorityRankingItem, DrilldownResponse } from '@/types/operational';

// ═══════════════════════════════════════════════
// Resumo do Cenário
// ═══════════════════════════════════════════════

const scenariosByPeriod: Record<string, ScenarioSummary> = {
  'hoje': {
    title: 'Resumo de hoje',
    headline: 'Até o momento, 3 novos pontos foram registrados e 2 pontos críticos seguem sem atualização.',
    supportingText: 'A maior movimentação está concentrada no Jd. Felicidade, com registros recorrentes.'
  },
  '7d': {
    title: 'Resumo dos últimos 7 dias',
    headline: 'Nos últimos 7 dias, houve aumento de novos pontos em Pirituba, com concentração maior em áreas recorrentes.',
    supportingText: 'A reincidência cresceu mais do que os novos registros, indicando repetição do problema em áreas já conhecidas.'
  },
  '30d': {
    title: 'Resumo dos últimos 30 dias',
    headline: 'O período mostra estabilidade geral, mas os pontos críticos seguem concentrados em poucos locais.',
    supportingText: 'Entulho lidera as categorias com 58% dos registros. A taxa de confirmação comunitária se manteve em 68%.'
  },
  '90d': {
    title: 'Resumo do trimestre',
    headline: 'Os dados do trimestre indicam maior pressão operacional em pontos já confirmados e em análise.',
    supportingText: 'Vila Zatt e Jd. Felicidade concentram 60% dos registros recorrentes do período.'
  },
};

export function getScenarioSummary(periodo: string): ScenarioSummary {
  return scenariosByPeriod[periodo] || scenariosByPeriod['30d'];
}

// ═══════════════════════════════════════════════
// Alertas Operacionais
// ═══════════════════════════════════════════════

const alertsByPeriod: Record<string, OperationalAlert[]> = {
  'hoje': [
    {
      id: 'alert-hoje-1',
      level: 'priority',
      title: 'Pontos críticos sem atualização',
      description: '2 pontos com criticidade acima de 80 não receberam movimentação hoje.',
      relatedDimension: 'criticidade',
      relatedValue: 'crítica'
    },
    {
      id: 'alert-hoje-2',
      level: 'info',
      title: 'Novos registros matinais',
      description: '3 novos pontos foram registrados antes das 10h, concentrados em Pirituba.',
      relatedDimension: 'bairro',
      relatedValue: 'Pirituba'
    }
  ],
  '7d': [
    {
      id: 'alert-7d-1',
      level: 'priority',
      title: 'Aumento de novos pontos',
      description: 'Pirituba registrou aumento de 35% em novos pontos nos últimos 7 dias.',
      relatedDimension: 'bairro',
      relatedValue: 'Pirituba'
    },
    {
      id: 'alert-7d-2',
      level: 'warning',
      title: 'Reincidência em alta',
      description: 'A taxa de reincidência subiu no período atual, concentrada em pontos já conhecidos.',
      relatedDimension: 'recorrente',
      relatedValue: 'true'
    },
    {
      id: 'alert-7d-3',
      level: 'info',
      title: 'Entulho predominante',
      description: 'Entulho voltou a liderar os registros, representando 58% das ocorrências da semana.',
      relatedDimension: 'categoria',
      relatedValue: 'Entulho'
    },
    {
      id: 'alert-7d-4',
      level: 'priority',
      title: 'Pontos críticos ativos',
      description: '4 pontos críticos seguem ativos e exigem acompanhamento prioritário.',
      relatedDimension: 'criticidade',
      relatedValue: 'crítica'
    }
  ],
  '30d': [
    {
      id: 'alert-30d-1',
      level: 'warning',
      title: 'Queda na confirmação comunitária',
      description: 'A taxa de confirmação caiu 5 pontos percentuais em relação ao mês anterior.',
      relatedDimension: 'confirmacao'
    },
    {
      id: 'alert-30d-2',
      level: 'priority',
      title: 'Concentração de reincidência',
      description: 'Jd. Felicidade concentra 40% dos pontos recorrentes do mês.',
      relatedDimension: 'bairro',
      relatedValue: 'Jd. Felicidade'
    },
    {
      id: 'alert-30d-3',
      level: 'info',
      title: 'Estabilidade de novos registros',
      description: 'A média diária de novos pontos se manteve estável em relação ao período anterior.',
      relatedDimension: 'novos_pontos'
    },
    {
      id: 'alert-30d-4',
      level: 'warning',
      title: 'Descarte noturno persistente',
      description: '62% dos registros continuam ocorrendo entre 18h e 06h.',
      relatedDimension: 'faixa_horaria',
      relatedValue: 'Noite'
    }
  ],
  '90d': [
    {
      id: 'alert-90d-1',
      level: 'priority',
      title: 'Padrão sazonal identificado',
      description: 'O volume de registros cresceu 20% nos últimos 30 dias em comparação ao início do trimestre.',
      relatedDimension: 'tendencia'
    },
    {
      id: 'alert-90d-2',
      level: 'warning',
      title: 'Áreas críticas sem resolução',
      description: '3 pontos críticos estão ativos há mais de 60 dias sem mudança de status.',
      relatedDimension: 'criticidade',
      relatedValue: 'crítica'
    },
    {
      id: 'alert-90d-3',
      level: 'info',
      title: 'Crescimento de confirmações',
      description: 'O número de confirmações comunitárias cresceu 15% no trimestre.',
      relatedDimension: 'confirmacao'
    }
  ]
};

export function getOperationalAlerts(periodo: string): OperationalAlert[] {
  return alertsByPeriod[periodo] || alertsByPeriod['30d'];
}

// ═══════════════════════════════════════════════
// Ranking de Prioridade
// ═══════════════════════════════════════════════

const priorityRankingData: PriorityRankingItem[] = [
  {
    id: 'pv-001',
    label: 'PV-001',
    endereco: 'Rua Agostinho de Azevedo, 150',
    bairro: 'Jd. Felicidade',
    status: 'em_analise',
    criticidade: 92,
    criticidadeLabel: 'Crítica',
    recorrente: true,
    confirmacoes: 8,
    priorityScore: 96,
    reason: 'Alta criticidade e reincidência contínua no período.'
  },
  {
    id: 'pv-003',
    label: 'PV-003',
    endereco: 'Rua Doutor Joy Arruda, 50',
    bairro: 'Pirituba',
    status: 'confirmado',
    criticidade: 85,
    criticidadeLabel: 'Crítica',
    recorrente: true,
    confirmacoes: 12,
    priorityScore: 91,
    reason: 'Ponto recorrente com maior número de confirmações do período.'
  },
  {
    id: 'pv-007',
    label: 'PV-007',
    endereco: 'Av. Benedito de Luca, 400',
    bairro: 'Jd. Felicidade',
    status: 'em_confirmacao',
    criticidade: 78,
    criticidadeLabel: 'Crítica',
    recorrente: true,
    confirmacoes: 5,
    priorityScore: 84,
    reason: 'Concentra ocorrências recentes e segue sem encaminhamento.'
  },
  {
    id: 'pv-012',
    label: 'PV-012',
    endereco: 'Rua Marcos Arruda, 220',
    bairro: 'Vila Zatt',
    status: 'novo',
    criticidade: 72,
    criticidadeLabel: 'Alta',
    recorrente: false,
    confirmacoes: 3,
    priorityScore: 75,
    reason: 'Ponto novo com alta criticidade, próximo de área escolar.'
  },
  {
    id: 'pv-005',
    label: 'PV-005',
    endereco: 'Rua Silvestre Vasconcelos, 88',
    bairro: 'Pirituba',
    status: 'em_analise',
    criticidade: 68,
    criticidadeLabel: 'Alta',
    recorrente: true,
    confirmacoes: 6,
    priorityScore: 72,
    reason: 'Ponto ativo há mais de 30 dias, ainda sem resolução.'
  },
  {
    id: 'pv-018',
    label: 'PV-018',
    endereco: 'Travessa do Comércio, 15',
    bairro: 'Jd. São Carlos',
    status: 'encaminhado',
    criticidade: 55,
    criticidadeLabel: 'Alta',
    recorrente: false,
    confirmacoes: 4,
    priorityScore: 62,
    reason: 'Está entre os pontos com maior pressão operacional do período.'
  },
  {
    id: 'pv-021',
    label: 'PV-021',
    endereco: 'Rua Padre Estêvão Pernet, 300',
    bairro: 'Vila Zatt',
    status: 'em_confirmacao',
    criticidade: 48,
    criticidadeLabel: 'Média',
    recorrente: true,
    confirmacoes: 2,
    priorityScore: 55,
    reason: 'Reincidência identificada com confirmações crescentes.'
  }
];

export function getPriorityRanking(_periodo: string): PriorityRankingItem[] {
  return priorityRankingData;
}

// ═══════════════════════════════════════════════
// Drill-down
// ═══════════════════════════════════════════════

const drilldownDatabase: Record<string, DrilldownResponse> = {
  'status::novo': {
    title: 'Pontos com status Novo',
    subtitle: 'Pontos registrados recentemente que ainda não foram analisados.',
    total: 3,
    items: [
      { id: 'pv-012', endereco: 'Rua Marcos Arruda, 220', bairro: 'Vila Zatt', status: 'novo', criticidade: 72, criticidadeLabel: 'Alta', recorrente: false, lastOccurrenceAt: '2026-06-17' },
      { id: 'pv-025', endereco: 'Rua José Pires, 180', bairro: 'Pirituba', status: 'novo', criticidade: 45, criticidadeLabel: 'Média', recorrente: false, lastOccurrenceAt: '2026-06-16' },
      { id: 'pv-030', endereco: 'Av. Paula Ferreira, 500', bairro: 'Jd. São Carlos', status: 'novo', criticidade: 30, criticidadeLabel: 'Média', recorrente: false, lastOccurrenceAt: '2026-06-15' },
    ]
  },
  'status::em confirmacao': {
    title: 'Pontos em Confirmação',
    subtitle: 'Pontos aguardando confirmação da comunidade.',
    total: 4,
    items: [
      { id: 'pv-007', endereco: 'Av. Benedito de Luca, 400', bairro: 'Jd. Felicidade', status: 'em_confirmacao', criticidade: 78, criticidadeLabel: 'Crítica', recorrente: true, lastOccurrenceAt: '2026-06-17' },
      { id: 'pv-021', endereco: 'Rua Padre Estêvão Pernet, 300', bairro: 'Vila Zatt', status: 'em_confirmacao', criticidade: 48, criticidadeLabel: 'Média', recorrente: true, lastOccurrenceAt: '2026-06-16' },
      { id: 'pv-033', endereco: 'Rua Cel. Francisco Amaro, 90', bairro: 'Pirituba', status: 'em_confirmacao', criticidade: 35, criticidadeLabel: 'Média', recorrente: false, lastOccurrenceAt: '2026-06-14' },
      { id: 'pv-038', endereco: 'Rua Mário Cardim, 45', bairro: 'Jd. São Carlos', status: 'em_confirmacao', criticidade: 22, criticidadeLabel: 'Baixa', recorrente: false, lastOccurrenceAt: '2026-06-12' },
    ]
  },
  'status::confirmado': {
    title: 'Pontos Confirmados',
    subtitle: 'Pontos validados pela comunidade.',
    total: 2,
    items: [
      { id: 'pv-003', endereco: 'Rua Doutor Joy Arruda, 50', bairro: 'Pirituba', status: 'confirmado', criticidade: 85, criticidadeLabel: 'Crítica', recorrente: true, lastOccurrenceAt: '2026-06-14' },
      { id: 'pv-040', endereco: 'Rua São Roque, 120', bairro: 'Vila Zatt', status: 'confirmado', criticidade: 52, criticidadeLabel: 'Alta', recorrente: false, lastOccurrenceAt: '2026-06-10' },
    ]
  },
  'status::em analise': {
    title: 'Pontos em Análise',
    subtitle: 'Pontos sob avaliação da gestão.',
    total: 2,
    items: [
      { id: 'pv-001', endereco: 'Rua Agostinho de Azevedo, 150', bairro: 'Jd. Felicidade', status: 'em_analise', criticidade: 92, criticidadeLabel: 'Crítica', recorrente: true, lastOccurrenceAt: '2026-06-15' },
      { id: 'pv-005', endereco: 'Rua Silvestre Vasconcelos, 88', bairro: 'Pirituba', status: 'em_analise', criticidade: 68, criticidadeLabel: 'Alta', recorrente: true, lastOccurrenceAt: '2026-06-13' },
    ]
  },
  'categoria::Entulho': {
    title: 'Pontos da categoria Entulho',
    subtitle: 'Pontos onde o resíduo predominante é entulho de construção.',
    total: 5,
    items: [
      { id: 'pv-001', endereco: 'Rua Agostinho de Azevedo, 150', bairro: 'Jd. Felicidade', status: 'em_analise', criticidade: 92, criticidadeLabel: 'Crítica', recorrente: true, lastOccurrenceAt: '2026-06-15' },
      { id: 'pv-012', endereco: 'Rua Marcos Arruda, 220', bairro: 'Vila Zatt', status: 'novo', criticidade: 72, criticidadeLabel: 'Alta', recorrente: false, lastOccurrenceAt: '2026-06-17' },
      { id: 'pv-025', endereco: 'Rua José Pires, 180', bairro: 'Pirituba', status: 'novo', criticidade: 45, criticidadeLabel: 'Média', recorrente: false, lastOccurrenceAt: '2026-06-16' },
      { id: 'pv-033', endereco: 'Rua Cel. Francisco Amaro, 90', bairro: 'Pirituba', status: 'em_confirmacao', criticidade: 35, criticidadeLabel: 'Média', recorrente: false, lastOccurrenceAt: '2026-06-14' },
      { id: 'pv-038', endereco: 'Rua Mário Cardim, 45', bairro: 'Jd. São Carlos', status: 'em_confirmacao', criticidade: 22, criticidadeLabel: 'Baixa', recorrente: false, lastOccurrenceAt: '2026-06-12' },
    ]
  },
  'categoria::Móveis': {
    title: 'Pontos da categoria Móveis',
    subtitle: 'Pontos com descarte de móveis e volumosos.',
    total: 3,
    items: [
      { id: 'pv-007', endereco: 'Av. Benedito de Luca, 400', bairro: 'Jd. Felicidade', status: 'em_confirmacao', criticidade: 78, criticidadeLabel: 'Crítica', recorrente: true, lastOccurrenceAt: '2026-06-17' },
      { id: 'pv-021', endereco: 'Rua Padre Estêvão Pernet, 300', bairro: 'Vila Zatt', status: 'em_confirmacao', criticidade: 48, criticidadeLabel: 'Média', recorrente: true, lastOccurrenceAt: '2026-06-16' },
      { id: 'pv-040', endereco: 'Rua São Roque, 120', bairro: 'Vila Zatt', status: 'confirmado', criticidade: 52, criticidadeLabel: 'Alta', recorrente: false, lastOccurrenceAt: '2026-06-10' },
    ]
  },
  'categoria::Lixo Doméstico': {
    title: 'Pontos da categoria Lixo Doméstico',
    subtitle: 'Pontos com descarte de lixo doméstico irregular.',
    total: 2,
    items: [
      { id: 'pv-003', endereco: 'Rua Doutor Joy Arruda, 50', bairro: 'Pirituba', status: 'confirmado', criticidade: 85, criticidadeLabel: 'Crítica', recorrente: true, lastOccurrenceAt: '2026-06-14' },
      { id: 'pv-030', endereco: 'Av. Paula Ferreira, 500', bairro: 'Jd. São Carlos', status: 'novo', criticidade: 30, criticidadeLabel: 'Média', recorrente: false, lastOccurrenceAt: '2026-06-15' },
    ]
  },
  'recorrencia::Jd. Felicidade': {
    title: 'Pontos recorrentes em Jd. Felicidade',
    subtitle: 'Pontos com histórico de reincidência neste bairro.',
    total: 2,
    items: [
      { id: 'pv-001', endereco: 'Rua Agostinho de Azevedo, 150', bairro: 'Jd. Felicidade', status: 'em_analise', criticidade: 92, criticidadeLabel: 'Crítica', recorrente: true, lastOccurrenceAt: '2026-06-15' },
      { id: 'pv-007', endereco: 'Av. Benedito de Luca, 400', bairro: 'Jd. Felicidade', status: 'em_confirmacao', criticidade: 78, criticidadeLabel: 'Crítica', recorrente: true, lastOccurrenceAt: '2026-06-17' },
    ]
  },
  'recorrencia::Vila Zatt': {
    title: 'Pontos recorrentes em Vila Zatt',
    subtitle: 'Pontos com histórico de reincidência neste bairro.',
    total: 1,
    items: [
      { id: 'pv-021', endereco: 'Rua Padre Estêvão Pernet, 300', bairro: 'Vila Zatt', status: 'em_confirmacao', criticidade: 48, criticidadeLabel: 'Média', recorrente: true, lastOccurrenceAt: '2026-06-16' },
    ]
  },
  'recorrencia::Pirituba': {
    title: 'Pontos recorrentes em Pirituba',
    subtitle: 'Pontos com histórico de reincidência neste bairro.',
    total: 2,
    items: [
      { id: 'pv-003', endereco: 'Rua Doutor Joy Arruda, 50', bairro: 'Pirituba', status: 'confirmado', criticidade: 85, criticidadeLabel: 'Crítica', recorrente: true, lastOccurrenceAt: '2026-06-14' },
      { id: 'pv-005', endereco: 'Rua Silvestre Vasconcelos, 88', bairro: 'Pirituba', status: 'em_analise', criticidade: 68, criticidadeLabel: 'Alta', recorrente: true, lastOccurrenceAt: '2026-06-13' },
    ]
  },
};

export function getChartDrilldownData(sourceChart: string, filterValue: string): DrilldownResponse {
  const key = `${sourceChart}::${filterValue}`;
  return drilldownDatabase[key] || {
    title: `Pontos: ${filterValue}`,
    subtitle: 'Lista dos pontos que compõem este agrupamento.',
    total: 0,
    items: []
  };
}
