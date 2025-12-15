# 📋 ACTION_PLAN.md - Priority Tooltip Colors

## ✅ Status: CONCLUÍDO

**Data:** 2025-12-15  
**Autor:** GitHub Copilot Agent  
**Escopo:** Frontend - LeadSalesRow.tsx (Priority Tooltip)

---

## 🎯 Objetivo

Ajustar as cores dos tooltips de prioridade na rota `/leads` para melhorar UI/UX:
- **Alta (hot):** Vermelho
- **Média (warm):** Amarelo
- **Baixa (cold):** Azul

---

## 📝 Alterações Realizadas

### Arquivo Modificado
- `src/features/leads/components/LeadSalesRow.tsx`

### Cores Aplicadas (Tooltips de Prioridade)

| Prioridade | Bucket | Cor de Fundo | Cor do Texto | Classes Tailwind CSS |
|------------|--------|--------------|--------------|---------------------|
| **Alta** | hot | Vermelho | Branco | `bg-red-600 text-white` |
| **Média** | warm | Amarelo | Cinza escuro | `bg-yellow-400 text-gray-900` |
| **Baixa** | cold | Azul | Branco | `bg-blue-600 text-white` |

### Mudanças de Código

1. **Adicionado mapeamento de cores para tooltips:**
   ```typescript
   const PRIORITY_TOOLTIP_COLORS: Record<LeadPriorityBucket, string> = {
     hot: 'bg-red-600 text-white',
     warm: 'bg-yellow-400 text-gray-900',
     cold: 'bg-blue-600 text-white'
   }
   ```

2. **Aplicado cores ao TooltipContent:**
   ```typescript
   <TooltipContent className={`max-w-xs text-left space-y-1 ${PRIORITY_TOOLTIP_COLORS[safePriorityBucket]}`}>
   ```

3. **Ajustado opacidade do texto:**
   - Removido classes `text-primary-foreground` e `text-primary-foreground/80`
   - Substituído por `opacity-90` para manter legibilidade sobre fundos coloridos

---

## ✅ Checklist de Qualidade

| Item | Status |
|------|--------|
| Lint LeadSalesRow.tsx | ✅ Sem novos erros |
| Build de produção | ✅ Compilou com sucesso |
| Cores de tooltip aplicadas corretamente | ✅ Hot=vermelho, Warm=amarelo, Cold=azul |
| Contraste/legibilidade garantidos | ✅ WCAG AA (branco sobre red/blue, cinza escuro sobre yellow) |
| Mudança localizada (sem alteração global) | ✅ Apenas TooltipContent de prioridade |
| Lógica de cálculo de prioridade preservada | ✅ Nenhuma alteração |
| Dados do tooltip preservados | ✅ Nenhuma alteração no conteúdo |
| TypeCheck passando | ✅ Sem novos erros |

---

## 📊 Medição de Impacto

| Métrica | Valor |
|---------|-------|
| Linhas adicionadas | 6 (mapeamento PRIORITY_TOOLTIP_COLORS) |
| Linhas modificadas | 8 (TooltipContent className e opacidade) |
| Arquivos criados | 0 |
| Arquivos modificados | 1 (LeadSalesRow.tsx) |
| Componentes criados | 0 |
| Componentes modificados | 1 (tooltip de prioridade no LeadSalesRow) |
| APIs alteradas | 0 |
| Contratos quebrados | 0 |

**Risco:** ⚪ Baixo (mudança visual localizada, sem alteração de lógica de negócio)

---

## 📝 ROADMAP Final

| Item Solicitado | Status | Observações |
|-----------------|--------|-------------|
| Aplicar cor vermelha no tooltip de prioridade Alta | ✅ | `bg-red-600 text-white` |
| Aplicar cor amarela no tooltip de prioridade Média | ✅ | `bg-yellow-400 text-gray-900` |
| Aplicar cor azul no tooltip de prioridade Baixa | ✅ | `bg-blue-600 text-white` |
| Garantir contraste/legibilidade do texto | ✅ | Branco sobre fundos escuros, cinza escuro sobre amarelo |
| Evitar alterações globais no componente Tooltip | ✅ | Mudança localizada apenas no TooltipContent de prioridade |
| Preservar lógica de cálculo de prioridade | ✅ | Nenhuma alteração nos buckets ou scores |
| Preservar dados do tooltip | ✅ | Mantido label, score e description |
| Lint/TypeCheck passando | ✅ | Sem novos erros (erros pré-existentes não relacionados) |
| Build passando | ✅ | Compilação bem-sucedida em 17.19s |
| Atualizar ACTION_PLAN.md | ✅ | Arquivo atualizado com todas as mudanças |

---

## Decisões Técnicas

1. **Por que não alterar o componente Tooltip globalmente?**
   - Reduzir blast radius (evitar impacto em outros tooltips do sistema)
   - Mudança localizada é mais segura e fácil de revisar
   - Permite manter outros tooltips com estilo padrão do design system

2. **Por que usar mapeamento direto ao invés de função auxiliar?**
   - Mapeamento direto via Record é mais simples e performático
   - Facilita manutenção e deixa lógica explícita
   - Typescript garante type-safety sem código adicional

3. **Por que usar Tailwind ao invés de styled-components ou CSS modules?**
   - Seguindo padrão estabelecido no AGENTS.md (Tailwind CSS é a tecnologia de UI oficial)
   - Consistência com o resto do projeto

4. **Por que escolher estas cores específicas?**
   - **Vermelho (hot):** Sinaliza urgência/prioridade alta (padrão universal)
   - **Amarelo (warm):** Sinaliza atenção moderada
   - **Azul (cold):** Cor fria, indica baixa prioridade
   - Contraste WCAG AA garantido para acessibilidade

5. **Por que usar `opacity-90` ao invés de classes específicas de cor?**
   - Permite que o texto se adapte automaticamente à cor de fundo
   - Mantém hierarquia visual (título mais forte, conteúdo secundário mais suave)
   - Reduz complexidade do código (menos classes condicionais)
