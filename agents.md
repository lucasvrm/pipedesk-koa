# AGENTS.md — PipeDesk Koa

> Instruções para agentes de código (GitHub Copilot, Codex, Jules, Claude Code)

---

## 🔧 Comandos Essenciais

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Verificar tipos
npm run typecheck

# Lint
npm run lint

# Build
npm run build

# Testes
npm test
```

---

## 📁 Estrutura do Projeto

```
src/
├── features/       # Domínios (leads, deals, timeline, etc.)
│   └── [feature]/
│       ├── components/
│       ├── hooks/
│       └── types.ts
├── components/ui/  # Componentes reutilizáveis (shadcn)
├── hooks/          # Hooks globais
├── lib/            # Utilitários e configs
│   └── databaseTypes.ts  # Tipos do Supabase (FONTE DA VERDADE)
└── pages/          # Rotas
```

---

## ✅ Regras Obrigatórias

### TypeScript
- Tipos do Supabase: usar `*Row`, `*Insert`, `*Update` de `databaseTypes.ts`
- Nunca usar `as any` sem justificativa
- Nullish: domínio usa `undefined`, DB usa `null`, payloads usam `?? null`

### React
- Hooks SEMPRE antes de qualquer `if/return`
- Componentes funcionais com hooks
- Estados: `useState`, `useReducer` — **nunca** localStorage em componentes

### Supabase
- Queries tipadas com generics
- Tratar erros de todas as queries
- Invalidar cache após mutações

---

## ❌ Proibições

1. **NÃO** alterar contratos de API existentes
2. **NÃO** alterar lógica de negócio sem autorização explícita
3. **NÃO** adicionar dependências novas
4. **NÃO** remover validações ou filtros existentes
5. **NÃO** refatorar além do escopo da tarefa
6. **NÃO** usar `console.log` em produção (usar apenas para debug temporário)

---

## ⚠️ Armadilhas Conhecidas

| Problema | Solução |
|----------|---------|
| TooltipTrigger com Button | Envolver Button em `<span>` |
| Hooks após condicionais | Mover hooks para ANTES de qualquer `if` |
| Cliques em linhas de tabela | Usar `e.stopPropagation()` em ações |
| Cache desatualizado | Invalidar query após mutação |

---

## 📋 Checklist de Entrega

Antes de finalizar qualquer tarefa:

- [ ] `npm run typecheck` passa
- [ ] `npm run lint` passa
- [ ] `npm run build` completa
- [ ] Nenhum erro no console do navegador
- [ ] Funcionalidade testada manualmente

---

## 📝 Formato de Commit

```
tipo(escopo): descrição curta

Tipos: feat, fix, refactor, docs, test, chore
Exemplo: fix(leads): corrigir badge de prioridade inconsistente
```

---

## 🔍 Quando Precisar de Contexto

1. Ler o arquivo completo antes de modificar
2. Verificar componentes similares para manter padrão
3. Checar hooks existentes em `src/hooks/` antes de criar novos
4. Consultar tipos em `src/lib/databaseTypes.ts`
