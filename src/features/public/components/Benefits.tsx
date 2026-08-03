import { Shield, TrendDown, Brain, Users } from '@phosphor-icons/react';

const benefits = [
  {
    icon: Shield,
    title: 'Transparência pública',
    description:
      'Informações acessíveis sobre pontos de descarte irregular, promovendo visibilidade e cobrança legítima.',
  },
  {
    icon: TrendDown,
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
    <section className="py-24 sm:py-32 bg-surface-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-20">
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-surface-900 leading-tight">
            Por que o Pirituba Verde existe?
          </h2>
          <p className="mt-6 text-surface-600 text-xl leading-relaxed max-w-2xl mx-auto">
            Uma resposta cidadã a um problema urbano recorrente, com foco em dados, prevenção e participação coletiva.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={benefit.title} 
              className={`flex flex-col gap-8 p-10 sm:p-12 rounded-[40px] bg-white hover:-translate-y-1 transition-transform duration-500 ${
                index === 0 || index === 3 ? 'lg:col-span-2' : 'lg:col-span-1'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-surface-50 flex items-center justify-center text-primary-700">
                <benefit.icon className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-heading text-2xl font-bold text-surface-900 mb-4">
                  {benefit.title}
                </h3>
                <p className="text-surface-600 text-lg leading-relaxed">
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
