# UnifiedSidebar Component

## Visão Geral

O `UnifiedSidebar` é um componente de navegação unificado que combina um rail de ícones vertical com um painel secundário expansível. Fornece acesso rápido a perfil, gestão e configurações do sistema.

## Estrutura

```
┌──────┬─────────────────┐
│ Rail │  Painel         │
│ de   │  Expansível     │
│ Íco- │                 │
│ nes  │  - Menu Items   │
│      │  - Detalhes     │
│      │  - Configurações│
└──────┴─────────────────┘
```

## Características

### Rail de Ícones (Esquerda)
- **Logo** no topo
- **Seções principais**: Profile, Gestão, Configurações
- **Ações rápidas** no rodapé:
  - Toggle de tema (Light/Dark/System)
  - Toggle Não Perturbe (DND)
  - Ajuda
  - Avatar do usuário

### Painel Expansível (Direita)
- **Cabeçalho** com título da seção ativa
- **Informações do usuário** (quando em Profile)
- **Menu de navegação** contextual por seção
- **Rodapé** com:
  - Seletor de tema completo
  - Botão de logout

## Permissões (RBAC)

O componente respeita as permissões do usuário:

| Item | Permissão Requerida |
|------|---------------------|
| Analytics | `VIEW_ANALYTICS` |
| Google Workspace | `MANAGE_INTEGRATIONS` |
| Usuários | `MANAGE_USERS` |
| Todas as Configurações | `MANAGE_SETTINGS` |

## Props

```typescript
interface UnifiedSidebarProps {
  activeSection?: 'profile' | 'management' | 'settings';
  activeItem?: string;
  onNavigate?: (path: string) => void;
}
```

- **activeSection**: Seção ativa (opcional, detectado automaticamente da rota)
- **activeItem**: Item ativo (opcional, detectado automaticamente da rota)
- **onNavigate**: Callback customizado para navegação (opcional)

## Dependências

### Contextos
- `AuthContext` - Dados do usuário e autenticação
- `ThemeContext` - Gerenciamento de tema

### Services
- `notificationService` - Preferências de notificação e DND

### UI Components (shadcn/ui)
- Avatar
- Button
- Badge
- ScrollArea
- Tooltip

### Ícones (lucide-react)
- User, Settings, BarChart3
- Bell, BellOff
- Sun, Moon, Monitor
- LogOut, ChevronRight, Copy, Check
- HelpCircle
- E mais...

## Uso

### Básico

```tsx
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

function App() {
  return (
    <TooltipProvider>
      <div className="flex h-screen">
        <UnifiedSidebar />
        <main className="flex-1">
          {/* Conteúdo principal */}
        </main>
      </div>
    </TooltipProvider>
  );
}
```

### Com Props Customizadas

```tsx
<UnifiedSidebar 
  activeSection="settings"
  activeItem="crm"
  onNavigate={(path) => {
    // Lógica customizada antes de navegar
    console.log('Navegando para:', path);
    navigate(path);
  }}
/>
```

## Seções e Itens

### Profile
- **personal** → `/profile`
- **preferences** → `/profile/preferences`

### Management (Gestão)
- **analytics** → `/analytics` (se permitido)
- **google** → `/admin/integrations/google` (se permitido)
- **folders** → `/folders/manage`
- **users** → `/admin/users` (se permitido)

### Settings (Configurações)
Todos requerem `MANAGE_SETTINGS`:

#### CRM & Vendas
- leads
- deals
- companies

#### Produtos & Operações
- products
- operation_types
- deal_sources
- loss_reasons

#### Sistema & Segurança
- defaults
- roles
- permissions

#### Produtividade
- tasks
- tags
- templates
- holidays

#### Integrações & Automação
- dashboards
- automation

## Estados

### Loading
- Enquanto `profile` não está disponível, o componente retorna `null`

### DND (Não Perturbe)
- **Ativo**: Ícone de sino com barra (BellOff) em amarelo
- **Inativo**: Ícone de sino (Bell) normal

### Tema
- **Light**: Sol
- **Dark**: Lua
- **System**: Monitor

## Edge Cases Tratados

- ✅ Perfil nulo/undefined
- ✅ Preferências de notificação não carregadas
- ✅ Usuário sem permissões
- ✅ Navegação durante operações async
- ✅ Tooltip loop prevention (wrapper com span)
- ✅ Menu expansível com filhos

## Estilos

### Cores
- Rail: `bg-slate-900 dark:bg-slate-950`
- Painel: `bg-slate-50 dark:bg-slate-900`
- Ativo: `bg-red-500` (cor primária)
- DND: `bg-amber-500/20 text-amber-400`

### Dimensões
- Rail: `w-16` (64px)
- Painel: `w-64` (256px)
- Ícones: `h-5 w-5` ou `h-4 w-4`
- Botões rail: `h-10 w-10`

## Testes

Para testar o componente, acesse:
```
/test/unified-sidebar
```

### Checklist de Verificação

- [ ] Rail de ícones renderiza corretamente
- [ ] Seções mudam ao clicar nos ícones
- [ ] Painel expansível mostra itens corretos
- [ ] Subitens expandem/colapsam
- [ ] Toggle de tema funciona
- [ ] Toggle DND funciona
- [ ] Botão de copiar ID funciona
- [ ] Logout funciona
- [ ] Navegação funciona
- [ ] Permissões são respeitadas
- [ ] Dark mode funciona
- [ ] Tooltips aparecem corretamente

## Performance

### Otimizações Implementadas
- ✅ `useMemo` para permissões
- ✅ `useMemo` para seções do menu
- ✅ `useMemo` para detecção de seção/item ativo
- ✅ `useMemo` para dados derivados (initials, avatar, etc)
- ✅ Detecção automática de seção baseada em rota
- ✅ Invalidação de cache após mutations

## Troubleshooting

### Tooltips não aparecem
Certifique-se de ter `<TooltipProvider>` envolvendo o componente.

### Navegação não funciona
Verifique se está dentro de um `<BrowserRouter>`.

### Tema não persiste
Verifique se `ThemeContext` está no nível correto da árvore.

### DND não salva
Verifique se o `profile.id` está disponível e se as preferências foram criadas.

## Melhorias Futuras

- [ ] Suporte a badges de notificação por seção
- [ ] Animações de transição entre seções
- [ ] Suporte a atalhos de teclado
- [ ] Modo compacto (rail apenas)
- [ ] Busca dentro do menu
- [ ] Histórico de navegação
- [ ] Favoritos customizáveis

## Changelog

### 2024-12-24 - v1.0.0
- ✅ Implementação inicial
- ✅ Rail de ícones
- ✅ Painel expansível
- ✅ Suporte a RBAC
- ✅ Toggle de tema
- ✅ Toggle DND
- ✅ Navegação por seções
- ✅ Subitens expansíveis
