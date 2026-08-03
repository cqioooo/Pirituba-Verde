// ═══════════════════════════════════════════════
// Tipos da Camada de Inteligência Operacional
// ═══════════════════════════════════════════════

export type OperationalAlertLevel = 'info' | 'warning' | 'priority';

export interface ScenarioSummary {
  title: string;
  headline: string;
  supportingText?: string;
}

export interface OperationalAlert {
  id: string;
  level: OperationalAlertLevel;
  title: string;
  description: string;
  relatedDimension?: string;
  relatedValue?: string | boolean;
}

export type CriticidadeLabel = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export interface PriorityRankingItem {
  id: string;
  label: string;
  endereco: string;
  bairro: string;
  status: string;
  criticidade: number;
  criticidadeLabel: CriticidadeLabel;
  recorrente: boolean;
  confirmacoes: number;
  priorityScore: number;
  reason: string;
}

export interface DrilldownState {
  isOpen: boolean;
  sourceChart: string;
  filterKey: string;
  filterValue: string;
  title: string;
}

export interface DrilldownItem {
  id: string;
  endereco: string;
  bairro: string;
  status: string;
  criticidade: number;
  criticidadeLabel: CriticidadeLabel;
  recorrente: boolean;
  lastOccurrenceAt: string;
}

export interface DrilldownResponse {
  title: string;
  subtitle: string;
  total: number;
  items: DrilldownItem[];
}

// ═══════════════════════════════════════════════
// Camada Acionável — Tipos
// ═══════════════════════════════════════════════

export type ActionableItemKind = 'point' | 'group';

export type ActionableTarget =
  | { type: 'point'; pointId: string; title: string }
  | { type: 'group'; filterKey: string; filterValue: string | boolean; title: string };

export interface ActionableItem {
  id: string;
  kind: ActionableItemKind;
  title: string;
  subtitle: string;
  label: string;
  reason: string;
  metric?: { value: number | string; label: string };
  priorityLevel: 'informativo' | 'atencao' | 'prioritario';
  target: ActionableTarget;
}

export type InsightPriority = 'low' | 'medium' | 'high';

export interface InsightItem {
  id: string;
  category: string;
  priority: InsightPriority;
  text: string;
  target?: ActionableTarget;
}

export interface ContextResultItem {
  id: string;
  label: string;
  endereco: string;
  bairro: string;
  status: string;
  criticidade: number;
  criticidadeLabel: CriticidadeLabel;
  recorrente: boolean;
  categoria?: string;
  lastOccurrenceAt?: string;
}

export interface ContextResultResponse {
  title: string;
  subtitle: string;
  total: number;
  items: ContextResultItem[];
}
