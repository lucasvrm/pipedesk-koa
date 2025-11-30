import { useState, useMemo, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateTrack } from '@/services/trackService'
import { useStages } from '@/services/pipelineService' // Importação correta do hook dinâmico
import { usePlayers } from '@/services/playerService'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MasterDeal, PlayerStage } from '@/lib/types' // Removida a importação de STAGE_LABELS
import { toast } from 'sonner'
import { ArrowLeft, Plus } from '@phosphor-icons/react'
import PlayerSelect from '@/components/PlayerSelect'
import { formatCurrency } from '@/lib/helpers'

// --- SCHEMA ---
const formSchema = z.object({
  playerName: z.string().min(1, 'O nome é obrigatório'),
  playerId: z.string().optional(),
  trackVolume: z.string().optional(), // String para lidar com a máscara
  currentStage: z.string().min(1, 'Selecione um estágio'),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CreatePlayerDialogProps {
  masterDeal: MasterDeal
  open: boolean
  onOpenChange: (open: boolean) => void
}

const maskCurrencyInput = (value: string) => {
  const cleanValue = value.replace(/\D/g, '')
  const numberValue = Number(cleanValue) / 100
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue)
}

export default function CreatePlayerDialog({ masterDeal, open, onOpenChange }: CreatePlayerDialogProps) {
  const createTrackMutation = useCreateTrack()
  const { data: stages = [], isLoading: isLoadingStages } = useStages() // Hook Dinâmico
  const { data: players } = usePlayers()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerName: '',
      playerId: undefined,
      trackVolume: masterDeal.volume ? maskCurrencyInput(masterDeal.volume.toString()) : '',
      currentStage: stages.find(s => s.isDefault)?.id || stages[0]?.id || '',
      notes: '',
    },
  })

  // Reset/Set default stage quando stages carregam
  useEffect(() => {
    if (stages.length > 0 && form.formState.isDirty === false) {
        const defaultStageId = stages.find(s => s.isDefault)?.id || stages[0]?.id
        form.setValue('currentStage', defaultStageId || '')
    }
  }, [stages, form])

  const onSubmit = async (values: FormValues) => {
    // 1. Unmask Volume
    const rawVolume = values.trackVolume
      ? parseFloat(values.trackVolume.replace(/[^\d,]/g, '').replace(',', '.'))
      : masterDeal.volume || 0
      
    // 2. Encontrar probabilidade do estágio selecionado
    const selectedStage = stages.find(s => s.id === values.currentStage)
    const probability = selectedStage?.probability || 0

    try {
      await createTrackMutation.mutateAsync({
        masterDealId: masterDeal.id,
        playerName: values.playerName,
        playerId: values.playerId,
        trackVolume: rawVolume,
        currentStage: values.currentStage,
        probability: probability,
        notes: values.notes,
        status: 'active',
        responsibles: masterDeal.responsibles?.map(u => u.id) || []
      })

      toast.success('Novo player adicionado com sucesso!')
      form.reset()
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro ao adicionar novo player')
    }
  }

  // Lógica de seleção de Player (Entidade)
  const handlePlayerSelect = (player) => {
    form.setValue('playerName', player.name, { shouldValidate: true, shouldDirty: true })
    form.setValue('playerId', player.id, { shouldValidate: true, shouldDirty: true })
  }

  const handlePlayerDeselect = () => {
    form.setValue('playerName', '', { shouldValidate: true, shouldDirty: true })
    form.setValue('playerId', undefined, { shouldValidate: true, shouldDirty: true })
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Player</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="text-sm text-muted-foreground border-b pb-3">
              Deal: <span className="font-semibold text-foreground">{masterDeal.clientName} ({formatCurrency(masterDeal.volume)})</span>
            </div>

            {/* SELEÇÃO DE PLAYER EXISTENTE */}
            <PlayerSelect
                label="Vincular a um Player existente"
                players={players || []}
                selectedPlayerId={form.watch('playerId')}
                onSelect={handlePlayerSelect}
                onDeselect={handlePlayerDeselect}
                disabled={form.formState.isSubmitting}
            />

            {/* NOME DO PLAYER (manual ou preenchido) */}
            <FormField
              control={form.control}
              name="playerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Player</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Fundo X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* VOLUME */}
              <FormField
                control={form.control}
                name="trackVolume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volume (R$)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="R$ 0,00"
                        onChange={(e) => {
                          const masked = maskCurrencyInput(e.target.value)
                          field.onChange(masked)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ESTÁGIO DINÂMICO */}
              <FormField
                control={form.control}
                name="currentStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estágio Inicial</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={isLoadingStages}>
                          <SelectValue placeholder="Selecione o estágio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stages.length === 0 ? (
                            <div className="p-2 text-center text-muted-foreground text-xs">Carregando estágios...</div>
                        ) : (
                            stages.map((stage) => (
                                <SelectItem key={stage.id} value={stage.id}>
                                    {stage.name} ({stage.probability}%)
                                </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Iniciais</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações sobre o player..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createTrackMutation.isPending || isLoadingStages}>
                <Plus className="mr-2 h-4 w-4" />
                {createTrackMutation.isPending ? 'Adicionando...' : 'Criar Player'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}