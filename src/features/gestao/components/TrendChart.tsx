import { useIndicadoresDiarios } from '@/services/queries';
import { Spinner } from '@/components/ui';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export function TrendChart() {
  const { data, isLoading } = useIndicadoresDiarios();

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm h-72 flex flex-col justify-center items-center">
        <Spinner size="lg" />
        <p className="text-surface-500 mt-4 text-sm">Carregando histórico...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm h-72 flex flex-col justify-center items-center">
        <p className="text-surface-500 text-sm">Sem dados suficientes para exibir o gráfico.</p>
      </div>
    );
  }

  // Formatar data (YYYY-MM-DD para DD/MM)
  const formattedData = data.map(item => ({
    ...item,
    dia: new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }));

  return (
    <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm h-80 flex flex-col">
      <h3 className="font-medium text-surface-900 mb-6 text-sm">Tendência Temporal (Últimos 14 dias)</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNovos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorResolvidos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="dia" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Area 
              type="monotone" 
              dataKey="novos_pontos" 
              name="Novos Pontos"
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorNovos)" 
            />
            <Area 
              type="monotone" 
              dataKey="pontos_resolvidos" 
              name="Resolvidos"
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorResolvidos)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
