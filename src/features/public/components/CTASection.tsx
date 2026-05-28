import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-16 sm:py-20 bg-primary-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Ajude a construir um bairro mais limpo
        </h2>
        <p className="text-primary-200 max-w-lg mx-auto mb-8 leading-relaxed">
          Cadastre-se gratuitamente para acessar o mapa detalhado,
          registrar ocorrências e acompanhar a situação de cada ponto
          no seu bairro.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/cadastro">
            <Button
              variant="inverse"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Criar conta gratuita
            </Button>
          </Link>
          <Link to="/login">
            <Button
              variant="ghost"
              size="lg"
              className="text-white border border-white hover:bg-white/10"
            >
              Já tenho conta
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
