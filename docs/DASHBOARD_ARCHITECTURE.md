# Arquitetura do Dashboard Modular

Este documento descreve a nova arquitetura modular do Dashboard do PipeDesk, implementada para permitir maior flexibilidade, configuração dinâmica e personalização por usuário.

## 1. Visão Geral

O Dashboard foi refatorado de uma página estática (hardcoded) para um sistema baseado em **Widgets**.

*   **Widgets:** Pequenos componentes independentes (ex: Cards de KPI, Gráficos, Listas) que podem ser ativados ou desativados.
*   **Registro Central:** Um arquivo único define quais widgets existem e suas propriedades.
*   **Configuração Global:** O Administrador define quais widgets estão *disponíveis* para a organização.
*   **Preferência do Usuário:** Cada usuário pode personalizar sua tela, escolhendo quais dos widgets disponíveis ele quer ver.

## 2. Estrutura de Diretórios

Os arquivos principais estão localizados em:

```
src/features/dashboard/
├── registry.tsx             # O "cérebro" do sistema. Define todos os widgets.
└── widgets/                 # Diretório contendo os componentes visuais dos widgets.
    ├── kpi/                 # Widgets de KPI (ex: Deals Ativos, Taxa de Conversão)
    ├── NotificationsWidget.tsx
    ├── QuickTasksWidget.tsx
    ├── PortfolioMatrixWidget.tsx
    ├── ... (outros widgets)
```

E a lógica de estado/configuração:

```
src/hooks/
└── useDashboardLayout.ts    # Hook que gerencia a lógica de carregar/salvar preferências.
```

## 3. Como Funciona a Configuração

O sistema utiliza uma estratégia de "Camadas de Prioridade" para determinar o que mostrar na tela:

1.  **Estado Local (Optimistic):** Alterações na tela refletem instantaneamente.
2.  **Banco de Dados (Tabela `profiles`):** As preferências do usuário são salvas na coluna JSONB `preferences`.
3.  **Fallback Local (`localStorage`):** Se o banco falhar ou a coluna não existir, salvamos no navegador do usuário para não quebrar a experiência.
4.  **Padrão Global (`system_settings`):** Se o usuário nunca personalizou, usamos a configuração padrão definida pelo Admin no banco.
5.  **Padrão do Código (`DEFAULT_DASHBOARD_CONFIG`):** Último recurso, caso não haja nada no banco.

## 4. Guia: Como Criar um Novo Widget

Para adicionar um novo gráfico ou painel ao dashboard, siga estes 3 passos simples:

### Passo 1: Crie o Componente do Widget
Crie um arquivo `.tsx` em `src/features/dashboard/widgets/`. O componente deve ser autocontido (buscar seus próprios dados ou receber via props, embora a arquitetura atual favoreça componentes que buscam seus dados via Hooks do React Query).

*Exemplo: `src/features/dashboard/widgets/MeuNovoGrafico.tsx`*
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function MeuNovoGrafico() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Meu Novo Gráfico</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Conteúdo do Gráfico aqui */}
        <p>Olá Mundo!</p>
      </CardContent>
    </Card>
  )
}
```

### Passo 2: Registre o Widget
Abra o arquivo `src/features/dashboard/registry.tsx` e adicione seu widget à constante `WIDGET_REGISTRY`.

```tsx
import { MeuNovoGrafico } from './widgets/MeuNovoGrafico';

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  // ... outros widgets ...
  'meu-novo-grafico': {
    id: 'meu-novo-grafico',
    title: 'Meu Novo Gráfico de Vendas',
    component: MeuNovoGrafico,
    defaultSize: 'medium', // 'small' | 'medium' | 'large' | 'full'
    category: 'chart',     // 'kpi' | 'chart' | 'list' | 'operational'
    requiredPermissions: ['VIEW_ANALYTICS'] // Opcional: Controle de acesso RBAC
  }
};
```

### Passo 3: (Opcional) Adicionar ao Padrão
Se você quiser que esse widget apareça automaticamente para todos os novos usuários (ou usuários que resetarem as configurações), adicione o ID dele (`'meu-novo-grafico'`) na constante `DEFAULT_DASHBOARD_CONFIG` no mesmo arquivo `registry.tsx`.

## 5. Configurações Administrativas

Os administradores podem controlar a disponibilidade global dos widgets acessando:
`Configurações > Sistema > Dashboard`

*   Desabilitar um widget aqui remove-o da lista de opções de **todos** os usuários, mesmo que eles o tenham ativado pessoalmente.

## 6. Solução de Problemas

**Problema:** O usuário clica em "Salvar" mas as alterações somem ao recarregar.
**Causa Provável:** Falha na persistência no banco de dados e limpeza do localStorage.
**Solução:** Verifique se a migração que cria a coluna `preferences` na tabela `profiles` foi rodada.

**Problema:** Um widget aparece "quebrado" ou vazio.
**Solução:** Verifique se o usuário tem as permissões necessárias (definidas em `requiredPermissions` no registro) e se os dados da API estão chegando corretamente.

**Problema:** O layout ficou "preso" ou estranho para um usuário específico.
**Solução:** Instrua o usuário a clicar em **"Restaurar Padrões"** dentro do modal de "Personalizar" no Dashboard. Isso limpa o cache local e força uma re-sincronização com o servidor.
