// Path: lucasvrm/pipedesk-koa/pipedesk-koa-d477da2e57e2097cdd221bf7a1031b90a70be347/src/App.tsx
import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import LoadingPage from '@/pages/LoadingPage'; // Assumindo a existência desta página
import LoginView from '@/features/rbac/components/LoginView';
import MagicLinkAuth from '@/features/rbac/components/MagicLinkAuth';

// Componentes Lazy-Loaded
import DashboardPage from '@/pages/DashboardPage';
import DealsView from '@/features/deals/components/DealsView';
import DealDetailPage from '@/features/deals/pages/DealDetailPage';
import DealComparison from '@/features/deals/pages/DealComparison';
import CompaniesListPage from '@/features/companies/pages/CompaniesListPage';
import CompanyDetailPage from '@/features/companies/pages/CompanyDetailPage';
import PlayersListPage from '@/features/players/pages/PlayersListPage';
import PlayerDetailPage from '@/features/players/pages/PlayerDetailPage';
import LeadsListPage from '@/features/leads/pages/LeadsListPage';
import LeadDetailPage from '@/features/leads/pages/LeadDetailPage';
import ContactsPage from '@/pages/ContactsPage';
import Profile from '@/pages/Profile';
import SettingsPage from '@/pages/admin/SettingsPage';
import UserManagementPage from '@/pages/admin/UserManagementPage';
import PipelineSettingsPage from '@/pages/admin/PipelineSettingsPage';
import CustomFieldsPage from '@/pages/settings/CustomFieldsPage';
import HelpCenterPage from '@/pages/HelpCenterPage';
import FolderManagerPage from '@/pages/FolderManagerPage';

// Importando o PageContainer
import PageContainer from '@/components/PageContainer'; 

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  // Wrapper para as rotas que precisam do PageContainer
  const PageWrapper = ({ children, title }: { children: React.ReactNode, title?: string }) => (
    <PageContainer title={title}>{children}</PageContainer>
  );

  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/magic-link-auth" element={<MagicLinkAuth />} />
        
        {/* Layout Principal com Sidebar e Header */}
        <Route element={<ProtectedRoute element={<Layout />} />}>
          
          {/* Rotas Envolvidas pelo PageContainer */}
          <Route 
            path="/" 
            element={<PageWrapper title="Dashboard"><DashboardPage /></PageWrapper>} 
          />
          <Route 
            path="/deals" 
            element={<PageWrapper title="Deals"><DealsView /></PageWrapper>} 
          />
          <Route 
            path="/deals/:dealId" 
            element={<PageWrapper><DealDetailPage /></PageWrapper>} 
          />
          <Route 
            path="/compare" 
            element={<PageWrapper title="Comparativo de Deals"><DealComparison /></PageWrapper>} 
          />
          <Route 
            path="/companies" 
            element={<PageWrapper title="Empresas"><CompaniesListPage /></PageWrapper>} 
          />
          <Route 
            path="/companies/:companyId" 
            element={<PageWrapper><CompanyDetailPage /></PageWrapper>} 
          />
          <Route 
            path="/players" 
            element={<PageWrapper title="Players"><PlayersListPage /></PageWrapper>} 
          />
          <Route 
            path="/players/:playerId" 
            element={<PageWrapper><PlayerDetailPage /></PageWrapper>} 
          />
          <Route 
            path="/leads" 
            element={<PageWrapper title="Leads"><LeadsListPage /></PageWrapper>} 
          />
          <Route 
            path="/leads/:leadId" 
            element={<PageWrapper><LeadDetailPage /></PageWrapper>} 
          />
          <Route 
            path="/contacts" 
            element={<PageWrapper title="Contatos"><ContactsPage /></PageWrapper>} 
          />
          <Route 
            path="/profile" 
            element={<PageWrapper title="Perfil"><Profile /></PageWrapper>} 
          />
          <Route 
            path="/help-center" 
            element={<PageWrapper title="Central de Ajuda"><HelpCenterPage /></PageWrapper>} 
          />
          <Route 
            path="/folders" 
            element={<PageWrapper title="Gerenciador de Pastas"><FolderManagerPage /></PageWrapper>} 
          />
          
          {/* Rotas de Admin/Settings (algumas podem precisar de PageContainer, outras não) */}
          <Route 
            path="/settings" 
            element={<PageWrapper title="Configurações"><SettingsPage /></PageWrapper>} 
          />
          <Route 
            path="/settings/users" 
            element={<PageWrapper title="Usuários e Permissões"><UserManagementPage /></PageWrapper>} 
          />
          <Route 
            path="/settings/pipeline" 
            element={<PageWrapper title="Config. Pipeline"><PipelineSettingsPage /></PageWrapper>} 
          />
          <Route 
            path="/settings/custom-fields" 
            element={<PageWrapper title="Campos Personalizados"><CustomFieldsPage /></PageWrapper>} 
          />
        </Route>

        {/* 404/Fallback page - Adicione aqui se necessário */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </Suspense>
  );
}

export default App;