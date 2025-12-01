import React, { useEffect, useState } from 'react';

// --- Tipos para TypeScript ---

interface SectionKV {
  data: Record<string, any>;
}

interface SectionTable {
  rows: Record<string, any>[];
}

interface ConsolidatedPayload {
  Geral: SectionKV;
  Projeto: SectionKV;
  Recebíveis: SectionTable;
  Tipologia: SectionTable;
  Landbank: SectionTable;
  Endividamento: SectionTable;
  "Viabilidade Financeira": SectionTable;
}

interface ProjectData {
  project_id: string;
  name: string;
  status: 'created' | 'processing' | 'ready' | 'failed';
  consolidated_payload?: ConsolidatedPayload;
  output_xlsx_path?: string;
  output_signed_url?: string;
}

interface DashboardAIDAProps {
  projectId: string;
  token: string;
  backendUrl?: string; // Ex: "https://aida-api.onrender.com" ou "http://localhost:8000"
}

// --- Componentes Auxiliares ---

const CardAIDA = ({ title, data }: { title: string; data?: Record<string, any> }) => {
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <span className="text-xs font-medium text-gray-400 uppercase mb-1">{key}</span>
            <span className="text-sm text-gray-900 font-medium break-words">
              {value !== null && value !== undefined && value !== '' ? String(value) : '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DataTableAIDA = ({ title, rows }: { title: string; rows?: Record<string, any>[] }) => {
  if (!rows || rows.length === 0) {
    return (
      <div className="mt-8 bg-white p-6 rounded-xl border border-gray-200 text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
        <p className="text-gray-400 text-sm">Nenhum dado encontrado para esta seção.</p>
      </div>
    );
  }

  const headers = Object.keys(rows[0]);

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        {title}
        <span className="text-xs font-normal bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          {rows.length} registros
        </span>
      </h3>
      <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, idx) => (
                <tr 
                  key={idx} 
                  className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                >
                  {headers.map((h) => (
                    <td key={`${idx}-${h}`} className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal ---

export default function DashboardAIDA({ 
  projectId, 
  token, 
  backendUrl = "http://localhost:8000" 
}: DashboardAIDAProps) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !token) {
      setError("ID do projeto ou Token não fornecidos.");
      setLoading(false);
      return;
    }

    const fetchProject = async () => {
      try {
        // Remove trailing slash se houver
        const baseUrl = backendUrl.replace(/\/$/, "");
        const response = await fetch(`${baseUrl}/v1/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Erro na API AIDA: ${response.status}`);
        }

        const data = await response.json();
        setProject(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Falha ao carregar projeto AIDA.");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, token, backendUrl]);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-12 bg-gray-50 rounded-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium text-sm">Sincronizando com AIDA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-white rounded-xl border border-red-100 text-center">
        <div className="text-red-500 text-3xl mb-2">!</div>
        <p className="text-gray-800 font-semibold">Não foi possível carregar o dashboard.</p>
        <p className="text-gray-500 text-sm mt-1">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!project) return null;

  const { consolidated_payload: payload, status, name } = project;

  // Tela de "Processando"
  if (status !== 'ready') {
    return (
      <div className="w-full flex flex-col items-center justify-center bg-gray-50 p-12 rounded-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{name}</h2>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-full text-sm flex items-center gap-2">
          <span className="animate-pulse w-2 h-2 bg-yellow-500 rounded-full"></span>
          Status AIDA: <span className="font-bold uppercase">{status}</span>
        </div>
        <p className="mt-4 text-gray-500 text-sm max-w-sm text-center">
          O sistema AIDA está processando os documentos. Os dados aparecerão aqui automaticamente assim que concluído.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 text-gray-900 font-sans pb-12 rounded-lg">
      
      {/* Header Interno do Dashboard */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
        <div>
          <h2 className="text-lg font-bold text-gray-800">{name}</h2>
          <span className="text-xs text-gray-400">Ref AIDA: {project.project_id}</span>
        </div>
        <div className="flex items-center gap-3">
            {project.output_signed_url && (
                <a 
                    href={project.output_signed_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md font-semibold hover:bg-blue-100 transition-colors"
                >
                    Baixar XLSX
                </a>
            )}
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded border border-green-200 uppercase">
            {status}
            </span>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Seção 1: Resumo Executivo (Cards) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardAIDA title="Dados Gerais" data={payload?.Geral?.data} />
          <CardAIDA title="Dados do Projeto" data={payload?.Projeto?.data} />
        </section>

        {/* Seção 2: Tabelas Detalhadas */}
        <section className="space-y-12">
          <DataTableAIDA title="Recebíveis" rows={payload?.Recebíveis?.rows} />
          <DataTableAIDA title="Landbank" rows={payload?.Landbank?.rows} />
          <DataTableAIDA title="Endividamento" rows={payload?.Endividamento?.rows} />
          <DataTableAIDA title="Tipologia" rows={payload?.Tipologia?.rows} />
          <DataTableAIDA title="Viabilidade Financeira" rows={payload?.['Viabilidade Financeira']?.rows} />
        </section>

      </div>
    </div>
  );
}