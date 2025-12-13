# Command Center Components

Este documento descreve os novos componentes de "Command Center" criados para substituir as barras de filtros antigas com um design moderno focado em alta densidade de informação e "Vertical Rhythm".

## DataToolbar

O `DataToolbar` é um componente horizontal de "Command Center" com design glassmorphism que contém busca, filtros e alternador de views.

### Características

- **Glassmorphism**: Design sutil com backdrop-blur e bordas minimalistas
- **Flexível**: Suporta slots para busca, filtros personalizados, ações e alternador de views
- **Responsivo**: Layout adaptável para mobile e desktop
- **Acessível**: Usa componentes de UI acessíveis do Radix UI

### Props

```typescript
interface DataToolbarProps {
  searchTerm?: string
  onSearchChange?: (value: string) => void
  currentView?: 'list' | 'cards' | 'kanban'
  onViewChange?: (view: 'list' | 'cards' | 'kanban') => void
  children?: ReactNode
  actions?: ReactNode
  className?: string
}
```

### Exemplo de Uso Básico

```tsx
import { DataToolbar } from '@/components/DataToolbar'
import { Button } from '@/components/ui/button'

function MyPage() {
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'cards' | 'kanban'>('list')

  return (
    <DataToolbar
      searchTerm={search}
      onSearchChange={setSearch}
      currentView={view}
      onViewChange={setView}
      actions={
        <Button>Nova Ação</Button>
      }
    >
      {/* Filtros personalizados aqui */}
    </DataToolbar>
  )
}
```

### Exemplo Completo com Filtros

```tsx
import { DataToolbar } from '@/components/DataToolbar'
import { LeadsSmartFilters } from '@/features/leads/components/LeadsSmartFilters'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

function LeadsPage() {
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'cards' | 'kanban'>('list')
  const [ownerMode, setOwnerMode] = useState<'me' | 'all' | 'custom'>('me')
  const [selectedOwners, setSelectedOwners] = useState<string[]>([])
  const [priority, setPriority] = useState<LeadPriorityBucket[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [origins, setOrigins] = useState<string[]>([])
  const [daysWithoutInteraction, setDaysWithoutInteraction] = useState<number | null>(null)
  const [orderBy, setOrderBy] = useState<'priority' | 'last_interaction' | 'created_at'>('priority')

  return (
    <div className="space-y-6">
      <DataToolbar
        searchTerm={search}
        onSearchChange={setSearch}
        currentView={view}
        onViewChange={setView}
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        }
      >
        <LeadsSmartFilters
          ownerMode={ownerMode}
          onOwnerModeChange={setOwnerMode}
          selectedOwners={selectedOwners}
          onSelectedOwnersChange={setSelectedOwners}
          priority={priority}
          onPriorityChange={setPriority}
          statuses={statuses}
          onStatusesChange={setStatuses}
          origins={origins}
          onOriginsChange={setOrigins}
          daysWithoutInteraction={daysWithoutInteraction}
          onDaysWithoutInteractionChange={setDaysWithoutInteraction}
          orderBy={orderBy}
          onOrderByChange={setOrderBy}
          users={users}
          leadStatuses={leadStatuses}
          leadOrigins={leadOrigins}
          onClear={() => {
            setOwnerMode('me')
            setSelectedOwners([])
            setPriority([])
            setStatuses([])
            setOrigins([])
            setDaysWithoutInteraction(null)
            setOrderBy('priority')
          }}
        />
      </DataToolbar>

      {/* Conteúdo da página baseado no view selecionado */}
      {view === 'list' && <LeadsList />}
      {view === 'cards' && <LeadsCards />}
      {view === 'kanban' && <LeadsKanban />}
    </div>
  )
}
```

## LeadsSmartFilters

O `LeadsSmartFilters` é uma versão compacta e otimizada dos filtros de leads, projetada para ser usada dentro do `DataToolbar`.

### Características

- **Compacto**: Filtros consolidados em um único botão com popover
- **Badges Visuais**: Mostra badges dos filtros ativos fora do popover
- **Contador**: Indica quantos filtros estão ativos
- **Interface Familiar**: Mantém a mesma lógica e opções do `LeadsSalesFiltersBar`

### Props

```typescript
interface LeadsSmartFiltersProps {
  ownerMode: 'me' | 'all' | 'custom'
  onOwnerModeChange: (mode: 'me' | 'all' | 'custom') => void
  selectedOwners: string[]
  onSelectedOwnersChange: (ids: string[]) => void
  priority: LeadPriorityBucket[]
  onPriorityChange: (values: LeadPriorityBucket[]) => void
  statuses: string[]
  onStatusesChange: (ids: string[]) => void
  origins: string[]
  onOriginsChange: (ids: string[]) => void
  daysWithoutInteraction: number | null
  onDaysWithoutInteractionChange: (value: number | null) => void
  orderBy: 'priority' | 'last_interaction' | 'created_at'
  onOrderByChange: (value: 'priority' | 'last_interaction' | 'created_at') => void
  users: User[]
  leadStatuses: OptionItem[]
  leadOrigins: OptionItem[]
  onClear: () => void
}
```

### Filtros Disponíveis

1. **Responsável**: Filtrar por "Meus leads", "Todos" ou seleção customizada de usuários
2. **Prioridade**: Filtrar por Hot, Warm ou Cold
3. **Status**: Múltipla seleção de status de leads
4. **Origem**: Múltipla seleção de origens de leads
5. **Dias sem interação**: Presets de 3, 7, 14 dias ou qualquer
6. **Ordenação**: Por prioridade, última interação ou data de criação

### Comportamento Visual

- Botão "Filtros" com ícone de funil
- Badge com contador de filtros ativos
- Badges individuais mostrando filtros selecionados
- Popover com todos os controles de filtro organizados por seção

## Diretrizes de Design

### Glassmorphism

O DataToolbar usa um design glassmorphism sutil:
- `bg-background/80`: Fundo semi-transparente
- `backdrop-blur-sm`: Blur sutil no conteúdo atrás
- `border`: Borda minimalista
- `shadow-sm`: Sombra suave (sem sombras pesadas de Card)

### Vertical Rhythm

Os componentes são projetados para manter um ritmo vertical consistente:
- Altura padrão de 9 (h-9) para inputs e botões
- Espaçamento consistente de 3 unidades (gap-3)
- Alinhamento vertical centralizado

### Responsividade

- Layout flex que adapta entre coluna (mobile) e linha (desktop)
- Componentes que quebram linha quando necessário
- Priorização de conteúdo em telas menores

## Testes

Ambos os componentes possuem testes unitários completos:
- `tests/unit/components/DataToolbar.test.tsx`
- `tests/unit/components/LeadsSmartFilters.test.tsx`

Execute os testes com:
```bash
npm run test tests/unit/components/DataToolbar.test.tsx
npm run test tests/unit/components/LeadsSmartFilters.test.tsx
```

## Próximos Passos

Para integrar esses componentes na página principal:
1. Importar `DataToolbar` e `LeadsSmartFilters` na `LeadsListPage.tsx`
2. Substituir a barra de filtros existente pelo novo Command Center
3. Conectar os estados de filtros existentes aos novos componentes
4. Testar a integração completa

## Notas Técnicas

- Os componentes usam lucide-react para ícones (em vez de phosphor-icons)
- Compatível com todos os componentes de UI existentes do shadcn/ui
- Não há alterações na lógica de negócio dos filtros
- Todos os tipos são fortemente tipados com TypeScript
