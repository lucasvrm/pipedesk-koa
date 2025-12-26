import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { StandardPageLayout } from '@/components/layouts';
import DashboardAIDA from '@/components/Dashboar-AIDA'; // Mantendo o nome do arquivo atual (com typo)
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function AidaPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { session, loading } = useAuth();

  // URL do Backend Python (ajuste se necessário para a URL do Render)
  const AIDA_API_URL = import.meta.env.VITE_AIDA_API_URL || "https://aida-02zl.onrender.com";
  
  // O token vem da sessão do Supabase (seu AuthContext)
  // Nota: O backend Python espera o INTERNAL_API_TOKEN ou um JWT válido.
  // Se estiver usando o INTERNAL_TOKEN fixo para testes, substitua abaixo.
  const token = import.meta.env.VITE_AIDA_INTERNAL_TOKEN;

  if (loading) {
    return (
      <StandardPageLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </StandardPageLayout>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!projectId) {
    return (
      <StandardPageLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Projeto não selecionado</AlertTitle>
          <AlertDescription>
            Por favor, selecione um projeto para visualizar a análise AIDA.
            Tente acessar: /aida/SEU_ID_DO_PROJETO
          </AlertDescription>
        </Alert>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout>
      <DashboardAIDA 
        projectId={projectId} 
        token={token || ""} 
        backendUrl={AIDA_API_URL} 
      />
    </StandardPageLayout>
  );
}