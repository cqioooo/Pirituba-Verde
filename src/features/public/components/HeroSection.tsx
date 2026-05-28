import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { MapPin, ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/80 to-surface-50">
      {/* Detalhe visual sutil */}
      <div className="absolute inset-0 opacity-[0.03]" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D6A4F' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
            <MapPin className="w-3.5 h-3.5" />
            Pirituba, São Paulo
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-surface-900 leading-tight tracking-tight">
            Mapeie. Denuncie.{' '}
            <span className="text-primary-600">Acompanhe.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-surface-600 leading-relaxed max-w-xl mx-auto">
            Uma plataforma de inteligência territorial para identificar e
            monitorar pontos recorrentes de descarte irregular de resíduos
            urbanos. Participação cidadã a serviço de um bairro mais limpo.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/cadastro">
              <Button size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                Participar agora
              </Button>
            </Link>
            <Link to="/mapa-publico">
              <Button variant="outline" size="lg">
                Ver mapa público
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
