import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui';
import { Leaf, LogOut, User } from 'lucide-react';

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.user_metadata?.full_name || 'Cidadão';
  const firstName = displayName.split(' ')[0];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-surface-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link
            to="/app"
            className="flex items-center gap-2 text-primary-700 hover:text-primary-600 transition-colors"
          >
            <Leaf className="w-6 h-6 text-primary-600" />
            <span className="text-base font-bold tracking-tight hidden sm:inline">
              Pirituba Verde
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/app/perfil"
              className="flex items-center gap-2 text-sm text-surface-600 hover:text-surface-900 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-4 h-4 text-primary-700" />
              </div>
              <span className="hidden sm:inline font-medium">{firstName}</span>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              icon={<LogOut className="w-4 h-4" />}
              aria-label="Sair da conta"
            >
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
