# Quick Actions Menu - Guia de Implementação

## Visão Geral

O sistema de Quick Actions (Ações Rápidas) fornece um menu contextual consistente para operações comuns em entidades do PipeDesk. Implementado usando componentes reutilizáveis, o sistema permite ações rápidas diretamente de listas e páginas de detalhes.

## Entidades com Quick Actions

### 1. **Deals (Negócios)**
Entidade central do PipeDesk para gestão de negociações M&A.

**Ações Disponíveis:**
- ✅ Editar Negócio
- ✅ Alterar Status (Ativo/Em Espera/Concluído/Cancelado)
- ✅ Adicionar Player
- ✅ Ver Analytics (AIDA)
- ✅ Gerar Documento
- ✅ Gerenciar Tags
- ✅ Duplicar Negócio
- ✅ Excluir Negócio

**Uso:**
```tsx
import { useDealQuickActions } from '@/hooks/useQuickActions'
import { QuickActionsMenu } from '@/components/QuickActionsMenu'

const actions = useDealQuickActions({
  deal,
  onEdit: () => setEditOpen(true),
  onAddPlayer: () => setAddPlayerOpen(true),
  onGenerateDoc: () => setDocGenOpen(true),
  onManageTags: () => setTagsOpen(true),
  onViewAnalytics: () => navigate(`/aida/${deal.companyId}`),
})

return <QuickActionsMenu actions={actions} />
```

---

### 2. **Tracks/Players (Participantes)**
Players representam as partes interessadas em um negócio.

**Ações Disponíveis:**
- ✅ Editar Player
- ✅ Alterar Stage (NDA → Análise → Proposta → Negociação → Fechamento)
- ✅ Atualizar Probabilidade
- ✅ Atribuir Responsável
- ✅ Adicionar Tarefa
- ✅ Ver Detalhes
- ✅ Marcar como Ganho
- ✅ Marcar como Perdido
- ✅ Excluir Player

**Uso:**
```tsx
import { useTrackQuickActions } from '@/hooks/useQuickActions'

const actions = useTrackQuickActions({
  track,
  onEdit: () => setEditOpen(true),
  onAddTask: () => setTaskOpen(true),
  onUpdateProbability: () => setProbOpen(true),
  onAssignResponsible: () => setAssignOpen(true),
})

return <QuickActionsMenu actions={actions} />
```

---

### 3. **Tasks (Tarefas)**
Gerenciamento de tarefas vinculadas a tracks.

**Ações Disponíveis:**
- ✅ Marcar como Completa/Incompleta (toggle rápido)
- ✅ Alterar Status (A Fazer/Em Progresso/Bloqueada/Concluída)
- ✅ Alterar Prioridade (Baixa/Média/Alta/Urgente)
- ✅ Editar Tarefa
- ✅ Definir Prazo
- ✅ Reatribuir
- ✅ Marcar/Remover Milestone
- ✅ Adicionar Dependência
- ✅ Excluir Tarefa

**Uso:**
```tsx
import { useTaskQuickActions } from '@/hooks/useQuickActions'

const actions = useTaskQuickActions({
  task,
  onEdit: () => setEditOpen(true),
  onSetDueDate: () => setDateOpen(true),
  onReassign: () => setAssignOpen(true),
  onAddDependency: () => setDepOpen(true),
})

return <QuickActionsMenu actions={actions} />
```

---

### 4. **Companies (Empresas)**
CRM - Gestão de empresas clientes e prospects.

**Ações Disponíveis:**
- ✅ Editar Empresa
- ✅ Adicionar Contato
- ✅ Criar Negócio
- ✅ Ver Todos os Negócios
- ✅ Gerenciar Tags
- ✅ Excluir Empresa

**Uso:**
```tsx
import { useCompanyQuickActions } from '@/hooks/useQuickActions'

const actions = useCompanyQuickActions({
  company,
  onEdit: () => setEditOpen(true),
  onAddContact: () => setContactOpen(true),
  onCreateDeal: () => setDealOpen(true),
  onManageTags: () => setTagsOpen(true),
})

return <QuickActionsMenu actions={actions} />
```

---

### 5. **Contacts (Contatos)**
CRM - Pessoas de contato nas empresas.

**Ações Disponíveis:**
- ✅ Editar Contato
- ✅ Enviar Email (abre mailto:)
- ✅ Ligar (abre tel:)
- ✅ Vincular à Empresa
- ✅ Adicionar ao Lead
- ✅ Excluir Contato

**Uso:**
```tsx
import { useContactQuickActions } from '@/hooks/useQuickActions'

const actions = useContactQuickActions({
  contact,
  onEdit: () => setEditOpen(true),
  onLinkToCompany: () => setLinkOpen(true),
  onAddToLead: () => setLeadOpen(true),
})

return <QuickActionsMenu actions={actions} />
```

---

### 6. **Leads**
Pipeline de qualificação de oportunidades.

**Ações Disponíveis:**
- ✅ Qualificar Lead (converte para Company + Deal)
- ✅ Alterar Status (Novo/Contatado/Qualificado/Desqualificado)
- ✅ Editar Lead
- ✅ Adicionar Contato
- ✅ Atribuir Responsável
- ✅ Adicionar Membro
- ✅ Gerenciar Tags
- ✅ Excluir Lead

**Uso:**
```tsx
import { useLeadQuickActions } from '@/hooks/useQuickActions'

const actions = useLeadQuickActions({
  lead,
  onEdit: () => setEditOpen(true),
  onQualify: () => setQualifyOpen(true),
  onAddContact: () => setContactOpen(true),
  onAssignOwner: () => setOwnerOpen(true),
  onAddMember: () => setMemberOpen(true),
  onManageTags: () => setTagsOpen(true),
})

return <QuickActionsMenu actions={actions} />
```

---

## Arquitetura

### Componente Base: `QuickActionsMenu`

Componente reutilizável que renderiza o menu dropdown de ações.

**Localização:** `/src/components/QuickActionsMenu.tsx`

**Props:**
- `actions: QuickAction[]` - Lista de ações a exibir
- `label?: string` - Label opcional do botão trigger
- `triggerIcon?: ReactNode` - Ícone do trigger (padrão: três pontos)
- `triggerVariant?: 'default' | 'outline' | 'ghost' | 'secondary'` - Estilo do botão
- `triggerSize?: 'default' | 'sm' | 'lg' | 'icon'` - Tamanho do botão
- `align?: 'start' | 'center' | 'end'` - Alinhamento do menu

**Funcionalidades:**
- ✅ Suporta sub-ações (menus aninhados)
- ✅ Separadores automáticos
- ✅ Ações destrutivas (vermelho)
- ✅ Disabled states
- ✅ Ícones customizáveis

### Hooks: `useQuickActions.tsx`

Hooks especializados que retornam arrays de ações para cada tipo de entidade.

**Localização:** `/src/hooks/useQuickActions.tsx`

**Hooks Disponíveis:**
- `useDealQuickActions()` - Ações para Deals
- `useTrackQuickActions()` - Ações para Tracks/Players
- `useTaskQuickActions()` - Ações para Tasks
- `useCompanyQuickActions()` - Ações para Companies
- `useContactQuickActions()` - Ações para Contacts
- `useLeadQuickActions()` - Ações para Leads

**Benefícios:**
- ✅ Lógica centralizada e reutilizável
- ✅ Consistência entre diferentes views
- ✅ Fácil manutenção
- ✅ Type-safe com TypeScript

---

## Padrões de UI/UX

### Posicionamento

1. **Em Listas (Tables/Grids)**
   - Última coluna "Ações"
   - Botão de ícone (três pontos)
   - Sempre visível

2. **Em Páginas de Detalhes**
   - Sidebar ou header
   - Pode incluir label "Ações"
   - Variant outline ou ghost

### Hierarquia de Ações

1. **Primárias** - Ações mais comuns (editar, mudar status)
2. **Secundárias** - Ações relacionadas (adicionar relacionados)
3. **Terciárias** - Ações avançadas (tags, analytics)
4. **Destrutivas** - Sempre por último, separadas (excluir)

### Separadores

Use IDs contendo "separator" para adicionar separadores visuais:

```tsx
{
  id: 'separator-1',
  label: '',
  onClick: () => {},
}
```

### Ações Destrutivas

Use `variant: 'destructive'` para ações perigosas:

```tsx
{
  id: 'delete',
  label: 'Excluir',
  icon: <Trash />,
  onClick: handleDelete,
  variant: 'destructive',
}
```

### Sub-Ações

Para agrupar ações relacionadas (ex: mudança de status):

```tsx
{
  id: 'status',
  label: 'Alterar Status',
  icon: <PlayCircle />,
  onClick: () => {}, // Não usado para parent
  subActions: [
    { id: 'status-active', label: 'Ativo', onClick: () => setActive() },
    { id: 'status-paused', label: 'Pausado', onClick: () => setPaused() },
  ],
}
```

---

## Integração RBAC

Todas as ações respeitam as permissões RBAC do PipeDesk:

- **Admin** - Acesso total a todas as ações
- **Analyst** - Pode editar e gerenciar entidades
- **New Business** - Acesso limitado a leads e prospects
- **Client** - Apenas visualização (sem quick actions)

Para adicionar checagens de permissão:

```tsx
const { profile } = useAuth()

const actions = useDealQuickActions({
  deal,
  onEdit: profile?.role !== 'client' ? () => setEditOpen(true) : undefined,
  onDelete: profile?.role === 'admin' ? () => handleDelete() : undefined,
})
```

---

## Logs de Atividade

Todas as ações que modificam dados registram atividade automaticamente:

```tsx
import { logActivity } from '@/services/activityService'

const handleStatusChange = (newStatus) => {
  updateDeal.mutate(
    { dealId: deal.id, updates: { status: newStatus } },
    {
      onSuccess: () => {
        if (profile) {
          logActivity(deal.id, 'deal', `Status alterado para ${newStatus}`, profile.id)
        }
      },
    }
  )
}
```

---

## Validações e Confirmações

### Ações Destrutivas

Sempre confirme ações destrutivas:

```tsx
const handleDelete = () => {
  if (!confirm('Tem certeza que deseja excluir?')) return
  
  deleteMutation.mutate(id, {
    onSuccess: () => toast.success('Excluído com sucesso'),
    onError: () => toast.error('Erro ao excluir'),
  })
}
```

### Validações de Negócio

Desabilite ações quando não aplicáveis:

```tsx
{
  id: 'analytics',
  label: 'Ver Analytics',
  onClick: () => navigate(`/aida/${deal.companyId}`),
  disabled: !deal.companyId, // Desabilitado se não há empresa vinculada
}
```

---

## Feedback ao Usuário

Use toasts para feedback imediato:

```tsx
import { toast } from 'sonner'

// Sucesso
toast.success('Status atualizado com sucesso')

// Erro
toast.error('Não foi possível atualizar o status')

// Info
toast.info('Nenhuma alteração detectada')

// Warning
toast.warning('Ação não pode ser desfeita')
```

---

## Exemplos Completos

### Exemplo 1: Deal List com Quick Actions

```tsx
import { QuickActionsMenu } from '@/components/QuickActionsMenu'
import { useDealQuickActions } from '@/hooks/useQuickActions'

function DealsListPage() {
  const { data: deals } = useDeals()
  
  return (
    <Table>
      <TableBody>
        {deals?.map(deal => (
          <TableRow key={deal.id}>
            <TableCell>{deal.clientName}</TableCell>
            <TableCell>{formatCurrency(deal.volume)}</TableCell>
            <TableCell>
              <QuickActionsMenu 
                actions={useDealQuickActions({ 
                  deal,
                  onEdit: () => navigate(`/deals/${deal.id}/edit`)
                })} 
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Exemplo 2: Task Card com Quick Actions

```tsx
function TaskCard({ task }: { task: Task }) {
  const actions = useTaskQuickActions({
    task,
    onEdit: () => setEditModalOpen(true),
    onSetDueDate: () => setDatePickerOpen(true),
  })
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <h3>{task.title}</h3>
          <QuickActionsMenu 
            actions={actions} 
            triggerSize="sm"
            triggerVariant="ghost"
          />
        </div>
      </CardHeader>
      <CardContent>{task.description}</CardContent>
    </Card>
  )
}
```

### Exemplo 3: Lead Detail Header

```tsx
function LeadDetailPage() {
  const { id } = useParams()
  const { data: lead } = useLead(id)
  const [qualifyOpen, setQualifyOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  
  const actions = useLeadQuickActions({
    lead,
    onQualify: () => setQualifyOpen(true),
    onEdit: () => setEditOpen(true),
    onAddContact: () => setContactOpen(true),
  })
  
  return (
    <PageHeader>
      <div className="flex items-center justify-between">
        <h1>{lead.legalName}</h1>
        <QuickActionsMenu 
          actions={actions} 
          label="Ações"
          triggerVariant="outline"
        />
      </div>
    </PageHeader>
  )
}
```

---

## Manutenção e Extensão

### Adicionando Nova Ação

1. Adicione a ação no hook correspondente em `useQuickActions.tsx`:

```tsx
export function useDealQuickActions({ deal, ...handlers }) {
  // ... existing code
  
  return useMemo(() => [
    // ... existing actions
    {
      id: 'new-action',
      label: 'Nova Ação',
      icon: <NewIcon className="h-4 w-4" />,
      onClick: () => handlers.onNewAction?.(),
      disabled: !handlers.onNewAction,
    },
  ], [deal, handlers])
}
```

2. Atualize a interface de props:

```tsx
interface UseDealQuickActionsProps {
  deal: MasterDeal
  // ... existing props
  onNewAction?: () => void
}
```

3. Use nos componentes:

```tsx
const actions = useDealQuickActions({
  deal,
  onNewAction: () => handleNewAction(),
})
```

### Criando Hook para Nova Entidade

1. Copie um hook existente como template
2. Ajuste os tipos e imports
3. Implemente as ações específicas da entidade
4. Exporte o hook

```tsx
export function useMyEntityQuickActions({
  entity,
  ...handlers
}: UseMyEntityQuickActionsProps): QuickAction[] {
  // Implementation
}
```

---

## Performance

### Memoização

Todos os hooks usam `useMemo` para evitar recriação desnecessária de arrays:

```tsx
return useMemo<QuickAction[]>(
  () => [/* actions */],
  [entity, ...dependencies]
)
```

### Lazy Loading

Handlers são opcionais e podem ser `undefined` para evitar imports desnecessários:

```tsx
onEdit?: () => void  // Opcional - componente não precisa implementar
```

---

## Testes

### Teste de Integração

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { QuickActionsMenu } from '@/components/QuickActionsMenu'

test('should trigger action when clicked', () => {
  const mockHandler = jest.fn()
  const actions = [
    { id: 'test', label: 'Test Action', onClick: mockHandler }
  ]
  
  render(<QuickActionsMenu actions={actions} />)
  
  fireEvent.click(screen.getByRole('button'))
  fireEvent.click(screen.getByText('Test Action'))
  
  expect(mockHandler).toHaveBeenCalled()
})
```

---

## Troubleshooting

### Menu não aparece
- Verifique se `actions` array não está vazio
- Confira se componente está dentro de um provider de Toast

### Ação não funciona
- Verifique se handler está definido e não é `undefined`
- Confira logs no console para erros de mutação
- Verifique permissões RBAC

### Ícones não aparecem
- Confirme import correto de `@phosphor-icons/react`
- Verifique className `h-4 w-4` nos ícones

---

## Roadmap

### Futuras Melhorias
- [ ] Keyboard shortcuts (Cmd+K)
- [ ] Busca de ações
- [ ] Ações recentes (histórico)
- [ ] Customização por usuário
- [ ] Bulk actions (ações em lote)
- [ ] Ações condicionais mais avançadas

---

**Última Atualização:** 06 de dezembro de 2025  
**Versão:** 1.0.0  
**Mantido por:** PipeDesk Core Team
