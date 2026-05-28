import { Shield, TrendingDown, Brain, Users } from 'lucide-react';

const benefits = [
  {
    icon: Shield,
    title: 'Transparência pública',
    description:
      'Informações acessíveis sobre pontos de descarte irregular, promovendo visibilidade e cobrança legítima.',
  },
  {
    icon: TrendingDown,
    title: 'Prevenção territorial',
    description:
      'Dados de recorrência ajudam a identificar padrões e prevenir a formação de novos pontos viciados.',
  },
  {
    icon: Brain,
    title: 'Inteligência para a gestão',
    description:
      'Consolidação de denúncias em informação útil para priorização de ações e intervenções públicas.',
  },
  {
    icon: Users,
    title: 'Participação cidadã',
    description:
      'A população contribui com evidências e acompanhamento, fortalecendo o controle social do território.',
  },
];

export function Benefits() {
  return (
    <section className="py-16 sm:py-20 bg-surface-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">
            Por que o Pirituba Verde existe
          </h2>
          <p className="mt-3 text-surface-500 max-w-lg mx-auto">
            Uma resposta cidadã a um problema urbano recorrente, com foco em
            dados, prevenção e participação.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="flex gap-4 p-5 rounded-xl bg-white border border-surface-200 hover:border-primary-200 hover:shadow-card transition-all"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                <benefit.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-surface-900 mb-1">
                  {benefit.title}
                </h3>
                <p className="text-sm text-surface-500 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
