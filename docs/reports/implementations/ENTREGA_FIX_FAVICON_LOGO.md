# 🎯 Entrega: Fix "Remover Favicon/Logo" (23502 NOT NULL)

**Data:** 2025-12-27  
**Issue:** Erro Postgres 23502 ao remover favicon/logo  
**Status:** ✅ Implementado e testado

---

## 📋 Resumo das Mudanças

### 1. ✅ Modificado `src/services/settingsService.ts`
**Linha:** 292-336  
**Mudança:** Adicionada lógica para deletar row quando `value === null || value === undefined`

**Justificativa:** 
- A coluna `system_settings.value` é `NOT NULL` no Postgres
- Passar `null` via `upsert` causava constraint violation (23502)
- Solução: deletar a row quando queremos "remover" um setting
- Mantém compatibilidade: assinatura da função não mudou

### 2. ✅ Verificado `src/pages/admin/SettingsCustomizePage.tsx`
**Status:** Nenhuma mudança necessária  
**Motivo:** Código já trata erros corretamente

### 3. ✅ Adicionados Testes em `tests/unit/services/settingsService.test.ts`
**Novos testes:**
- DELETE com `null`
- DELETE com `undefined`
- Erro no DELETE

---

## 📁 Arquivos Alterados

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/services/settingsService.ts` | ✏️ Modificado | Adicionada lógica de DELETE para null/undefined |
| `tests/unit/services/settingsService.test.ts` | ✏️ Modificado | 3 novos testes para DELETE behavior |
| `src/pages/admin/SettingsCustomizePage.tsx` | ✅ Verificado | Nenhuma mudança necessária |

---

## ✅ Critérios de Aceite

| # | Critério | Status |
|---|----------|--------|
| 1 | Remover favicon não gera 400/23502 | ✅ |
| 2 | Remover logo não gera 400/23502 | ✅ |
| 3 | Favicon volta ao padrão após remover | ✅ |
| 4 | Logo volta ao fallback após remover | ✅ |
| 5 | Testes unitários adicionados | ✅ |
| 6 | Testes existentes continuam passando | ✅ |
| 7 | Tratamento de erro no UI | ✅ |

---

## 🔐 Edge Cases Tratados

| Edge Case | Tratamento | Status |
|-----------|------------|--------|
| `value = null` | DELETE row | ✅ |
| `value = undefined` | DELETE row | ✅ |
| `value = ""` (string vazia) | UPSERT (comportamento normal) | ✅ |
| `value = 0` | UPSERT (zero é válido) | ✅ |
| `value = false` | UPSERT (false é válido) | ✅ |
| Erro no DELETE | Retorna `{ error }` | ✅ |
| Key vazia | Validação já existente | ✅ |

---

**Versão:** 1.0  
**Autor:** GitHub Copilot  
**Review:** Pendente
