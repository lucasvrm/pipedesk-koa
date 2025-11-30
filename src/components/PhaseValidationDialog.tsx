import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PlayerStage } from '@/lib/types'
import { XCircle, ArrowRight } from '@phosphor-icons/react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ValidationResult, formatConditionDescription } from '@/lib/phaseValidation' // REMOVIDO: getStageLabel
import { useStages } from '@/services/pipelineService' // NOVO: Hook para estágios dinâmicos
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface PhaseValidationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStage: PlayerStage
  targetStage: PlayerStage
  validationResult: ValidationResult
  onConfirm: () => void
}

export default function PhaseValidationDialog({
  open,
  onOpenChange,
  currentStage,
  targetStage,
  validationResult,
  onConfirm,
}: PhaseValidationDialogProps) {

  const { data: stages = [] } = useStages()

  // Mapeia estágios para nomes
  const stageMap = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.id] = stage.name;
      return acc;
    }, {} as Record<string, string>);
  }, [stages]);
  
  const currentStageName = stageMap[currentStage] || currentStage
  const targetStageName = stageMap[targetStage] || targetStage
  
  if (!open || validationResult.isValid) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2 text-destructive">
            <XCircle weight="fill" className="h-6 w-6" />
            Transição Bloqueada
          </DialogTitle>
          <DialogDescription>
            Não é possível avançar de **{currentStageName}** para **{targetStageName}** porque os seguintes requisitos não foram atendidos.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-2" />

        {/* Mensagem de Erro Principal */}
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            {validationResult.errorMessage || 'Condições de avanço não atendidas.'}
          </AlertDescription>
        </Alert>
        
        {/* Lista de Condições Falhas */}
        <div className="space-y-3 p-3 border rounded-lg bg-muted/20 max-h-60 overflow-y-auto">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Requisitos Pendentes:
          </h3>
          <ul className="space-y-2">
            {validationResult.failedConditions.map((condition, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                <Warning className="h-4 w-4 text-destructive shrink-0" />
                <span className="flex-1">
                    {formatConditionDescription(condition)}
                </span>
              </li>
            ))}
          </ul>
        </div>


        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Entendido
          </Button>
          {/* O botão de confirmação é desabilitado neste caso, pois a validação falhou (isValid: false) */}
          <Button 
            variant="default" 
            disabled 
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
          >
            <Check className="h-4 w-4" />
            Corrigir e Tentar Novamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}