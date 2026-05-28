import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Menu, X, Leaf } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { to: '/', label: 'Início' },
  { to: '/mapa-publico', label: 'Mapa Público' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-surface-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-primary-700 hover:text-primary-600 transition-colors"
          >
            <Leaf className="w-7 h-7 text-primary-600" />
            <span className="text-lg font-bold tracking-tight">
              Pirituba Verde
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navegação principal">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === link.to
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-surface-600 hover:text-surface-900 hover:bg-surface-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link to="/cadastro">
              <Button size="sm">
                Cadastrar
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-surface-600 hover:bg-surface-50 transition-colors"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav
            className="md:hidden pb-4 border-t border-surface-100 mt-2 pt-4 space-y-1"
            aria-label="Navegação principal"
          >
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === link.to
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-surface-600 hover:bg-surface-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 space-y-2 border-t border-surface-100 mt-3">
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" fullWidth size="sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/cadastro" onClick={() => setMenuOpen(false)}>
                <Button fullWidth size="sm">
                  Cadastrar
                </Button>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
