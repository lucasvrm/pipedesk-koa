import { useState } from 'react'
import { X, MagnifyingGlass, Question } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// REMOVIDO: Dialog imports, pois agora é uma página
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface HelpArticle {
  id: string
  title: string
  category: string
  content: string
}

const helpArticles: HelpArticle[] = [
  {
    id: '1',
    title: 'Como criar um novo negócio?',
    category: 'Primeiros Passos',
    content: `
# Como criar um novo negócio

Para criar um novo negócio no PipeDesk, siga estes passos:

1. **Clique no botão "Novo Negócio"** localizado no canto superior direito da tela
2. **Preencha as informações básicas**:
   - Nome do cliente
   - Valor estimado do negócio
   - Tipo de operação (Aquisição, Fusão, Investimento, etc.)
   - Prazo/Deadline
3. **Adicione observações** (opcional) para contexto adicional
4. **Clique em "Criar"** para salvar o negócio

O negócio será criado com status "Ativo" e aparecerá imediatamente na sua lista de negócios.
    `,
  },
  {
    id: '2',
    title: 'O que é o Kanban e como usá-lo?',
    category: 'Funcionalidades',
    content: `
# O que é o Kanban?

O Kanban é uma visualização em quadro que permite organizar seus negócios em colunas representando diferentes estágios do pipeline.

## Como usar o Kanban

- **Visualizar negócios**: Cada card representa um negócio e mostra informações resumidas
- **Mover cards**: Arraste e solte os cards entre as colunas para atualizar o estágio
- **Detalhes**: Clique em um card para ver ou editar os detalhes completos

## Estágios padrão

1. **NDA** - Negociação de acordo de confidencialidade
2. **Análise** - Análise preliminar do negócio
3. **Proposta** - Elaboração e apresentação de proposta
4. **Negociação** - Negociação de termos e condições
5. **Fechamento** - Finalização do negócio
    `,
  },
  {
    id: '3',
    title: 'Como personalizar as fases do pipeline?',
    category: 'Configurações',
    content: `
# Personalizando as Fases do Pipeline

Você pode customizar as fases (colunas) do seu Kanban para refletir o processo específico da sua empresa.

## Passos para personalizar

1. Acesse **Configurações** > **Fases do Pipeline**
2. Você pode:
   - **Adicionar** novas fases clicando em "Nova Fase"
   - **Renomear** fases existentes
   - **Reordenar** arrastando e soltando
   - **Alterar cores** para facilitar identificação visual
   - **Excluir** fases não utilizadas

⚠️ **Atenção**: Ao excluir uma fase, os negócios nela contidos serão movidos para a fase anterior.
    `,
  },
  {
    id: '4',
    title: 'Como gerenciar tarefas de um negócio?',
    category: 'Tarefas',
    content: `
# Gerenciamento de Tarefas

Cada negócio pode ter múltiplas tarefas associadas para organizar o trabalho necessário.

## Criar uma tarefa

1. Abra os detalhes de um negócio
2. Vá para a aba "Tarefas"
3. Clique em "Nova Tarefa"
4. Preencha:
   - Título da tarefa
   - Descrição
   - Responsáveis
   - Prazo
   - Prioridade

## Recursos de tarefas

- **Dependências**: Defina quais tarefas precisam ser concluídas primeiro
- **Milestones**: Marque tarefas importantes como marcos
- **Status**: Acompanhe o progresso (A fazer, Em andamento, Bloqueada, Concluída)
- **Comentários**: Colabore com a equipe através de comentários
    `,
  },
  {
    id: '5',
    title: 'Entendendo o Dashboard de Analytics',
    category: 'Analytics',
    content: `
# Dashboard de Analytics

O dashboard fornece uma visão geral do desempenho do seu pipeline.

## Métricas principais

- **Total de Negócios**: Quantidade total de negócios ativos
- **Taxa de Conversão**: Percentual de negócios concluídos com sucesso
- **Tempo Médio de Fechamento**: Tempo médio para conclusão de um negócio
- **Pipeline Ponderado**: Valor total considerando probabilidade de cada estágio

## Gráficos

- **Negócios por Estágio**: Distribuição dos negócios nas diferentes fases
- **Funil de Conversão**: Visualização da progressão entre estágios
- **Tendências**: Evolução temporal dos indicadores

💡 **Dica**: Use os filtros para analisar períodos específicos ou segmentar por tipo de operação.
    `,
  },
  {
    id: '6',
    title: 'Notificações e Central de Avisos',
    category: 'Notificações',
    content: `
# Notificações

O PipeDesk mantém você informado sobre eventos importantes através da central de notificações.

## Tipos de notificações

- **Menções**: Quando alguém te menciona em um comentário
- **Atribuições**: Quando você é designado para uma tarefa
- **Mudanças de Status**: Alterações em negócios que você acompanha
- **Prazos**: Alertas sobre deadlines próximos
- **SLA**: Avisos sobre breach de SLA

## Gerenciar notificações

- Clique no ícone do sino no topo da tela
- Marque notificações como lidas
- Clique em uma notificação para ir direto ao item relacionado
    `,
  },
]

// REMOVIDO: Interface de Props (não necessária para a versão página)

// MUDANÇA: Export Default para corrigir o erro de build
export default function HelpCenter() {
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredArticles = helpArticles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = Array.from(new Set(helpArticles.map((a) => a.category)))

  return (
    // MUDANÇA: Substituído DialogContent por div normal com borda e altura ajustada
    <div className="flex h-[calc(100vh-12rem)] w-full border border-border rounded-lg overflow-hidden bg-card shadow-sm">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-muted/30 flex flex-col">
        <div className="p-6 pb-4 border-b border-border">
          <h3 className="flex items-center gap-2 font-semibold text-lg">
            <Question size={24} weight="duotone" className="text-primary" />
            Tópicos
          </h3>
        </div>

        <div className="p-4">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Buscar artigos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4 pb-4">
            {searchQuery === '' ? (
              // Group by category
              categories.map((category) => (
                <div key={category} className="mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
                    {category}
                  </h4>
                  <div className="space-y-1">
                    {helpArticles
                      .filter((a) => a.category === category)
                      .map((article) => (
                        <Button
                          key={article.id}
                          variant={selectedArticle?.id === article.id ? 'secondary' : 'ghost'}
                          className="w-full justify-start text-left h-auto py-2 px-3"
                          onClick={() => setSelectedArticle(article)}
                        >
                          <span className="text-sm line-clamp-2">{article.title}</span>
                        </Button>
                      ))}
                  </div>
                </div>
              ))
            ) : (
              // Search results
              <div className="space-y-1">
                {filteredArticles.length > 0 ? (
                  filteredArticles.map((article) => (
                    <Button
                      key={article.id}
                      variant={selectedArticle?.id === article.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start text-left h-auto py-2 px-3"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <div>
                        <div className="text-sm font-medium line-clamp-2">{article.title}</div>
                        <div className="text-xs text-muted-foreground">{article.category}</div>
                      </div>
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum artigo encontrado
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col bg-background">
        <div className="p-6 border-b border-border flex items-center justify-between bg-card">
          {selectedArticle ? (
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">
                {selectedArticle.category}
              </div>
              <h2 className="text-xl font-bold text-foreground">{selectedArticle.title}</h2>
            </div>
          ) : (
            <div className="text-muted-foreground">
              Selecione um artigo na barra lateral
            </div>
          )}
          {selectedArticle && (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedArticle(null)}
                title="Fechar artigo"
            >
                <X />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          {selectedArticle ? (
            <div className="p-8 max-w-3xl mx-auto">
              <article className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedArticle.content}
                </ReactMarkdown>
              </article>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Question size={48} weight="duotone" className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bem-vindo à Central de Ajuda</h3>
              <p className="text-muted-foreground max-w-md">
                Escolha um tópico na barra lateral para começar ou use a busca para encontrar
                respostas específicas sobre o PipeDesk.
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}