import { Card, CardHeader, CardTitle } from '@/components/ui';

interface DistributionItem {
  label: string;
  value: number;
  color: string;
}

interface StatusDistributionProps {
  title: string;
  data: DistributionItem[];
}

export function StatusDistribution({ title, data }: StatusDistributionProps) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-surface-500">{title}</CardTitle>
      </CardHeader>
      <div className="p-5 pt-0 space-y-4">
        {data.map((item, index) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={index} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-surface-700">{item.label}</span>
                <span className="text-surface-500">{item.value} ({percentage}%)</span>
              </div>
              <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: item.color 
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
