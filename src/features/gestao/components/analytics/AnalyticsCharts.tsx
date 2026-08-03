import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell
} from 'recharts';
import { Spinner } from '@/components/ui';

// Paleta de cores para os status
const STATUS_COLORS: Record<string, string> = {
  'novo': '#F59E0B',
  'em confirmacao': '#3B82F6',
  'confirmado': '#10B981',
  'em analise': '#8B5CF6',
  'encaminhado': '#6366F1',
  'resolvido': '#14B8A6',
  'invalido': '#EF4444',
  'cancelado': '#64748B',
  'arquivado': '#94A3B8'
};

const CRIT_COLORS: Record<string, string> = {
  'Baixa': '#8ea37b',
  'Média': '#b08b3c',
  'Alta': '#b65a2b',
  'Crítica': '#8b2e2e',
};

export function ChartWrapper({ title, subtitle, isLoading, isEmpty, children }: any) {
  return (
    <div className="flex flex-col h-80 py-6">
      <div className="mb-4">
        <h3 className="font-medium text-surface-900 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-surface-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex-1 w-full min-h-0 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white/80 flex flex-col items-center justify-center">
            <Spinner />
          </div>
        )}
        {!isLoading && isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-surface-400">
            Sem dados para o filtro atual
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// 1. Evolução de novos pontos no tempo
export function NewPointsTimeSeriesChart({ data, isLoading }: any) {
  return (
    <ChartWrapper title="Evolução de Novos Pontos" subtitle="Surgimento ao longo do tempo" isLoading={isLoading} isEmpty={!data?.length}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -20 }}>
          <defs>
            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5c7a47" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#5c7a47" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Area type="monotone" dataKey="value" name="Novos Pontos" stroke="#5c7a47" fillOpacity={1} fill="url(#colorVal)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// 2. Distribuição operacional por status
export function StatusDistributionChart({ data, isLoading, onBarClick }: any) {
  return (
    <ChartWrapper title="Distribuição por Status" subtitle="Situação atual dos pontos" isLoading={isLoading} isEmpty={!data?.length}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10 }} onClick={(e: any) => { if (e?.activePayload?.[0]) onBarClick?.(e.activePayload[0].payload); }}>
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} width={100} />
          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Bar dataKey="value" name="Quantidade" radius={[0, 4, 4, 0]} className="cursor-pointer">
            {data?.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.label.toLowerCase()] || '#94A3B8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// 3. Resíduos por categoria
export function CategoryDistributionChart({ data, isLoading, onBarClick }: any) {
  return (
    <ChartWrapper title="Resíduos por Categoria" subtitle="Categorias mais frequentes" isLoading={isLoading} isEmpty={!data?.length}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -20, bottom: 20 }} onClick={(e: any) => { if (e?.activePayload?.[0]) onBarClick?.(e.activePayload[0].payload); }}>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} angle={-45} textAnchor="end" height={60} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Bar dataKey="value" name="Pontos" fill="#8ea37b" radius={[4, 4, 0, 0]} className="cursor-pointer" />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// 4. Reincidência por bairro
export function RecurrenceByNeighborhoodChart({ data, isLoading, onBarClick }: any) {
  return (
    <ChartWrapper title="Reincidência por Bairro" subtitle="Onde o problema mais retorna" isLoading={isLoading} isEmpty={!data?.length}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10 }} onClick={(e: any) => { if (e?.activePayload?.[0]) onBarClick?.(e.activePayload[0].payload); }}>
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} width={100} />
          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Bar dataKey="value" name="Pontos Recorrentes" fill="#b65a2b" radius={[0, 4, 4, 0]} className="cursor-pointer" />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// 5. Destaques de criticidade (Bar Chart)
export function CriticalityHighlightsChart({ data, isLoading }: any) {
  return (
    <ChartWrapper title="Destaques de Criticidade" subtitle="Pontos com maior score" isLoading={isLoading} isEmpty={!data?.length}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} width={120} />
          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Bar dataKey="value" name="Score" fill="#8b2e2e" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// 6. Distribuição de criticidade
export function CriticalityDistributionChart({ data, isLoading }: any) {
  return (
    <ChartWrapper title="Distribuição de Criticidade" subtitle="Quantidade de pontos por nível" isLoading={isLoading} isEmpty={!data?.length}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -20 }}>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Bar dataKey="value" name="Pontos" radius={[4, 4, 0, 0]}>
            {data?.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={CRIT_COLORS[entry.label] || '#94A3B8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// 7. Análise por dia da semana
export function WeekdayAnalysisChart({ data, isLoading }: any) {
  return (
    <ChartWrapper title="Descarte por Dia da Semana" subtitle="Volume de registros ao longo da semana" isLoading={isLoading} isEmpty={!data?.length}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -20 }}>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Bar dataKey="value" name="Ocorrências" fill="#c6d1bb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// 8. Análise por faixa horária
export function TimeRangeAnalysisChart({ data, isLoading }: any) {
  return (
    <ChartWrapper title="Faixa Horária de Descarte" subtitle="Horários com mais incidência" isLoading={isLoading} isEmpty={!data?.length}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} width={120} />
          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Bar dataKey="value" name="Registros" fill="#5c7a47" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// 9. Análise mensal
export function MonthlyAnalysisChart({ data, isLoading }: any) {
  return (
    <ChartWrapper title="Análise Mensal" subtitle="Sazonalidade ao longo dos meses" isLoading={isLoading} isEmpty={!data?.length}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -20 }}>
          <defs>
            <linearGradient id="colorMonth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#244214" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#244214" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Area type="monotone" dataKey="value" name="Pontos" stroke="#244214" fillOpacity={1} fill="url(#colorMonth)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
