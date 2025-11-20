import { Shield, Warning, CheckCircle, X } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ValidationResult, formatConditionDescription, getStageLabel } from '@/lib/phaseValidation'
import { PlayerStage } from '@/lib/types'

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
  const handleConfirm = () => {
    if (validationResult.isValid) {
      onConfirm()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {validationResult.isValid ? (
              <CheckCircle className="text-success" size={24} />
            ) : (
              <Warning className="text-destructive" size={24} />
            )}
            {validationResult.isValid ? 'Validação Aprovada' : 'Validação Bloqueada'}
          </DialogTitle>
          <DialogDescription>
            Transição de <strong>{getStageLabel(currentStage)}</strong> para{' '}
            <strong>{getStageLabel(targetStage)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {validationResult.isValid ? (
            <Alert className="border-success/50 bg-success/5">
              <Shield className="text-success" />
              <AlertDescription className="text-success-foreground">
                Todos os requisitos foram atendidos. Você pode prosseguir com esta transição.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="border-destructive/50 bg-destructive/5">
                <Warning className="text-destructive" />
                <AlertDescription className="text-destructive-foreground">
                  {validationResult.errorMessage}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Requisitos não atendidos:</h4>
                  <div className="space-y-2">
                    {validationResult.failedConditions.map((condition, idx) => (
                      <div
                        key={condition.id}
                        className="flex items-start gap-2 p-3 bg-muted rounded-md text-sm"
                      >
                        <Badge variant="destructive" className="mt-0.5 flex-shrink-0">
                          {idx + 1}
                        </Badge>
                        <span className="flex-1">{formatConditionDescription(condition)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="bg-accent/10 border border-accent/20 rounded-md p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong>Dica:</strong> Preencha os campos obrigatórios antes de tentar avançar para a próxima
                    fase. Isso garante compliance e evita erros no processo.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {validationResult.isValid ? 'Cancelar' : 'Fechar'}
          </Button>
          {validationResult.isValid && (
            <Button onClick={handleConfirm}>Confirmar Transição</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
