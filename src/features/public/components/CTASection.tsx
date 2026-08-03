import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { ArrowRight } from '@phosphor-icons/react';

export function CTASection() {
  return (
    <section className="py-24 sm:py-32 bg-primary-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-surface-50 mb-4">
          Ajude a construir um bairro mais limpo
        </h2>
        <p className="text-surface-200 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Cadastre-se gratuitamente para acessar o mapa detalhado,
          registrar ocorrências e acompanhar a situação de cada ponto
          no seu bairro.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/cadastro" className="w-full sm:w-auto">
            <Button
              variant="inverse"
              size="lg"
              fullWidth
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Criar conta gratuita
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              className="text-surface-50 border border-surface-50 hover:bg-surface-50/10 hover:text-surface-50"
            >
              Já tenho conta
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
