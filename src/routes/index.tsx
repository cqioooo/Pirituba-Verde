import { createBrowserRouter } from 'react-router-dom';

// Layouts
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { GestaoLayout } from '@/components/layout/GestaoLayout';

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
import { DenunciaDetail } from '@/features/citizen/pages/DenunciaDetail';

import { Notifications } from '@/features/citizen/pages/Notifications';
import { Profile } from '@/features/citizen/pages/Profile';
import { NewReportPage } from '@/features/citizen/pages/NewReportPage';

// Features - Gestão
import { OverviewPage } from '@/features/gestao/pages/OverviewPage';
import { AlertsPage } from '@/features/gestao/pages/AlertsPage';
import { GestaoMapPage } from '@/features/gestao/pages/GestaoMapPage';
import { AnalyticsPage } from '@/features/gestao/pages/AnalyticsPage';
import { PointsListPage } from '@/features/gestao/pages/PointsListPage';
import { PointDetailFrontendPage } from '@/features/gestao/pages/PointDetailFrontendPage';
import { OcorrenciaDetailPage } from '@/features/gestao/pages/OcorrenciaDetailPage';
import { ModerationPage } from '@/features/gestao/pages/ModerationPage';
import { SettingsPage } from '@/features/gestao/pages/SettingsPage';

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
        path: '/app/denuncia/:id',
        element: <DenunciaDetail />,
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

  // ── Rotas da Gestão ──
  {
    element: (
      <ProtectedRoute requiredRoles={['gestor', 'analista', 'admin']}>
        <GestaoLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/gestao',
        element: <OverviewPage />,
      },
      {
        path: '/gestao/alertas',
        element: <AlertsPage />,
      },
      {
        path: '/gestao/mapa',
        element: <GestaoMapPage />,
      },
      {
        path: '/gestao/analytics',
        element: <AnalyticsPage />,
      },
      {
        path: '/gestao/pontos',
        element: <PointsListPage />,
      },
      {
        path: '/gestao/pontos/:id',
        element: <PointDetailFrontendPage />,
      },
      {
        path: '/gestao/ocorrencias/:id',
        element: <OcorrenciaDetailPage />,
      },
      {
        path: '/gestao/moderacao',
        element: <ModerationPage />,
      },
      {
        path: '/gestao/configuracoes',
        element: <SettingsPage />,
      },
    ],
  },
]);
