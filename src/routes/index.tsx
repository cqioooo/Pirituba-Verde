import { createBrowserRouter } from 'react-router-dom';

// Layouts
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AppLayout } from '@/components/layout/AppLayout';

// Proteção de rota
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';

// Features - Público
import { LandingPage } from '@/features/public/LandingPage';
import { PublicMapPage } from '@/features/public/PublicMapPage';

// Features - Auth
import { LoginForm } from '@/features/auth/components/LoginForm';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

// Features - Cidadão (área autenticada)
import { Dashboard } from '@/features/citizen/pages/Dashboard';
import { MapPage } from '@/features/citizen/pages/MapPage';
import { MyReports } from '@/features/citizen/pages/MyReports';
import { HistoryPage } from '@/features/citizen/pages/HistoryPage';
import { Notifications } from '@/features/citizen/pages/Notifications';
import { Profile } from '@/features/citizen/pages/Profile';
import { NewReportPage } from '@/features/citizen/pages/NewReportPage';

export const router = createBrowserRouter([
  // ── Rotas públicas ──
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: <LandingPage />,
      },
      {
        path: '/mapa-publico',
        element: <PublicMapPage />,
      },
    ],
  },

  // ── Rotas de autenticação ──
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginForm />,
      },
      {
        path: '/cadastro',
        element: <RegisterForm />,
      },
    ],
  },

  // ── Rotas autenticadas (área cidadão) ──
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/app',
        element: <Dashboard />,
      },
      {
        path: '/app/mapa',
        element: <MapPage />,
      },
      {
        path: '/app/nova-denuncia',
        element: <NewReportPage />,
      },
      {
        path: '/app/minhas-denuncias',
        element: <MyReports />,
      },
      {
        path: '/app/historico',
        element: <HistoryPage />,
      },
      {
        path: '/app/notificacoes',
        element: <Notifications />,
      },
      {
        path: '/app/perfil',
        element: <Profile />,
      },
    ],
  },
]);
