import { useState, useEffect } from 'react'
import { Plus, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, PlayerStage } from '@/lib/types'
import {
  PhaseTransitionRule,
  FieldCondition,
  AVAILABLE_FIELDS,
  OPERATORS_BY_TYPE,
  OPERATOR_LABELS,
  getStageLabel,
  ValidationOperator,
} from '@/lib/phaseValidation'

interface PhaseRuleEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: PhaseTransitionRule | null
  onSave: (rule: PhaseTransitionRule) => void
  currentUser: User
}

const STAGES: PlayerStage[] = ['nda', 'analysis', 'proposal', 'negotiation', 'closing']

export default function PhaseRuleEditor({
  open,
  onOpenChange,
  rule,
  onSave,
  currentUser,
}: PhaseRuleEditorProps) {
  const [fromStage, setFromStage] = useState<PlayerStage | 'any'>('any')
  const [toStage, setToStage] = useState<PlayerStage>('nda')
  const [requireAll, setRequireAll] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [conditions, setConditions] = useState<FieldCondition[]>([])

  useEffect(() => {
    if (rule) {
      setFromStage(rule.fromStage)
      setToStage(rule.toStage)
      setRequireAll(rule.requireAll)
      setErrorMessage(rule.errorMessage || '')
      setConditions(rule.conditions)
    } else {
      setFromStage('any')
      setToStage('nda')
      setRequireAll(true)
      setErrorMessage('')
      setConditions([])
    }
  }, [rule])

  const handleAddCondition = () => {
    const firstField = Object.keys(AVAILABLE_FIELDS)[0]
    const fieldConfig = AVAILABLE_FIELDS[firstField]
    const firstOperator = OPERATORS_BY_TYPE[fieldConfig.type][0]

    setConditions([
      ...conditions,
      {
        id: `condition-${Date.now()}`,
        fieldName: firstField,
        fieldType: fieldConfig.type,
        operator: firstOperator,
        value: '',
        label: fieldConfig.label,
      },
    ])
  }

  const handleRemoveCondition = (conditionId: string) => {
    setConditions(conditions.filter(c => c.id !== conditionId))
  }

  const handleUpdateCondition = (conditionId: string, updates: Partial<FieldCondition>) => {
    setConditions(
      conditions.map(c => {
        if (c.id !== conditionId) return c

        const newCondition = { ...c, ...updates }

        if (updates.fieldName) {
          const fieldConfig = AVAILABLE_FIELDS[updates.fieldName]
          newCondition.fieldType = fieldConfig.type
          newCondition.label = fieldConfig.label
          newCondition.operator = OPERATORS_BY_TYPE[fieldConfig.type][0]
          newCondition.value = ''
        }

        if (updates.operator) {
          if (updates.operator === 'is_filled' || updates.operator === 'is_empty') {
            newCondition.value = undefined
          }
        }

        return newCondition
      })
    )
  }

  const handleSave = () => {
    if (conditions.length === 0) {
      return
    }

    const newRule: PhaseTransitionRule = {
      id: rule?.id || `rule-${Date.now()}`,
      fromStage,
      toStage,
      conditions,
      requireAll,
      errorMessage: errorMessage || 'Requisitos não atendidos para avançar para esta fase',
      enabled: rule?.enabled ?? true,
      createdAt: rule?.createdAt || new Date().toISOString(),
      createdBy: rule?.createdBy || currentUser.id,
    }

    onSave(newRule)
  }

  const needsValue = (operator: ValidationOperator) => {
    return operator !== 'is_filled' && operator !== 'is_empty'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Editar Regra de Validação' : 'Nova Regra de Validação'}
          </DialogTitle>
          <DialogDescription>
            Configure quando e quais condições devem ser atendidas para permitir a transição entre fases
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fase de Origem</Label>
              <Select value={fromStage} onValueChange={(v) => setFromStage(v as PlayerStage | 'any')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer fase</SelectItem>
                  {STAGES.map(stage => (
                    <SelectItem key={stage} value={stage}>
                      {getStageLabel(stage)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fase de Destino</Label>
              <Select value={toStage} onValueChange={(v) => setToStage(v as PlayerStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map(stage => (
                    <SelectItem key={stage} value={stage}>
                      {getStageLabel(stage)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Condições</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure os requisitos que devem ser atendidos
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddCondition}>
                <Plus className="mr-2" size={16} />
                Adicionar Condição
              </Button>
            </div>

            {conditions.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Switch checked={requireAll} onCheckedChange={setRequireAll} id="require-all" />
                <Label htmlFor="require-all" className="cursor-pointer text-sm">
                  {requireAll ? 'Todas as condições devem ser atendidas (E)' : 'Qualquer condição pode ser atendida (OU)'}
                </Label>
              </div>
            )}

            <div className="space-y-3">
              {conditions.map((condition, idx) => (
                <div key={condition.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Condição {idx + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCondition(condition.id)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-2">
                      <Label>Campo</Label>
                      <Select
                        value={condition.fieldName}
                        onValueChange={(v) => handleUpdateCondition(condition.id, { fieldName: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(AVAILABLE_FIELDS).map(([key, field]) => (
                            <SelectItem key={key} value={key}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Operador</Label>
                        <Select
                          value={condition.operator}
                          onValueChange={(v) =>
                            handleUpdateCondition(condition.id, { operator: v as ValidationOperator })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATORS_BY_TYPE[condition.fieldType].map(op => (
                              <SelectItem key={op} value={op}>
                                {OPERATOR_LABELS[op]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {needsValue(condition.operator) && (
                        <div className="space-y-2">
                          <Label>Valor</Label>
                          <Input
                            type={condition.fieldType === 'number' ? 'number' : 'text'}
                            value={condition.value || ''}
                            onChange={(e) =>
                              handleUpdateCondition(condition.id, {
                                value: condition.fieldType === 'number' ? Number(e.target.value) : e.target.value,
                              })
                            }
                            placeholder="Digite o valor"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {conditions.length === 0 && (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">
                    Nenhuma condição adicionada
                  </p>
                  <Button size="sm" variant="outline" onClick={handleAddCondition}>
                    <Plus className="mr-2" size={16} />
                    Adicionar Primeira Condição
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Mensagem de Erro Customizada</Label>
            <Textarea
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="Ex: O campo 'Aprovação de Orçamento' deve estar preenchido e o valor ser menor que R$ 1.000.000"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Esta mensagem será exibida quando a validação falhar
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={conditions.length === 0}>
            {rule ? 'Salvar Alterações' : 'Criar Regra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
