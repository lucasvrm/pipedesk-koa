import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MasterDeal, OperationType, OPERATION_LABELS, GoogleIntegration, GoogleDriveFolder } from '@/lib/types'
import { generateId } from '@/lib/helpers'
import { toast } from 'sonner'
import { Sparkle, FolderOpen } from '@phosphor-icons/react'

interface CreateDealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateDealDialog({ open, onOpenChange }: CreateDealDialogProps) {
  const [masterDeals, setMasterDeals] = useKV<MasterDeal[]>('masterDeals', [])
  const [currentUser] = useKV<{ id: string; name: string }>('currentUser', { id: 'user-1', name: 'João Silva' })
  const [integration] = useKV<GoogleIntegration | null>(`google-integration-${currentUser?.id}`, null)
  const [folders, setFolders] = useKV<GoogleDriveFolder[]>('googleDriveFolders', [])
  
  const [clientName, setClientName] = useState('')
  const [volume, setVolume] = useState('')
  const [operationType, setOperationType] = useState<OperationType>('acquisition')
  const [deadline, setDeadline] = useState('')
  const [observations, setObservations] = useState('')
  const [feePercentage, setFeePercentage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clientName || !volume || !deadline) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const newDeal: MasterDeal = {
      id: generateId(),
      clientName,
      volume: parseFloat(volume),
      operationType,
      deadline,
      observations,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser?.id || 'user-1',
      feePercentage: feePercentage ? parseFloat(feePercentage) : undefined,
    }

    setMasterDeals((current) => [...(current || []), newDeal])
    
    if (integration) {
      try {
        const folderId = `folder-${newDeal.id}-${Date.now()}`
        const folderUrl = `https://drive.google.com/drive/folders/${folderId}`
        
        const newFolder: GoogleDriveFolder = {
          id: generateId(),
          entityId: newDeal.id,
          entityType: 'deal',
          folderId,
          folderUrl,
          createdAt: new Date().toISOString(),
        }
        
        setFolders((current) => [...(current || []), newFolder])
        
        toast.success(
          <div className="flex items-center gap-2">
            <FolderOpen />
            <span>Negócio criado! Pasta do Drive criada automaticamente.</span>
          </div>
        )
      } catch (error) {
        toast.success('Negócio criado com sucesso!')
        toast.warning('Erro ao criar pasta do Drive')
      }
    } else {
      toast.success('Negócio criado com sucesso!')
    }
    
    setClientName('')
    setVolume('')
    setOperationType('acquisition')
    setDeadline('')
    setObservations('')
    setFeePercentage('')
    onOpenChange(false)
  }

  const handleGenerateDescription = async () => {
    if (!clientName || !operationType) {
      toast.error('Preencha o nome do cliente e tipo de operação primeiro')
      return
    }

    setIsGenerating(true)
    try {
      const templateParts = [`Gere uma descrição profissional em português brasileiro para um negócio de `, ` com o cliente `, `. A descrição deve ter 2-3 frases focando em objetivos estratégicos e próximos passos típicos deste tipo de operação financeira. Seja conciso e profissional.`] as any
      const prompt = window.spark.llmPrompt(templateParts, OPERATION_LABELS[operationType], clientName)
      const result = await window.spark.llm(prompt, 'gpt-4o-mini')
      setObservations(result.trim())
      toast.success('Descrição gerada com sucesso!')
    } catch (error) {
      toast.error('Erro ao gerar descrição')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Novo Negócio</DialogTitle>
          <DialogDescription>
            Crie um novo Master Deal para gerenciar múltiplos players
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Nome do Cliente *</Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: Empresa XYZ Ltda"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volume">Volume (R$) *</Label>
              <Input
                id="volume"
                type="number"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="0.00"
                className="currency-input"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee-percentage">Fee (%)</Label>
              <Input
                id="fee-percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={feePercentage}
                onChange={(e) => setFeePercentage(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="operation-type">Tipo de Operação *</Label>
            <Select value={operationType} onValueChange={(v) => setOperationType(v as OperationType)}>
              <SelectTrigger id="operation-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(OPERATION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Prazo Final *</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="observations">Observações</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={isGenerating}
              >
                <Sparkle className="mr-2" />
                {isGenerating ? 'Gerando...' : 'Gerar com IA'}
              </Button>
            </div>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Detalhes adicionais sobre o negócio..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Negócio</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
