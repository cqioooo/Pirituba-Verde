import { Leaf } from '@phosphor-icons/react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-700 text-surface-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sobre */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="w-5 h-5 text-primary-300" />
              <span className="font-heading font-semibold text-surface-50 text-lg">Pirituba Verde</span>
            </div>
            <p className="text-sm leading-relaxed text-surface-200">
              Plataforma de inteligência territorial e participação cidadã para
              monitoramento de pontos de descarte irregular de resíduos urbanos
              na região de Pirituba, São Paulo.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-heading text-sm font-semibold text-surface-50 mb-3">Navegação</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="hover:text-surface-50 transition-colors">
                  Início
                </a>
              </li>
              <li>
                <a href="/mapa-publico" className="hover:text-surface-50 transition-colors">
                  Mapa Público
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-surface-50 transition-colors">
                  Entrar
                </a>
              </li>
              <li>
                <a href="/cadastro" className="hover:text-surface-50 transition-colors">
                  Cadastrar
                </a>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-heading text-sm font-semibold text-surface-50 mb-3">Informações</h3>
            <p className="text-sm leading-relaxed text-surface-200">
              Este é um projeto de utilidade pública. Todos os dados são
              tratados com responsabilidade e transparência.
            </p>
            <p className="text-sm mt-3 text-surface-200">
              Região: Pirituba, São Paulo — SP
            </p>
          </div>
        </div>

        <div className="border-t border-primary-600 mt-8 pt-6 text-center text-xs text-primary-300">
          © {currentYear} Pirituba Verde. Projeto de utilidade pública.
        </div>
      </div>
    </footer>
  );
}
