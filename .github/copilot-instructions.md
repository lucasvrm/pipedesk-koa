# GitHub Copilot Instructions

**Estas instruções são carregadas automaticamente pelo GitHub Copilot para guiar sugestões de código neste repositório.**

---

## 📘 Documentos Primários

**ANTES de fazer qualquer código, LEIA:**

1. **[GOLDEN_RULES.md](../GOLDEN_RULES.md)** - Regras completas de código e melhores práticas (v2.0)
2. **[AGENTS.md](../AGENTS.md)** - Configuração de agentes e workflow

---

## ⚡ Regras Críticas (P0)

### 1. Segurança
- ❌ Nunca commitar secrets, tokens, ou credenciais
- ✅ Sempre usar variáveis de ambiente
- ✅ Validar e sanitizar todos os inputs do usuário
- ✅ Implementar RBAC em todas as rotas protegidas

### 2. Tratamento de Erros
- ❌ Nunca engolir erros silenciosamente
- ✅ Sempre usar try-catch em operações assíncronas
- ✅ Logar erros com contexto (request ID, user ID, timestamp)
- ✅ Retornar mensagens de erro user-friendly

### 3. Resiliência de UI
- ✅ Sempre implementar: Loading, Error, e Empty states
- ✅ Usar optional chaining (`?.`) e nullish coalescing (`??`)
- ✅ Nunca assumir que dados existem sem validar

---

## 🛠️ Stack e Convenções

### Frontend (pipedesk-koa)
```typescript
// Estrutura de componente obrigatória
import { useState, useEffect, useMemo, useCallback } from 'react'

function Component() {
  // 1. Hooks de dados (useQuery, useMutation)
  const { data } = useQuery(...)
  
  // 2. useMemo
  const computed = useMemo(() => ..., [deps])
  
  // 3. useCallback
  const handler = useCallback(() => ..., [deps])
  
  // 4. useState
  const [state, setState] = useState()
  
  // 5. useEffect
  useEffect(() => { ... }, [deps])
  
  // 6. Early returns / condicionais
  if (!data) return <Loading />
  
  // 7. JSX
  return <div>...</div>
}
```

**Nomenclatura:**
- camelCase: variáveis, funções
- PascalCase: componentes, classes
- SCREAMING_SNAKE_CASE: constantes

**Bibliotecas:**
- ✅ shadcn/ui (UI components)
- ✅ lucide-react (ícones)
- ✅ Tailwind CSS (estilização)
- ❌ PROIBIDO: Phosphor Icons, FontAwesome, styled-components

---

## 🚨 Armadilhas Conhecidas

### Erro 185: TooltipTrigger Loop
```tsx
// ❌ ERRADO
<TooltipTrigger asChild>
  <Button>Click</Button>
</TooltipTrigger>

// ✅ CORRETO
<TooltipTrigger asChild>
  <span className="inline-flex">
    <Button>Click</Button>
  </span>
</TooltipTrigger>
```

### Erro 310: Hooks Fora de Ordem
```tsx
// ❌ ERRADO
if (!id) return null
const { data } = useQuery(...) // Hook após return

// ✅ CORRETO
const { data } = useQuery(...) // Hook no topo
if (!id) return null
```

### Propagação de Cliques
```tsx
// ❌ ERRADO
<Button onClick={() => handleAction()}>Action</Button>

// ✅ CORRETO (dentro de TableRow clicável)
<Button onClick={(e) => {
  e.stopPropagation()
  handleAction()
}}>Action</Button>
```

---

## ✅ Checklist Antes de Commitar

- [ ] Código segue GOLDEN_RULES.md
- [ ] Todos os estados de UI tratados (loading, error, empty)
- [ ] Hooks na ordem correta
- [ ] Erros tratados com try-catch
- [ ] Sem console.logs
- [ ] Lint e typecheck passando
- [ ] Testes escritos/atualizados

---

## 🔗 Recursos

- [GOLDEN_RULES.md](../GOLDEN_RULES.md) - Documento completo
- [AGENTS.md](../AGENTS.md) - Configuração de agentes
- [React Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Versão:** 1.0  
**Última atualização:** 2025-12-25