📋 **INSTRUÇÕES PARA CRIAÇÃO DE PROMPTS** Sempre
📋 INSTRUÇÕES PARA CRIAÇÃO DE PROMPTS
✅ CHECKLIST OBRIGATÓRIO
1. Ler Documentação Base
•	 Ler AGENTS.md completamente
•	 Ler GOLDEN_RULES.md completamente
•	 Seguir 100% das regras documentadas
2. Analisar Código Real (NUNCA ASSUMIR)
•	 Buscar linhas exatas dos arquivos que serão modificados
•	 Verificar estrutura real: pastas, arquivos, componentes existentes
•	 Comparar linha a linha quando envolver múltiplos arquivos similares
•	 Validar imports, exports, funções, classes que serão referenciados
•	 Confirmar nomes exatos: variáveis, props, tipos, interfaces
3. Documentar com Precisão Cirúrgica
•	 Especificar número de linha exato para cada modificação
•	 Citar código real (não inventar classes, props ou estruturas)
•	 Incluir ANTES/DEPOIS com código verdadeiro do repositório
•	 Referenciar commits/SHA quando apropriado
4. Validar Pré-requisitos
•	 Confirmar que funções/componentes referenciados existem
•	 Verificar que imports necessários estão disponíveis
•	 Checar dependências entre arquivos antes de propor mudanças
5. Ser Específico e Factual
•	 Usar linguagem cirúrgica: "Linha 257: modificar X para Y"
•	 Evitar termos vagos: "procurar por", "aproximadamente", "similar a"
•	 Nunca inventar: classes CSS, props, funções, estruturas de pastas
•	 Se não souber, buscar no código ou perguntar antes

❌ PROIBIÇÕES ABSOLUTAS
Nunca Fazer:
1.	❌ Assumir estrutura de código sem verificar
2.	❌ Inventar nomes de classes, variáveis ou funções
3.	❌ Usar "deve ter", "provavelmente", "talvez"
4.	❌ Referenciar linhas aproximadas ("~linha 100")
5.	❌ Copiar padrões de outros projetos sem validar
6.	❌ Propor modificações sem confirmar que arquivo/função existe
7.	❌ Omitir validações de pré-requisitos
Sempre Fazer:
1.	✅ Buscar código real no repositório
2.	✅ Validar cada linha referenciada
3.	✅ Comparar arquivos antes de propor mudanças
4.	✅ Documentar linhas exatas e código verdadeiro
5.	✅ Listar dependências e pré-requisitos
6.	✅ Incluir validações no prompt (checksums, testes)

🎯 METODOLOGIA DE CRIAÇÃO
Passo 1: Investigação
1. Ler issue/necessidade
2. Identificar arquivos envolvidos
3. Buscar código real (lexical-code-search, githubread)
4. Anotar linhas exatas e estruturas
5. Comparar com arquivos similares (se aplicável)
Passo 2: Validação
1. Confirmar que funções/componentes existem
2. Verificar imports disponíveis
3. Checar tipos/interfaces
4. Validar nomenclatura (camelCase, PascalCase, etc.)
5. Revisar dependências entre arquivos
Passo 3: Documentação
1. Especificar linhas exatas
2. Incluir código ANTES (real)
3. Incluir código DEPOIS (proposto)
4. Adicionar contexto e raciocínio
5. Listar pré-requisitos e validações
Passo 4: Revisão
1. Reler prompt completo
2. Confirmar que não há invenções
3. Validar que todas as referências são reais
4. Checar que instruções são executáveis
5. Garantir linguagem cirúrgica e factual

📐 TEMPLATE DE VERIFICAÇÃO
Antes de entregar qualquer prompt, responder:
Perguntas Críticas:
1.	Verifiquei o código real? (Sim/Não)
2.	Todas as linhas são exatas? (Sim/Não)
3.	Validei que funções/imports existem? (Sim/Não)
4.	Comparei com arquivos similares (se aplicável)? (Sim/Não)
5.	Usei apenas informações factuais? (Sim/Não)
6.	Evitei assumir ou inventar? (Sim/Não)
Se alguma resposta for "Não":
•	PARAR e revisar
•	Buscar código real
•	Validar informações
•	Reescrever com precisão

🚀 RESULTADO ESPERADO
Um prompt que:
•	✅ Referencia linhas exatas do código
•	✅ Cita código real (não inventado)
•	✅ Inclui validações de pré-requisitos
•	✅ Usa linguagem cirúrgica e factual
•	✅ É 100% executável sem ambiguidades
•	✅ Pode ser seguido literalmente por outro desenvolvedor

💡 EXEMPLO DE BOA PRÁTICA
❌ ERRADO:
Code
"Modifique o componente para usar full width, 
provavelmente removendo alguma classe de largura máxima"
✅ CORRETO:
Code
Arquivo: src/pages/ProfilePreferencesPage.tsx
Linha:  257
ANTES: className="max-w-5xl space-y-6"
DEPOIS: className="space-y-6"
Ação: Remover "max-w-5xl" (manter "space-y-6")
Motivo: Replicar padrão de ProfileActivityPage. tsx linha 95
