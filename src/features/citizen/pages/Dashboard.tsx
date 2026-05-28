import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Card, Badge } from '@/components/ui';
import {
  Map,
  FileText,
  History,
  Bell,
  ArrowRight,
  Plus,
} from 'lucide-react';

const quickLinks = [
  {
    to: '/app/mapa',
    icon: Map,
    label: 'Mapa detalhado',
    description: 'Visualize todos os pontos mapeados com informações completas.',
    badge: null,
  },
  {
    to: '/app/minhas-denuncias',
    icon: FileText,
    label: 'Minhas denúncias',
    description: 'Acompanhe o status das suas contribuições e registros.',
    badge: 'Em breve',
  },
  {
    to: '/app/historico',
    icon: History,
    label: 'Histórico',
    description: 'Veja o histórico completo de atividades e atualizações.',
    badge: 'Em breve',
  },
  {
    to: '/app/notificacoes',
    icon: Bell,
    label: 'Notificações',
    description: 'Receba alertas sobre atualizações nas áreas que você acompanha.',
    badge: 'Em breve',
  },
];

export function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || 'Cidadão';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">
          Olá, {firstName}
        </h1>

        <p className="text-surface-500 mt-2">
          Bem-vindo ao Pirituba Verde. Aqui você pode acompanhar e contribuir
          com o monitoramento de pontos de descarte irregular na região.
        </p>
        <hr className="mt-4 border-gray-300" />
      </div>
    
      

      {/* CTA Principal - Nova denúncia */}
      <Link to="/app/nova-denuncia" className="block group">
        <Card className="bg-gradient-to-r from-primary-600 to-primary-700 border-0 text-white hover:from-primary-700 hover:to-primary-800 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
              <Plus className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold">Registrar nova denúncia</h2>
              <p className="text-primary-100 text-sm mt-0.5">
                Informe um ponto de descarte irregular na sua região.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-primary-200 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </Card>
      </Link>

      {/* Explorar o mapa */}
      <Link to="/app/mapa" className="block group">
        <Card className="hover:border-primary-200 hover:shadow-elevated transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 shrink-0 group-hover:bg-primary-100 transition-colors">
              <Map className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-surface-900">Explorar o mapa</h2>
              <p className="text-sm text-surface-500 mt-0.5">
                Navegue pelo mapa detalhado e veja os pontos monitorados na região.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-surface-300 group-hover:text-primary-500 transition-colors shrink-0" />
          </div>
        </Card>
      </Link>

      {/* Atalhos */}
      <div>
        <h2 className="text-lg font-semibold text-surface-900 mb-4">
          Seções disponíveis
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.slice(1).map((link) => (
            <Link key={link.to} to={link.to} className="group">
              <Card
                padding="sm"
                className="h-full hover:border-primary-200 hover:shadow-elevated transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-100 transition-colors">
                    <link.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-surface-900">
                        {link.label}
                      </h3>
                      {link.badge && <Badge variant="neutral">{link.badge}</Badge>}
                    </div>
                    <p className="text-xs text-surface-500 leading-relaxed">
                      {link.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-primary-500 transition-colors shrink-0 mt-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
