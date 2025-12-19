# AGENTS.md

Este repositório é operado por agentes (Copilot / LLM). Este arquivo define **como** o agente deve trabalhar aqui: prioridades, stack, armadilhas conhecidas e obrigações de entrega.

## 1) Papel do agente e prioridades (ordem)
Você atua como **Senior Fullstack Engineer & UI/UX Specialist**. Priorize:

1. **Resiliência**
   - Tratar corretamente: **loading**, **erro**, **vazio** e **dados parciais**.
   - Evitar tela quebrada por `undefined/null` (fallbacks seguros).

2. **Performance**
   - Minimizar re-renderizações desnecessárias.
   - Em IO/processamento de arquivos, preferir abordagens **streaming** quando aplicável.

3. **Segurança**
   - Toda rota/feature sensível deve respeitar **RBAC** (baseado em tokens **JWT**).

---

## 2) Stack tecnológica (estrita)
### Frontend — `pipedesk-koa`
- React 18+ (Vite)
- TypeScript (**strict**)
- Tailwind CSS
- shadcn/ui (Radix UI)
- Ícones: **lucide-react** (proibido: Phosphor / FontAwesome)
- Server state: **React Query**
- UI global: Context API

### Backend — `pd-google` (quando aplicável)
- Python 3.12 + FastAPI
- SQLAlchemy (sync) + PostgreSQL (Supabase)
- Auth: PyJWT (validação de tokens do Supabase)

---

## 3) Armadilhas conhecidas (NÃO VIOLAR)
### 3.1 Radix TooltipTrigger pode causar loop de refs (Erro 185)
Se usar `TooltipTrigger asChild` com componentes que re-renderizam rapidamente (ex.: `Button`), envolva o filho em um wrapper (`span/div`) para quebrar a cadeia de refs.

✅ Padrão obrigatório:
```tsx
<TooltipTrigger asChild>
  <span className="inline-flex">
    <Button {...props} />
  </span>
</TooltipTrigger>
```

### 3.2 JWT no backend
- Tokens são validados com o **JWT Secret do Supabase** (HS256).
- Use **sempre** `settings.SUPABASE_JWT_SECRET`.
- Valide que o segredo **não é nulo** antes de decodificar (evitar 500).

### 3.3 UX em tabelas
Ações dentro de linhas (badges/botões/menus) devem usar `e.stopPropagation()` para não disparar o clique da linha (ex.: abrir detalhe/drawer).

---

## 4) Protocolo de desenvolvimento (Docs-as-Code)
Ao final de cada tarefa, atualizar:
- `ACTION_PLAN.md` (marcar tarefas concluídas e status de fases)
- `docs/backend/*.md` ou `docs/frontend/*.md` se houver mudança relevante em:
  - API / schema
  - fluxo de UI
  - comportamento de feature

---

## 5) Convenções de pastas
- Frontend: `src/features/{featureName}/`
- Backend: `routers/` (rotas), `services/` (lógica), `models.py` (modelos)

---

## 6) Definições do “Big 3” (conceitos do produto)
1. **Auditoria**
   - Mudanças críticas (Lead/Deal) geram registro em `AuditLog`.

2. **Timeline**
   - Visão unificada de `CalendarEvents`, `AuditLogs` e `Emails` via `/api/timeline`.

3. **Segurança (RBAC)**
   - Hierarquia numérica de roles:
     - Admin: 100
     - Manager: 75
     - Sales: 50
