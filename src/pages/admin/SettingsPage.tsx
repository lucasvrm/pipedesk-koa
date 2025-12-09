import { useState } from 'react';
import { PageContainer } from '@/components/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Gear,
  Users,
  FlowArrow,
  Briefcase,
  Package,
  ShieldCheck,
  ListChecks,
  TagSimple,
  CalendarBlank,
  FileText,
  ChartLine,
  Robot,
  Lightbulb,
  MagnifyingGlass
} from '@phosphor-icons/react';
import {
  LeadSettingsSection,
  DealPipelineSettingsSection,
  CompanyRelationshipSettingsSection,
  SystemSettingsSection
} from '@/pages/admin/components/settings-sections';
import TagSettings from '@/pages/admin/TagSettings';
import DocumentAutomationSettings from '@/pages/admin/components/DocumentAutomationSettings';
import DashboardSettingsPage from '@/pages/admin/DashboardSettings';
import { SettingsTable } from './components/SettingsTable';
import { format } from 'date-fns';

// Category configuration with colors and metadata
const CATEGORIES = {
  crm: {
    value: 'crm',
    label: 'CRM & Vendas',
    color: 'blue',
    icon: Users,
    description: 'Gerencie leads, deals, pipeline e relacionamentos'
  },
  products: {
    value: 'products',
    label: 'Produtos & Operações',
    color: 'purple',
    icon: Package,
    description: 'Configure produtos, tipos de operação e origens'
  },
  system: {
    value: 'system',
    label: 'Sistema & Segurança',
    color: 'green',
    icon: ShieldCheck,
    description: 'Papéis, permissões e configurações do sistema'
  },
  productivity: {
    value: 'productivity',
    label: 'Produtividade',
    color: 'orange',
    icon: ListChecks,
    description: 'Tarefas, tags, templates e feriados'
  },
  integrations: {
    value: 'integrations',
    label: 'Integrações & Automação',
    color: 'pink',
    icon: Robot,
    description: 'Dashboards e automação de documentos'
  }
} as const;

// Helper component for category help cards
function HelpCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Lightbulb className="h-5 w-5 text-primary" weight="fill" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <CardDescription className="text-xs mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function NewSettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('crm');

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Gear className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Configurações do Sistema
            </h1>
            <p className="text-muted-foreground">
              Gerencie metadados, parâmetros, permissões e integrações da plataforma
            </p>
          </div>
        </div>

        {/* Global Search */}
        <div className="relative max-w-md">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar configurações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
        {/* Category Navigation */}
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto py-1 gap-1">
          {Object.values(CATEGORIES).map((cat) => {
            const Icon = cat.icon;
            const colorClasses = {
              blue: 'data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-700',
              purple: 'data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-700',
              green: 'data-[state=active]:bg-green-500/10 data-[state=active]:text-green-700',
              orange: 'data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-700',
              pink: 'data-[state=active]:bg-pink-500/10 data-[state=active]:text-pink-700'
            }[cat.color];

            return (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className={`py-3 flex items-center gap-2 ${colorClasses}`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{cat.label}</span>
                <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* CRM & Vendas */}
        <TabsContent value="crm" className="space-y-6 mt-6">
          <HelpCard
            title="CRM & Vendas"
            description="Configure todos os aspectos do seu funil de vendas, desde leads até empresas e contatos. Gerencie metadados de leads, pipeline de deals e relacionamentos corporativos."
          />
          
          <Tabs defaultValue="leads" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="leads">
                <Users className="mr-2 h-4 w-4" /> Leads
              </TabsTrigger>
              <TabsTrigger value="deals">
                <FlowArrow className="mr-2 h-4 w-4" /> Deals & Pipeline
              </TabsTrigger>
              <TabsTrigger value="companies">
                <Briefcase className="mr-2 h-4 w-4" /> Empresas & Contatos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leads" className="space-y-6">
              <LeadSettingsSection />
            </TabsContent>

            <TabsContent value="deals" className="space-y-6">
              <DealPipelineSettingsSection />
            </TabsContent>

            <TabsContent value="companies" className="space-y-6">
              <CompanyRelationshipSettingsSection />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Produtos & Operações */}
        <TabsContent value="products" className="space-y-6 mt-6">
          <HelpCard
            title="Produtos & Operações"
            description="Defina os produtos financeiros disponíveis (CRI, CRA, CCB), configure tipos de operação, gerencie origens de deals e motivos de perda para análise de churn."
          />

          <SettingsTable
            type="products"
            title="Produtos"
            description="Defina os produtos financeiros (ex: CRI, CRA, CCB) disponíveis."
            columns={[
              {
                key: 'name',
                label: 'Nome',
                width: '250px',
                render: (i) => <span className="font-medium">{i.name}</span>
              },
              {
                key: 'acronym',
                label: 'Sigla',
                width: '100px',
                render: (i) => (
                  <Badge variant="outline">{i.acronym}</Badge>
                )
              },
              {
                key: 'defaultFeePercentage',
                label: 'Fee Padrão',
                width: '100px',
                render: (i) =>
                  i.defaultFeePercentage ? `${i.defaultFeePercentage}%` : '-'
              },
              { key: 'description', label: 'Descrição' }
            ]}
          />

          <SettingsTable
            type="operation_types"
            title="Tipos de Operação"
            description="Configure os tipos de operação suportados para negócios e deals."
            columns={[
              {
                key: 'name',
                label: 'Tipo',
                width: '220px',
                render: (i) => (
                  <span className="font-medium">{i.name}</span>
                )
              },
              {
                key: 'code',
                label: 'Código',
                width: '120px',
                render: (i) =>
                  i.code ? (
                    <Badge
                      variant="outline"
                      className="uppercase"
                    >
                      {i.code}
                    </Badge>
                  ) : (
                    '-'
                  )
              },
              { key: 'description', label: 'Descrição' }
            ]}
          />

          <SettingsTable
            type="deal_sources"
            title="Origens de Deal (Sources)"
            description="Canais de aquisição de novos negócios."
            columns={[
              {
                key: 'name',
                label: 'Canal',
                width: '250px',
                render: (i) => (
                  <span className="font-medium">{i.name}</span>
                )
              },
              {
                key: 'type',
                label: 'Tipo',
                width: '150px',
                render: (i) =>
                  i.type && (
                    <Badge
                      variant="secondary"
                      className="capitalize"
                    >
                      {i.type}
                    </Badge>
                  )
              },
              { key: 'description', label: 'Descrição' }
            ]}
          />

          <SettingsTable
            type="loss_reasons"
            title="Motivos de Perda"
            description="Razões padronizadas para cancelamento de deals (Churn)."
            columns={[
              {
                key: 'name',
                label: 'Motivo',
                width: '250px',
                render: (i) => (
                  <span className="font-medium">{i.name}</span>
                )
              },
              { key: 'description', label: 'Descrição' }
            ]}
          />
        </TabsContent>

        {/* Sistema & Segurança */}
        <TabsContent value="system" className="space-y-6 mt-6">
          <HelpCard
            title="Sistema & Segurança"
            description="Configure papéis de usuários, gerencie permissões RBAC e defina valores padrão para o sistema. Esta é a área central de segurança e controle de acesso."
          />
          
          <SystemSettingsSection />
        </TabsContent>

        {/* Produtividade */}
        <TabsContent value="productivity" className="space-y-6 mt-6">
          <HelpCard
            title="Produtividade"
            description="Organize o trabalho da equipe com configurações de tarefas, tags, templates de comunicação e gerenciamento de feriados para cálculo de SLA."
          />

          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="tasks">
                <ListChecks className="mr-2 h-4 w-4" /> Tarefas
              </TabsTrigger>
              <TabsTrigger value="tags">
                <TagSimple className="mr-2 h-4 w-4" /> Tags
              </TabsTrigger>
              <TabsTrigger value="templates">
                <FileText className="mr-2 h-4 w-4" /> Templates
              </TabsTrigger>
              <TabsTrigger value="holidays">
                <CalendarBlank className="mr-2 h-4 w-4" /> Feriados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-6">
              <SettingsTable
                type="task_statuses"
                title="Status de Tarefas"
                description="Padronize os status das tarefas e acompanhe a ativação de cada um."
                columns={[
                  {
                    key: 'name',
                    label: 'Status',
                    width: '220px',
                    render: (i) => (
                      <span className="font-medium">{i.name}</span>
                    )
                  },
                  {
                    key: 'color',
                    label: 'Cor',
                    width: '120px',
                    render: (i) => {
                      const color = i.color || '#475569';
                      return (
                        <Badge
                          style={{
                            backgroundColor: color,
                            color: '#fff'
                          }}
                        >
                          {i.color || 'Sem cor'}
                        </Badge>
                      );
                    }
                  },
                  { key: 'description', label: 'Descrição' }
                ]}
              />

              <SettingsTable
                type="task_priorities"
                title="Prioridades de Tarefas"
                description="Defina níveis de prioridade para organizar o fluxo de trabalho."
                columns={[
                  {
                    key: 'name',
                    label: 'Prioridade',
                    width: '220px',
                    render: (i) => (
                      <span className="font-medium">{i.name}</span>
                    )
                  },
                  {
                    key: 'color',
                    label: 'Cor',
                    width: '120px',
                    render: (i) => {
                      const color = i.color || '#475569';
                      return (
                        <Badge
                          style={{
                            backgroundColor: color,
                            color: '#fff'
                          }}
                        >
                          {i.color || 'Sem cor'}
                        </Badge>
                      );
                    }
                  },
                  { key: 'description', label: 'Descrição' }
                ]}
              />
            </TabsContent>

            <TabsContent value="tags" className="space-y-6">
              <TagSettings />
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <SettingsTable
                type="communication_templates"
                title="Templates de Mensagens"
                description="Padronização de emails, whatsapps e documentos."
                columns={[
                  {
                    key: 'title',
                    label: 'Título',
                    width: '200px',
                    render: (i) => (
                      <span className="font-medium">{i.title}</span>
                    )
                  },
                  {
                    key: 'type',
                    label: 'Canal',
                    width: '100px',
                    render: (i) => (
                      <Badge
                        variant="outline"
                        className="capitalize"
                      >
                        {i.type}
                      </Badge>
                    )
                  },
                  {
                    key: 'category',
                    label: 'Categoria',
                    width: '150px',
                    render: (i) => (
                      <Badge variant="secondary">{i.category}</Badge>
                    )
                  },
                  {
                    key: 'subject',
                    label: 'Assunto',
                    render: (i) => (
                      <span className="text-muted-foreground text-sm truncate max-w-[200px] block">
                        {i.subject || '-'}
                      </span>
                    )
                  }
                ]}
              />
            </TabsContent>

            <TabsContent value="holidays" className="space-y-6">
              <SettingsTable
                type="holidays"
                title="Feriados & Dias Não Úteis"
                description="Cadastro para cálculo correto de SLA."
                columns={[
                  {
                    key: 'date',
                    label: 'Data',
                    width: '150px',
                    render: (i) => format(new Date(i.date), 'dd/MM/yyyy')
                  },
                  {
                    key: 'name',
                    label: 'Feriado',
                    render: (i) => (
                      <span className="font-medium">{i.name}</span>
                    )
                  },
                  {
                    key: 'type',
                    label: 'Tipo',
                    width: '150px',
                    render: (i) => (
                      <Badge
                        className={
                          i.type === 'national'
                            ? 'bg-blue-500'
                            : 'bg-orange-500'
                        }
                      >
                        {i.type === 'national' ? 'Nacional' : 'Regional'}
                      </Badge>
                    )
                  }
                ]}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Integrações & Automação */}
        <TabsContent value="integrations" className="space-y-6 mt-6">
          <HelpCard
            title="Integrações & Automação"
            description="Configure dashboards personalizados e automatize a geração de documentos. Centralize todas as integrações e processos automatizados da plataforma."
          />

          <Tabs defaultValue="dashboards" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="dashboards">
                <ChartLine className="mr-2 h-4 w-4" /> Dashboards
              </TabsTrigger>
              <TabsTrigger value="automation">
                <Robot className="mr-2 h-4 w-4" /> Automação de Documentos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboards" className="space-y-6">
              <DashboardSettingsPage />
            </TabsContent>

            <TabsContent value="automation" className="space-y-6">
              <DocumentAutomationSettings />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
