# Fase 2: Relationship & Context (Entrega)

## 1. Buying Committee Visualizer (Mapa de Influência)

Implementamos uma visualização rica para os contatos, permitindo identificar rapidamente quem decide.

### Alterações Realizadas
*   **Database Migration:** Criado arquivo `supabase/migrations/20250225000000_add_buying_committee_fields.sql` adicionando colunas `buying_role` e `sentiment` à tabela `contacts`.
*   **Frontend Types:** Atualizada interface `Contact` em `src/lib/types.ts`.
*   **Novo Componente:** `src/components/BuyingCommitteeCard.tsx`.
*   **Integração:** Substituída a lista simples de contatos na sidebar do `LeadDetailPage` pelo novo visualizador.

### Valores Hardcoded (Enums)
Estes valores estão definidos no código (`BuyingCommitteeCard.tsx`) e no banco de dados (Check Constraints).

**Buying Roles:**
| Chave | Rótulo | Ícone |
| :--- | :--- | :--- |
| `decision_maker` | Decisor | 👑 (Coroa Amarela) |
| `influencer` | Influenciador | 📣 (Megafone Azul) |
| `blocker` | Bloqueador | 🛡️ (Escudo Vermelho) |
| `champion` | Campeão | 🏆 (Troféu Esmeralda) |
| `user` | Usuário | 👤 (Usuário Cinza) |
| `gatekeeper` | Gatekeeper | 🔒 (Cadeado Roxo) |

**Sentiment:**
| Chave | Cor da Borda (Avatar) |
| :--- | :--- |
| `positive` | Verde (Emerald-500) |
| `neutral` | Cinza (Slate-400) |
| `negative` | Vermelho (Red-500) |
| `unknown` | Tracejado (Slate-200) |

---

## 2. Unified Timeline (Feed Cronológico)

Unificamos a visão do histórico do negócio.

### Alterações Realizadas
*   **Novo Hook:** `src/hooks/useUnifiedTimeline.ts` (Agrega comentários e prepara terreno para audit logs).
*   **Novo Componente:** `src/components/UnifiedTimeline.tsx` (UI estilo feed vertical).
*   **Integração:** Substituída a aba/conteúdo de "Comentários" em `LeadDetailPage` e `DealDetailPage` pelo novo componente.

### Funcionalidades
*   **Filtros:** Toggles para "Tudo", "Comentários" e "Sistema".
*   **Visual:** Linha do tempo conectada com ícones distintos para comentários (azul) e eventos de sistema (cinza).
*   **Input Rápido:** Área de texto para novo comentário integrada no rodapé do card.

---

## Próximos Passos (Sugestão)
1.  **Executar Migration:** Rodar o SQL no Supabase para habilitar os campos.
2.  **Popular Dados:** Editar contatos para atribuir papéis e sentimentos.
3.  **Backend de Timeline:** Implementar endpoint real que retorne `audit_logs` misturados com `comments` para popular o filtro "Sistema".
