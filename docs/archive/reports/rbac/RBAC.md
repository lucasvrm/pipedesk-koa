# Guia de RBAC e Permissões

## Contrato de RBAC (Governança)
Esta seção define o **estado desejado** do sistema de permissões. Todo desenvolvimento deve seguir estas regras.

### Lista de permissões
A tabela abaixo espelha a lista canônica de permissões **semeadas nas migrações do Supabase**. Use-a para validar se um código realmente existe no banco antes de criar uma nova proteção de UI ou API.

| Módulo | Permissão | Descrição |
|--------|-----------|-----------|
| **Tracks** | `tracks.view` | Visualizar tracks e seus detalhes. |
| | `tracks.create` | Criar novas tracks. |
| | `tracks.update` | Atualizar tracks existentes. |
| | `tracks.manage` | Administração completa de tracks (inclui exclusão/configurações). |
| **Pipeline** | `pipeline.manage` | Acessar a página de configurações do Pipeline (`/admin/pipeline`). |
| | `pipeline.update` | Atualizar estágios, SLAs e transições. |
| **Tags** | `tags.manage` | Acessar a página de configurações de tags (`/admin/tags`). |
| | `tags.update` | Criar/Editar/Excluir tags globais. |
| **Campos personalizados**| `custom_fields.manage` | Acessar a página de Campos Personalizados (`/custom-fields`). |
| **RBAC** | `rbac.manage` | Gerenciar papéis e permissões (`/rbac` ou `/admin/users`). |
| **Leads** | `leads.view` | Visualizar a lista de leads e seus detalhes. |
| | `leads.create` | Criar novos leads. |
| | `leads.update` | Editar detalhes do lead. |
| | `leads.qualify` | Executar a qualificação do lead (converter em Deal). |
| | `leads.delete` | Excluir leads. |
| **Contacts** | `contacts.view` | Visualizar lista e detalhes de contatos. |
| | `contacts.create` | Criar novos contatos. |
| | `contacts.update` | Editar detalhes do contato. |
| | `contacts.delete` | Excluir contatos. |
| **Companies** | `companies.view` | Visualizar lista e detalhes de empresas. |
| | `companies.create` | Criar novas empresas. |
| | `companies.update` | Editar detalhes da empresa. |
| | `companies.delete` | Excluir empresas. |

> **Códigos inexistentes:** As seeds atuais **não** definem `pipeline.create`, `pipeline.delete`, `pipeline.view`, `tags.create`, `tags.delete`, `tags.view` ou `companies.manage`. Se algum desses for necessário, ele deve ser incluído nas migrações (004/006/008) antes de ser referenciado no código.

---

## Cobertura de implementação (status)
Status atual da aplicação das permissões no código.

| Permissão | Aplicação no backend (RLS/Service) | Proteção no frontend (Rota/UI) | Observações |
|-----------|------------------------------------|--------------------------------|-------------|
| `tracks.*` | ✅ Aplicada no banco | ❌ **Faltando** | A rota `/tracks/:id` não tem verificação. |
| `pipeline.*` | ✅ Aplicada no banco | ⚠️ Parcial (papel `admin`) | |
| `tags.*` | ✅ Aplicada no banco | ⚠️ Parcial (papel `admin`) | |
| `custom_fields.*`| ❌ **Faltando** | ❌ **Faltando** | |
| `rbac.manage` | ⚠️ Pressuposta via papel `admin` | ⚠️ Parcial (papel `admin`) | |
| `leads.*` | ✅ Aplicada no banco (RLS: `010`) | ✅ Totalmente aplicada | Botões de Criar/Atualizar/Qualificar protegidos. RPC verificado. |
| `contacts.*` | ✅ Aplicada no banco (RLS: `010`) | ✅ Totalmente aplicada | Botões de Criar/Editar/Excluir protegidos. |
| `companies.*` | ✅ Aplicada no banco (RLS: `010`) | ⚠️ Parcial | Página de listagem protegida por papel, não por permissão. |

> **Legenda**:
> - ✅ = Totalmente implementado e verificado.
> - ⚠️ = Implementado via verificação por "papel" (legado) em vez de permissão granular.
> - ❌ = Não aplicado.

## Estratégia de aplicação
O sistema usa uma estratégia de aplicação em duas camadas:

1.  **Frontend (UX):** Use o componente `<RequirePermission>` para ocultar/desabilitar elementos de UI.
    ```tsx
    <RequirePermission permission="leads.qualify">
      <Button>Qualify</Button>
    </RequirePermission>
    ```

2.  **Backend (Segurança):** Políticas de RLS do Supabase usando `public.has_permission(code)`.
    ```sql
    CREATE POLICY "Contacts update" ON contacts
      FOR UPDATE USING (public.has_permission('contacts.update'));
    ```
    E verificações em RPCs para transações complexas:
    ```sql
    IF NOT public.has_permission('leads.qualify') THEN
      RAISE EXCEPTION 'Access Denied';
    END IF;
    ```

---

## Plano de melhorias de RBAC (visão do proprietário)
Se tratássemos RBAC como um produto, estas seriam as próximas melhorias de maior impacto:

### 1) Reforçar o modelo de permissões
- **Adicionar simetria de CRUD**: introduzir `pipeline.view|create|delete` e `tags.view|create|delete` (mais `companies.manage`) nas seeds e nas políticas de RLS para alinhar com as expectativas de UI e reduzir dependência de verificações por papel.
- **Escopo explícito para configurações**: dividir `pipeline.manage` e `tags.manage` em permissões de "configurações" vs "dados" para permitir que auditores só leitura inspecionem configurações sem alterá-las.
- **Namespace de permissões de sistema**: adicionar `system.audit` e `system.impersonate` para acesso a logs de auditoria e suporte a ferramentas administrativas com uso restrito e justificado.

### 2) Fechar lacunas de aplicação
- **Guarda de rota em todo lugar**: envolver páginas administrativas (`/admin/pipeline`, `/admin/tags`, `/rbac`, `/companies`) com `RequirePermission` em vez de verificações por papel para manter a UX alinhada ao RLS do backend.
- **Testes de paridade de RLS**: adicionar suítes Vitest que comparem o mapa de permissões do frontend com as seeds de `permissions` do Supabase para detectar divergências.
- **Lint para proteção em RPCs**: criar uma regra de lint (regra customizada do ESLint ou verificação em CI) que rejeite novas chamadas RPC sem checagem de `has_permission()`.

### 3) Melhorar operabilidade e auditabilidade
- **Histórico de alterações de permissões**: adicionar uma tabela `audit_permissions` (papel, permissão, autor, data/hora, motivo) e registrar entradas a partir das mutações de API.
- **Inspector de permissão efetiva**: construir uma UI `/rbac/inspector` que resolva as permissões efetivas de um usuário (grants de papéis + overrides) e mostre por que uma verificação passou ou falhou.
- **Feature flags para rollout de RBAC**: colocar novas permissões atrás de uma feature flag para permitir migração gradual sem quebrar papéis existentes.

### 4) Ergonomia para desenvolvedores
- **Constantes de permissão com tipagem**: exportar um `permissions.ts` gerado a partir das seeds para evitar códigos de permissão como strings soltas no frontend e backend.
- **Geradores de fixture**: adicionar fábricas de teste que criem usuários com pacotes de permissões específicos para reduzir boilerplate em testes de integração.
- **Documentação como contrato**: manter este arquivo sincronizado com as seeds via script (ex.: `pnpm docs:sync-permissions`) para que o guia seja a única fonte da verdade.
