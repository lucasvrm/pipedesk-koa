# GOLDEN_RULES.md

Regras para escrever prompts de **GitHub Copilot Agent Session** que sejam executáveis, rápidos de convergir e com baixo risco.

## 0) Princípio central
Prompt bom = **menos texto, mais decisões executáveis**:
- objetivo claro
- guardrails explícitos
- tarefas em ordem (curtas)
- critérios de aceite verificáveis
- testes + checklist
- formato de entrega padronizado

---

## 1) Sempre declarar FE ou BE no topo
Todo prompt deve começar assim:

```md
## 📍 FRONTEND
Repo: `owner/repo`
```

ou

```md
## 📍 BACKEND
Repo: `owner/repo`
```

Proibido misturar FE e BE no mesmo prompt. Se envolver ambos, **separe em prompts distintos**.

---

## 2) Primeira tarefa obrigatória (sempre)
A primeira seção do prompt deve obrigar:

```md
### ⚠️ Primeira tarefa obrigatória
1) Ler e seguir 100%: `AGENTS.md` e `GOLDEN_RULES.md` (raiz do repo).
2) Confirmar arquivos-alvo e pontos de reuso antes de codar.
```

---

## 3) Guardrails (hard constraints) — default
O prompt deve listar explicitamente o que **não pode mudar** (salvo pedido explícito do usuário):

- ❌ Não alterar **contratos de API** (endpoints, verbos, payloads, shape de request/response)
- ❌ Não alterar **lógica de negócio** (regras, validações, cálculos)
- ❌ Não adicionar **libs novas** (a menos que o usuário peça)
- ❌ Não fazer “refactor por refactor”
- ❌ Não usar **client-side filtering** para “consertar paginação” (corrigir na origem)
- ✅ Mudanças **localizadas**, com reuso do que já existe

Se o pedido do usuário exige mudança de API, ver regra 6.

---

## 4) Regra de complexidade (evitar prompts grandes)
O prompt deve incluir **Complexidade estimada** (0–100) e obedecer:
- Se **> 85**, dividir em múltiplos prompts por responsabilidade/risco.

Heurística rápida (sem burocracia):
- mexer em muitos arquivos, refactor estrutural, ou cruzar muitas features = tende a explodir
- preferir 1 prompt por “unidade revisável” (um PR pequeno e seguro)

---

## 5) Estrutura do corpo do prompt (curta e executável)
Evite duplicar requisitos em 4 seções diferentes. Use a sequência:

1) **Resumo (2–4 bullets)**
2) **Mudanças solicitadas (4–8 itens, em ordem)**  
   - cada item com subtarefas curtas
   - referenciar arquivos-alvo e reuso (“reusar mapper X do componente Y”)
3) **Critérios de aceite (asserts verificáveis)**
4) **Testes + checklist**

Regra: se virar ensaio, está grande demais.

---

## 6) API: quando (e como) pode mudar
Default: **não mudar contrato**.

Se (e somente se) o prompt exigir mudança de API, deve ser:
- ✅ **aditiva** (backwards compatible)
- ✅ campos novos opcionais / endpoints novos versionados
- ❌ nunca remover/renomear campos existentes
- ❌ nunca mudar tipo de campo (ex.: `string` → `number`)

---

## 7) Testes e validação (obrigatório)
Todo prompt deve exigir:
- rodar lint/typecheck/tests
- adicionar/ajustar testes quando houver mudança de comportamento/UI
- checklist manual mínimo (fluxo principal + 1–2 edge cases)

Templates (ajuste conforme repo):

### Frontend
```sh
npm run lint
npm run typecheck
npm test
npm run build
```

### Backend
```sh
pytest -v
flake8 .
mypy .
```

---

## 8) Evitar screenshots locais no Copilot
Não exigir screenshots locais: ambientes do agente podem não renderizar corretamente (ex.: dependência de Supabase). Validar por testes, logs e inspeção de DOM/código.

---

## 9) Formato de entrega do agente (obrigatório)
O prompt deve obrigar o agente a encerrar com:

- Resumo do que foi feito (5–10 bullets)
- Lista de arquivos alterados/criados/removidos
- Comandos executados + resultados
- Riscos/edge cases + rollback simples
- ROADMAP final (solicitado vs implementado)

Template curto de ROADMAP final:
```md
### 📝 ROADMAP Final

| Item | Status | Observações |
|---|---|---|
| 1 | ✅ | ... |
| 2 | ⚠️ | adaptado: ... |
| 3 | ❌ | fora do escopo: ... |

Legenda: ✅ feito / ⚠️ adaptado / ❌ não feito
```

---

## 10) Esqueleto único (copiar/colar)
Todo prompt deve ser um único bloco Markdown seguindo esta ordem:

```md
# 🎯 Prompt para Agent Session — <título curto>

## 📍 <FRONTEND ou BACKEND>
Repo: `owner/repo`
Área/Rota: <...>
Escopo: <...>
Fora de escopo: <...>

## Guardrails (hard constraints)
- ...

### ⚠️ Primeira tarefa obrigatória
1) Ler `AGENTS.md` e `GOLDEN_RULES.md` e seguir 100%.
2) Confirmar arquivos-alvo e reuso.

## Resumo
- ...
- ...

## Mudanças solicitadas (ordem)
1) ...
2) ...
3) ...

## Critérios de aceite
1) ...
2) ...

## Testes
- Ajustar/remover:
- Criar/atualizar:
- Comandos:

## Checklist manual
- ...

## Formato de entrega do agente
- (itens obrigatórios + ROADMAP final)
```

---

## 11) Atualização do documento
Atualize este arquivo quando novas “lições aprendidas” surgirem (incident/review) e mantenha-o curto.
