import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Lead } from '@/lib/types'
import { createEvent } from '@/services/calendarService'
import { toast } from 'sonner'
import { getGoogleCalendarDayUrl } from '@/utils/googleLinks'
import { ExternalLink } from 'lucide-react'

interface ScheduleMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead
}

const getDefaultTitle = (lead: Lead) => `Reunião com ${lead.legalName}`

export function ScheduleMeetingDialog({ open, onOpenChange, lead }: ScheduleMeetingDialogProps) {
  const [title, setTitle] = useState(getDefaultTitle(lead))
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [addMeetLink, setAddMeetLink] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update title when lead changes
  useEffect(() => {
    setTitle(getDefaultTitle(lead))
  }, [lead])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !startTime || !endTime) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (!lead.id) {
      toast.error('ID do lead não encontrado')
      return
    }

    // Validate that end time is after start time
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    if (end <= start) {
      toast.error('A data de término deve ser posterior à data de início')
      return
    }

    setIsSubmitting(true)

    const promise = createEvent({
      title,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      entityType: 'lead',
      entityId: lead.id,
      addMeetLink
    })

    toast.promise(promise, {
      loading: 'Criando reunião...',
      success: () => {
        setIsSubmitting(false)
        onOpenChange(false)
        // Reset form to default state
        setTitle(getDefaultTitle(lead))
        setStartTime('')
        setEndTime('')
        return 'Reunião criada com sucesso!'
      },
      error: (err) => {
        setIsSubmitting(false)
        return err?.message || 'Erro ao criar reunião'
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agendar Reunião</DialogTitle>
          <DialogDescription>
            Crie uma reunião no Google Calendar para {lead.legalName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião de apresentação"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="startTime">Data e Hora de Início *</Label>
              {startTime && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => {
                    const date = new Date(startTime)
                    window.open(getGoogleCalendarDayUrl(date), '_blank', 'noopener,noreferrer')
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Ver Disponibilidade
                </Button>
              )}
            </div>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">Data e Hora de Término *</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="addMeetLink"
              checked={addMeetLink}
              onCheckedChange={(checked) => setAddMeetLink(checked === true)}
            />
            <Label
              htmlFor="addMeetLink"
              className="text-sm font-normal cursor-pointer"
            >
              Adicionar link do Google Meet
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Reunião'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
