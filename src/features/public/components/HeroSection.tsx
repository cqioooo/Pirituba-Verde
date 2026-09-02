import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { MapPin, ArrowRight } from '@phosphor-icons/react';
import heroImage from '@/assets/images/vista-do-pico-do-jaragua.jpg';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-surface-50 pt-16 sm:pt-24 pb-20 sm:pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Esquerda: Texto */}
          <div className="flex-1 space-y-10 text-center lg:text-left">

            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-surface-900 leading-[1.1] tracking-tight">
              Mapeie.<br/>Denuncie.<br/>
              <span className="text-primary-700">Transforme.</span>
            </h1>

            <p className="text-xl text-surface-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Plataforma de inteligência territorial para monitoramento de
              descarte irregular. Participação cidadã a serviço de um ambiente mais limpo.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center lg:justify-start">
              <Link to="/cadastro" className="w-full sm:w-auto">
                <Button size="lg" fullWidth icon={<ArrowRight className="w-5 h-5" />} className="h-14 px-8 text-lg rounded-2xl">
                  Registrar denúncia
                </Button>
              </Link>
              <Link to="/mapa-publico" className="w-full sm:w-auto">
                <Button variant="ghost" size="lg" fullWidth className="h-14 px-8 text-lg rounded-2xl">
                  Explorar o mapa
                </Button>
              </Link>
            </div>
          </div>

          {/* Direita: Imagem Orgânica */}
          <div className="flex-1 w-full relative">
            <div className="aspect-square w-full max-w-[600px] mx-auto lg:ml-auto relative">
              {/* Organic Shape Placeholder */}
              <div className="absolute inset-0 bg-primary-200 rounded-[40px] rounded-bl-[100px] rounded-tr-[100px] overflow-hidden transform -rotate-3 transition-transform hover:rotate-0 duration-700 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/20 to-transparent mix-blend-overlay z-10 pointer-events-none"></div>
                <img
                  src={heroImage}
                  alt="Vista do Pico do Jaraguá - Pirituba Verde"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Floating element */}
              <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-surface-500 font-medium">Pontos mapeados</p>
                    <p className="font-heading text-2xl font-bold text-surface-900">+1.200</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
