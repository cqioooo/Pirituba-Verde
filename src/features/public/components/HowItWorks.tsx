
import { Eye, FileText, BarChart3 } from 'lucide-react';

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
    icon: BarChart3,
    title: 'Acompanhe',
    description:
      'Monitore a situação de cada ponto no mapa. Dados consolidados geram inteligência para prevenção e ação pública.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">
            Como funciona
          </h2>
          <p className="mt-3 text-surface-500 max-w-lg mx-auto">
            Três etapas simples para contribuir com a inteligência territorial
            do seu bairro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {steps.map((step, index) => (
            <div key={step.title} className="text-center group">
              {/* Ícone com número */}
              <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 mb-5 group-hover:bg-primary-100 transition-colors">
                <step.icon className="w-6 h-6" />
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-surface-900 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-surface-500 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
