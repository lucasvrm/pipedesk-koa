# 🎲 PipeDesk Synthetic Data Generator

Este script gera dados sintéticos realistas para popular o PipeDesk com informações de M&A para demonstração e testes.

## 🚀 Como Usar

### 1. Configurar Variáveis de Ambiente

Primeiro, configure suas credenciais do Supabase no arquivo `.env`:

```bash
cp .env.example .env
# Edite o .env com suas credenciais do Supabase
```

### 2. Executar o Gerador

```bash
npm run generate-data
```

## 📊 Dados Gerados

O script cria um dataset completo e realista incluindo:

### 👥 Usuários (25)
- **Admin**: Lucas Vieira (lucas@pipedesk.com)
- **Analistas**: Profissionais de M&A
- **Clientes**: Representantes de empresas
- **New Business**: Equipe de desenvolvimento de negócios

### 💼 Master Deals (15)
- Volumes de $5M a $500M
- Tipos: Aquisição, Fusão, Investimento, Desinvestimento
- Status: Ativo, Cancelado, Concluído
- Prazos realistas e observações

### 🎯 Player Tracks (30-90)
- 2-6 players por deal
- Estágios: NDA → Análise → Proposta → Negociação → Fechamento
- Probabilidades baseadas no estágio
- Responsáveis e volumes realistas

### ✅ Tasks (90-1080)
- 3-12 tarefas por track
- Templates específicos de M&A:
  - "Sign NDA with {player}"
  - "Conduct financial analysis"
  - "Prepare valuation model"
  - "Due diligence checklist"
  - "Legal review and approval"
- Status, prioridades e dependências
- Marcos importantes

### 💬 Comentários (0-8 por entidade)
- Comentários realistas de M&A
- Sistema de menções (@user)
- Histórico de atividades

### 📁 Folders & Cross-Tagging (12)
- Estrutura hierárquica:
  - **Active Deals** (Projetos)
  - **M&A Team** (Equipes)
  - **Q4 2024** (Sprints)
  - **Technology Sector** (Categorias)
- Cross-tagging: entidades em múltiplas pastas
- Cores e ícones personalizados

### 🔔 Notificações (50)
- Tipos: Menções, Atribuições, Mudanças de Status
- Links para contexto
- Status lido/não lido

### 📈 Histórico de Estágios
- Rastreamento completo de progressão
- Duração em cada estágio
- Timestamps realistas

### 🔧 Custom Fields (8)
- **Deal Fields**:
  - Industry Sector (Technology, Healthcare, Finance, Manufacturing)
  - Deal Source (Referral, Cold Outreach, Existing Client, Partner)
  - Synergy Value (numérico)
  - Regulatory Concerns (texto longo)
  - Strategic Fit (Excellent, Good, Fair, Poor)

- **Track Fields**:
  - Risk Level (Low, Medium, High, Critical)
  - Key Contact (texto)
  - Competition Level (None, Low, Medium, High)

## ⚙️ Configuração Avançada

Você pode personalizar a geração editando as constantes no arquivo `generate-synthetic-data.ts`:

```typescript
const CONFIG = {
  users: 25,                              // Número de usuários
  masterDeals: 15,                        // Número de deals
  playerTracksPerDeal: { min: 2, max: 6 }, // Players por deal
  tasksPerTrack: { min: 3, max: 12 },     // Tarefas por track
  commentsPerEntity: { min: 0, max: 8 },  // Comentários por entidade
  folders: 12,                            // Número de pastas
  customFields: 8,                        // Campos customizados
  notifications: 50                       // Notificações
}
```

## 🎯 Dados Realistas de M&A

### Empresas
- 28 nomes de empresas realistas por setor
- Volumes financeiros apropriados ($5M-$500M)
- Tipos de operação típicos de M&A

### Templates de Tarefas
- Baseados em workflows reais de M&A
- Sequência lógica de atividades
- Marcos importantes identificados

### Probabilidades por Estágio
- **NDA**: 10-30%
- **Análise**: 25-50%
- **Proposta**: 40-70%
- **Negociação**: 60-85%
- **Fechamento**: 80-95%

## 🔒 Segurança

- **Dados Fictícios**: Todos os dados são completamente sintéticos
- **Sem PII**: Nenhuma informação pessoal real é usada
- **Limpeza Automática**: O script limpa dados existentes antes de gerar novos

## 🛠️ Troubleshooting

### Erro de Conexão Supabase
```
Error: Invalid Supabase URL or Key
```
**Solução**: Verifique suas credenciais no arquivo `.env`

### Erro de Permissões
```
Error inserting into table: permission denied
```
**Solução**: Verifique se sua chave Supabase tem permissões de escrita

### Erro de Dependências
```
Module not found: @faker-js/faker
```
**Solução**: Execute `npm install` para instalar dependências

## 📝 Logs de Execução

O script fornece logs detalhados durante a execução:

```
🚀 Starting synthetic data generation for PipeDesk...

🧹 Clearing existing data...
🧑‍💼 Generating users...
📊 Generating pipeline stages...
📁 Generating folders...
💼 Generating master deals...
🎯 Generating player tracks...
✅ Generating tasks...
💬 Generating comments...
🔔 Generating notifications...
📍 Generating entity locations (cross-tagging)...
📈 Generating stage history...
🔧 Generating custom fields...

📝 Inserting records into database...

✅ Synthetic data generation completed successfully!

📊 Generated:
   👥 25 users
   💼 15 master deals
   🎯 45 player tracks
   ✅337 tasks
   💬 156 comments
   🔔 50 notifications
   📁 12 folders
   📍 92 entity locations
   📈 123 stage history records
   🔧 8 custom field definitions
   📝 67 custom field values

🎉 Ready to explore PipeDesk with realistic data!
```

## 🎉 Resultado

Após a execução, você terá um PipeDesk completamente populado com:
- Deals em diferentes estágios
- Relacionamentos realistas entre entidades
- Histórico de atividades
- Comentários e notificações
- Estrutura organizacional com pastas
- Campos customizados preenchidos

Perfeito para demonstrações, testes e desenvolvimento! 🚀