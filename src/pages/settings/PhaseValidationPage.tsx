import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, ArrowRight, WarningCircle, Code, PencilSimple } from '@phosphor-icons/react'
import { PhaseRuleEditor } from '@/components/PhaseRuleEditor'
import { PhaseTransitionRule } from '@/lib/phaseValidation'
import { useStages } from '@/services/pipelineService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatConditionDescription } from '@/lib/phaseValidation'
import { nanoid } from 'nanoid'

// ATENÇÃO: SIMULAÇÃO DE DADOS DE REGRAS - Substituir por usePhaseValidationRules, useCreateRule, etc.
const usePhaseValidationRules = () => {
    const [rules, setRules] = useState<PhaseTransitionRule[]>([]);
    const isLoading = false;
    const isSaving = false;

    // Simulação de hooks CRUD
    const createRule = async (rule: PhaseTransitionRule) => {
        setRules(prev => [...prev, { ...rule, id: nanoid() }])
        return Promise.resolve();
    }

    const updateRule = async (rule: PhaseTransitionRule) => {
        setRules(prev => prev.map(r => r.id === rule.id ? rule : r))
        return Promise.resolve();
    }

    const deleteRule = async (ruleId: string) => {
        setRules(prev => prev.filter(r => r.id !== ruleId))
        return Promise.resolve();
    }
    
    // Simulação de regras iniciais
    useEffect(() => {
        if (rules.length === 0) {
            setRules([
                {
                    id: nanoid(),
                    fromStage: 'any',
                    toStage: 'proposal',
                    errorMessage: 'Volume e produto do Deal são obrigatórios antes de enviar a Proposta.',
                    requireAll: true,
                    enabled: true,
                    createdAt: new Date().toISOString(),
                    createdBy: 'system',
                    conditions: [
                        { id: nanoid(), fieldName: 'deal.volume', fieldType: 'number', operator: 'is_filled', label: 'Volume do Deal Master' },
                        { id: nanoid(), fieldName: 'deal.operationType', fieldType: 'select', operator: 'is_filled', label: 'Tipo de Operação' },
                    ]
                }
            ]);
        }
    }, [])


    return { rules, isLoading, isSaving, createRule, updateRule, deleteRule }
}

export default function PhaseValidationPage() {
  const { rules, isLoading, isSaving, createRule, updateRule, deleteRule } = usePhaseValidationRules()
  const { data: stages = [], isLoading: isLoadingStages } = useStages()

  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view')
  const [currentRule, setCurrentRule] = useState<PhaseTransitionRule | null>(null)

  // Mapeamento de estágios para nomes
  const stageMap = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.id] = stage.name;
      return acc;
    }, {} as Record<string, string>);
  }, [stages]);

  const handleEditRule = (rule: PhaseTransitionRule) => {
    setCurrentRule(rule)
    setMode('edit')
  }

  const handleCreateNew = () => {
    setCurrentRule(null)
    setMode('create')
  }

  const handleSave = async (rule: PhaseTransitionRule) => {
    try {
        if (rule.id && rules.find(r => r.id === rule.id)) {
            await updateRule(rule)
            toast.success('Regra atualizada com sucesso.')
        } else {
            await createRule(rule)
            toast.success('Regra criada com sucesso.')
        }
        setMode('view')
        setCurrentRule(null)
    } catch (error) {
        toast.error('Erro ao salvar a regra.')
    }
  }

  const handleDelete = async (ruleId: string) => {
    try {
        await deleteRule(ruleId)
        toast.success('Regra excluída com sucesso.')
        setMode('view')
        setCurrentRule(null)
    } catch (error) {
        toast.error('Erro ao excluir a regra.')
    }
  }

  // Se estiver em modo de edição/criação, renderiza o editor
  if (mode !== 'view') {
    return (
        <div className="container mx-auto p-6 max-w-4xl pb-24">
            <Button variant="ghost" className="mb-4" onClick={() => setMode('view')}>
                <ArrowRight weight="bold" className="h-4 w-4 rotate-180 mr-2" />
                Voltar para Regras
            </Button>
            <PhaseRuleEditor
                ruleToEdit={mode === 'edit' ? currentRule : null}
                onSave={handleSave}
                onCancel={() => setMode('view')}
                isSaving={isSaving}
                onDelete={handleDelete}
            />
        </div>
    )
  }

  // Modo de visualização (Padrão)
  return (
    <div className="container mx-auto p-6 max-w-7xl pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Code className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciamento de Validação de Fases
          </h1>
        </div>
        <Button onClick={handleCreateNew} disabled={isLoadingStages}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Regra
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regras de Transição ({rules.length})</CardTitle>
          <CardDescription>
            Regras que impedem o avanço de um Player Track para o próximo estágio até que as condições sejam atendidas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || isLoadingStages ? (
            <div className="text-center py-12 text-muted-foreground">Carregando regras e estágios...</div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
              <WarningCircle className="h-8 w-8 mx-auto mb-2 text-primary/70" />
              Nenhuma regra de validação definida.
            </div>
          ) : (
            <div className="space-y-4">
                {rules.map(rule => (
                    <div key={rule.id} className={cn("p-4 border rounded-lg shadow-sm transition-shadow hover:shadow-md", !rule.enabled && "opacity-60 bg-muted/20")}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn("text-xs font-semibold", rule.enabled ? "border-green-400 text-green-700" : "border-destructive text-destructive")}>
                                    {rule.enabled ? 'ATIVA' : 'DESABILITADA'}
                                </Badge>
                                <span className="text-sm font-medium text-muted-foreground">
                                    {rule.fromStage === 'any' ? 'Qualquer' : stageMap[rule.fromStage] || rule.fromStage}
                                    <ArrowRight className="h-3 w-3 inline-block mx-2" weight="bold" />
                                    {stageMap[rule.toStage] || rule.toStage}
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditRule(rule)}>
                                <PencilSimple className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="mb-3">
                            <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                                <WarningCircle className="h-4 w-4" />
                                Bloqueia com a mensagem: "{rule.errorMessage}"
                            </p>
                        </div>
                        
                        <Separator className="mb-3" />

                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">
                                CONDIÇÕES ({rule.requireAll ? 'TODAS DEVEM SER VERDADEIRAS' : 'PELO MENOS UMA DEVE SER VERDADEIRA'}):
                            </p>
                            <ul className="list-disc ml-4 text-sm text-foreground space-y-1">
                                {rule.conditions.map((condition, index) => (
                                    <li key={index} className="text-xs">
                                        {formatConditionDescription(condition)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
