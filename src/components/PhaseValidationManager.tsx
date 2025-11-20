import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { 
  Plus, 
  Trash, 
  PencilSimple,
  Check,
  X,
  ShieldCheck,
  ArrowRight,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User } from '@/lib/types'
import { 
  PhaseTransitionRule,
  getStageLabel,
  formatConditionDescription,
} from '@/lib/phaseValidation'
import PhaseRuleEditor from './PhaseRuleEditor'
import { toast } from 'sonner'

interface PhaseValidationManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User
}

export default function PhaseValidationManager({ 
  open, 
  onOpenChange,
  currentUser,
}: PhaseValidationManagerProps) {
  const [rules, setRules] = useKV<PhaseTransitionRule[]>('phaseTransitionRules', [])
  const [selectedRule, setSelectedRule] = useState<PhaseTransitionRule | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const handleCreateRule = () => {
    setSelectedRule(null)
    setEditorOpen(true)
  }

  const handleEditRule = (rule: PhaseTransitionRule) => {
    setSelectedRule(rule)
    setEditorOpen(true)
  }

  const handleDeleteRule = (ruleId: string) => {
    setRules((current) => (current || []).filter(r => r.id !== ruleId))
    toast.success('Regra removida com sucesso')
  }

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    setRules((current) => 
      (current || []).map(r => r.id === ruleId ? { ...r, enabled } : r)
    )
    toast.success(enabled ? 'Regra ativada' : 'Regra desativada')
  }

  const handleSaveRule = (rule: PhaseTransitionRule) => {
    setRules((current) => {
      const currentRules = current || []
      const existing = currentRules.find(r => r.id === rule.id)
      if (existing) {
        return currentRules.map(r => r.id === rule.id ? rule : r)
      }
      return [...currentRules, rule]
    })
    setEditorOpen(false)
    toast.success(selectedRule ? 'Regra atualizada' : 'Regra criada com sucesso')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="text-primary" />
              Validação de Fases
            </DialogTitle>
            <DialogDescription>
              Configure regras que bloqueiam a transição entre fases quando condições não são atendidas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Regras Configuradas</p>
                <p className="text-xs text-muted-foreground">
                  {(rules || []).length} {(rules || []).length === 1 ? 'regra' : 'regras'} ativas
                </p>
              </div>
              <Button onClick={handleCreateRule}>
                <Plus className="mr-2" />
                Nova Regra
              </Button>
            </div>

            <Separator />

            {(rules || []).length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <ShieldCheck className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-lg font-medium mb-2">Nenhuma regra configurada</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Crie regras para garantir que campos obrigatórios sejam preenchidos antes de avançar fases
                    </p>
                    <Button onClick={handleCreateRule}>
                      <Plus className="mr-2" />
                      Criar Primeira Regra
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {(rules || []).map((rule) => (
                  <Card key={rule.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">
                              {rule.fromStage === 'any' ? 'Qualquer' : getStageLabel(rule.fromStage)}
                            </Badge>
                            <ArrowRight className="text-muted-foreground" size={16} />
                            <Badge variant="outline">
                              {getStageLabel(rule.toStage)}
                            </Badge>
                          </div>
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(enabled) => handleToggleRule(rule.id, enabled)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRule(rule)}
                          >
                            <PencilSimple />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash className="text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">
                            {rule.requireAll ? 'Todas as condições' : 'Qualquer condição'} devem ser atendidas:
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {rule.conditions.map((condition, idx) => (
                            <div key={condition.id} className="flex items-center gap-2 text-sm">
                              <Badge variant="secondary" className="font-mono text-xs">
                                {idx + 1}
                              </Badge>
                              <span>{formatConditionDescription(condition)}</span>
                            </div>
                          ))}
                        </div>
                        {rule.errorMessage && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Mensagem de erro:</span> {rule.errorMessage}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PhaseRuleEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        rule={selectedRule}
        onSave={handleSaveRule}
        currentUser={currentUser}
      />
    </>
  )
}
