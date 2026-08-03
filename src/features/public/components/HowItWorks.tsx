
import { Eye, FileText, ChartBar } from '@phosphor-icons/react';

const steps = [
  {
    icon: Eye,
    title: 'Identifique',
    description:
      'Encontrou um ponto de descarte irregular? A plataforma permite registrar a localização e as condições do local.',
  },
  {
    icon: FileText,
    title: 'Registre',
    description:
      'Envie informações sobre o ponto identificado: localização, descrição e evidências para construir o histórico.',
  },
  {
    icon: ChartBar,
    title: 'Acompanhe',
    description:
      'Monitore a situação de cada ponto no mapa. Dados consolidados geram inteligência para prevenção e ação pública.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-surface-900">
            Como funciona
          </h2>
          <p className="mt-6 text-surface-500 text-xl max-w-2xl mx-auto">
            Três etapas simples para contribuir com a inteligência territorial do seu bairro, gerando dados acionáveis.
          </p>
        </div>

        <div className="space-y-32">
          {steps.map((step, index) => (
            <div key={step.title} className={`flex flex-col gap-12 lg:gap-24 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
              
              {/* Lado Gráfico / Imagem */}
              <div className="flex-1 w-full">
                <div className="aspect-[4/3] w-full rounded-[40px] bg-surface-50 border border-surface-200 flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <step.icon className="w-24 h-24 text-primary-200 group-hover:scale-110 transition-transform duration-500" strokeWidth={1} />
                  
                  {/* Etiqueta de número */}
                  <div className="absolute top-8 left-8 w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center border border-surface-100">
                    <span className="font-heading text-2xl font-bold text-primary-700">{index + 1}</span>
                  </div>
                </div>
              </div>

              {/* Lado Texto */}
              <div className="flex-1 space-y-6 text-center lg:text-left">
                <h3 className="font-heading text-3xl sm:text-4xl font-bold text-surface-900">
                  {step.title}
                </h3>
                <p className="text-xl text-surface-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  {step.description}
                </p>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
