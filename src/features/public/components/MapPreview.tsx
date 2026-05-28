
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Map } from 'lucide-react';

export function MapPreview() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">
            Mapa público de ocorrências
          </h2>
          <p className="mt-3 text-surface-500 max-w-lg mx-auto">
            Visualize os pontos de descarte irregular já mapeados na região.
            O mapa público mostra uma visão resumida — cadastre-se para
            acessar informações detalhadas.
          </p>
        </div>

        {/* Placeholder do mapa */}
        <div className="relative rounded-2xl border border-surface-200 bg-surface-100 overflow-hidden aspect-[16/9] max-w-3xl mx-auto">
          {/* Simulação visual de mapa */}
          <div className="absolute inset-0 opacity-30">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(45, 106, 79, 0.05) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(45, 106, 79, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          {/* Pontos simulados */}
          <div className="absolute top-[20%] left-[30%] w-3 h-3 rounded-full bg-primary-400 opacity-60 animate-pulse" />
          <div className="absolute top-[45%] left-[55%] w-4 h-4 rounded-full bg-primary-500 opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-[65%] left-[25%] w-3 h-3 rounded-full bg-primary-400 opacity-60 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[35%] left-[70%] w-3.5 h-3.5 rounded-full bg-primary-500 opacity-50 animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-[55%] left-[45%] w-3 h-3 rounded-full bg-primary-400 opacity-60 animate-pulse" style={{ animationDelay: '0.7s' }} />

          {/* Overlay central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 p-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white shadow-elevated flex items-center justify-center">
                <Map className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-surface-800">
                  Mapa interativo em construção
                </p>
                <p className="text-sm text-surface-500 mt-1">
                  Em breve: visualização pública dos pontos mapeados
                </p>
              </div>
              <Link to="/mapa-publico">
                <Button variant="secondary" size="sm">
                  Acessar mapa público
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
