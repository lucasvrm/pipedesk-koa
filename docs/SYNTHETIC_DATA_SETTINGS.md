# Configurações de Dados Sintéticos - Documentação

## 📍 Localização

As configurações de dados sintéticos estão localizadas em:
**`/admin/settings` → Tab "Sistema" → Seção "Configurações de Dados Sintéticos"**

## 🔑 Chaves de System Settings Utilizadas

| Chave | Tipo | Descrição | Valor Padrão |
|-------|------|-----------|--------------|
| `synthetic_default_password` | String | Senha padrão para todos os usuários sintéticos | `Password123!` |
| `synthetic_default_role_code` | String (code) | Role padrão atribuído aos usuários sintéticos | `analyst` |
| `synthetic_total_users` | Number | Quantidade alvo de usuários sintéticos a serem criados | `0` |
| `synthetic_batch_size` | Number | Tamanho do lote para criação de usuários | `10` |
| `synthetic_email_domain` | String | Domínio de e-mail para usuários sintéticos | `@example.com` |
| `synthetic_name_prefix` | String | Prefixo adicionado aos nomes dos usuários sintéticos | `Synthetic User ` |

## 🏗️ Decisão Arquitetural

### Separação de Responsabilidades

#### 1. **Configuração** (`/admin/settings` → Sistema)
- Definir parâmetros globais de geração de dados sintéticos
- Senha padrão, role, domínio de e-mail, etc.
- Armazenado na tabela `system_settings`

#### 2. **Execução** (`/admin/gerador-dados`)
- Executar a geração de dados sintéticos
- Definir quantidades específicas (empresas, leads, deals, etc.)
- Limpar dados sintéticos existentes

### Fluxo de Dados

```
┌─────────────────────────────────────────┐
│  /admin/settings → Sistema              │
│  (SystemSettingsSection)                │
│  ┌─────────────────────────────────┐   │
│  │ Configurar parâmetros globais:  │   │
│  │ - Senha padrão                  │   │
│  │ - Role padrão                   │   │
│  │ - Domínio de e-mail             │   │
│  │ - Prefixo de nome               │   │
│  │ - Batch size                    │   │
│  └─────────────────────────────────┘   │
│             │                           │
│             ↓                           │
│     Salvar em system_settings           │
└─────────────────────────────────────────┘
             │
             │ Leitura
             ↓
┌─────────────────────────────────────────┐
│  Edge Function                          │
│  (synthetic-data-admin)                 │
│  ┌─────────────────────────────────┐   │
│  │ 1. Ler configurações de         │   │
│  │    system_settings               │   │
│  │ 2. Criar usuários sintéticos     │   │
│  │    com parâmetros configurados   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
             ↑
             │ Invocação
             │
┌─────────────────────────────────────────┐
│  /admin/gerador-dados                   │
│  (SyntheticDataAdminPage)               │
│  ┌─────────────────────────────────┐   │
│  │ Executar geração:               │   │
│  │ - Gerar N usuários              │   │
│  │ - Gerar N empresas              │   │
│  │ - Gerar N leads/deals           │   │
│  │ - Limpar dados sintéticos       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## 💻 Implementação

### 1. Edge Function (`supabase/functions/synthetic-data-admin/index.ts`)

A edge function foi atualizada para ler configurações de `system_settings`:

```typescript
// Helper para buscar configuração do banco com fallback
async function getSystemSetting(supabase: any, key: string, defaultValue: any = null) {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    
    if (error || !data) {
      return defaultValue
    }
    
    // Handle different value structures
    if (data.value && typeof data.value === 'object') {
      if ('value' in data.value) return data.value.value
      if ('code' in data.value) return data.value.code
      if ('id' in data.value) return data.value.id
    }
    
    return data.value ?? defaultValue
  } catch (err) {
    console.warn(`Failed to get setting ${key}:`, err)
    return defaultValue
  }
}

async function handleCreateUsers(supabase: any, payload: any) {
  // Lê configurações de system_settings
  const defaultPassword = await getSystemSetting(supabase, 'synthetic_default_password', 'Password123!')
  const defaultRole = await getSystemSetting(supabase, 'synthetic_default_role_code', 'analyst')
  const emailDomain = await getSystemSetting(supabase, 'synthetic_email_domain', '@example.com')
  const namePrefix = await getSystemSetting(supabase, 'synthetic_name_prefix', 'Synthetic User ')
  
  // Usa configurações para criar usuários
  // ...
}
```

**Mudanças principais:**
- ✅ Removidos valores hardcoded (senha, role, domínio)
- ✅ Adicionado helper `getSystemSetting()` para buscar configurações
- ✅ Fallback para valores padrão caso configuração não exista

### 2. SyntheticDataAdminPage (`src/pages/admin/SyntheticDataAdminPage.tsx`)

A página de geração foi atualizada para:

```typescript
// Importações adicionadas
import { getSystemSetting } from '@/services/settingsService'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from '@phosphor-icons/react'

// Hook para carregar configurações padrão
useEffect(() => {
  loadDefaultSettings()
}, [])

const loadDefaultSettings = async () => {
  try {
    const totalUsers = await getSystemSetting('synthetic_total_users')
    if (totalUsers.data !== null) {
      const value = typeof totalUsers.data === 'object' && 'value' in totalUsers.data 
        ? totalUsers.data.value 
        : totalUsers.data
      if (typeof value === 'number' && value > 0) {
        setUserCount(value)
      }
    }
    
    log('✅ Configurações carregadas de system_settings')
  } catch (err: any) {
    log(`⚠️ Não foi possível carregar configurações: ${err.message}`)
  }
}
```

**Mudanças principais:**
- ✅ Carrega valores padrão de `system_settings` na montagem
- ✅ Exibe alerta informativo sobre localização das configurações
- ✅ Documentação inline atualizada

### 3. SystemSettingsSection

Já existente! A seção "Configurações de Dados Sintéticos" em `/admin/settings` → Sistema já possui todos os campos necessários:
- ✅ Senha Padrão
- ✅ Role Padrão
- ✅ Quantidade Total de Usuários
- ✅ Tamanho do Lote
- ✅ Domínio de E-mail
- ✅ Prefixo de Nome

## ✨ Benefícios

1. **Centralização**: Todas as configurações em um único lugar (`system_settings`)
2. **Consistência**: Mesmos parâmetros usados em toda a aplicação
3. **Flexibilidade**: Fácil alteração sem modificar código
4. **Segurança**: Senhas não hardcoded no código-fonte
5. **Rastreabilidade**: Mudanças registradas em `system_settings` com `updated_by` e `updated_at`
6. **Separação de Responsabilidades**: Configuração separada da execução

## 🧪 Testes Recomendados

### Fluxo Completo de Teste

1. **Configurar Parâmetros**
   - Acessar `/admin/settings` → Tab "Sistema"
   - Rolar até "Configurações de Dados Sintéticos"
   - Configurar:
     - Senha Padrão: `TestPassword123!`
     - Role Padrão: `analyst`
     - Domínio de E-mail: `@testdomain.com`
     - Prefixo de Nome: `Test User `
     - Quantidade Total: `5`
   - Clicar em "Salvar Configurações"

2. **Verificar Persistência**
   - Recarregar a página
   - Verificar que os valores foram salvos corretamente

3. **Gerar Usuários Sintéticos**
   - Acessar `/admin/gerador-dados`
   - Observar que o campo "Quantidade" está preenchido com `5` (do setting)
   - Clicar em "Gerar Usuários"
   - Verificar no log que a geração foi bem-sucedida

4. **Verificar Usuários Criados**
   - Acessar banco de dados
   - Verificar tabela `auth.users`
   - Confirmar que usuários foram criados com:
     - E-mail terminando em `@testdomain.com`
     - `user_metadata.role` = `analyst`
     - `user_metadata.full_name` começando com `Test User `

5. **Limpar Dados**
   - Clicar em "Limpar Todos os Dados Sintéticos"
   - Confirmar a ação
   - Verificar que todos os dados sintéticos foram removidos

## 📝 Notas Importantes

- **Valores Padrão**: A edge function possui fallbacks para todos os settings, garantindo que funcione mesmo sem configuração prévia
- **Validação**: Os campos no SystemSettingsSection validam os valores antes de salvar
- **Segurança**: Apenas administradores podem alterar `system_settings` (RLS policy)
- **Compatibilidade**: A implementação é retrocompatível - funciona mesmo sem configurações existentes

## 🔄 Migração de Dados Existentes

Caso existam instalações antigas com valores hardcoded, você pode criar uma migration para popular `system_settings`:

```sql
-- Inserir configurações padrão se não existirem
INSERT INTO system_settings (key, value, description)
VALUES 
  ('synthetic_default_password', '{"value": "Password123!"}', 'Senha padrão para usuários sintéticos'),
  ('synthetic_default_role_code', '{"code": "analyst"}', 'Role padrão para usuários sintéticos'),
  ('synthetic_total_users', '{"value": 0}', 'Quantidade alvo de usuários sintéticos'),
  ('synthetic_batch_size', '{"value": 10}', 'Tamanho do lote de criação'),
  ('synthetic_email_domain', '{"value": "@example.com"}', 'Domínio de e-mail para usuários sintéticos'),
  ('synthetic_name_prefix', '{"value": "Synthetic User "}', 'Prefixo de nome para usuários sintéticos')
ON CONFLICT (key) DO NOTHING;
```

## 📚 Referências

- Edge Function: `supabase/functions/synthetic-data-admin/index.ts`
- UI de Configuração: `src/pages/admin/components/settings-sections/SystemSettingsSection.tsx`
- UI de Execução: `src/pages/admin/SyntheticDataAdminPage.tsx`
- Service: `src/services/settingsService.ts`
- Tabela: `system_settings` (definida em `supabase/migrations/002_features_update.sql`)
