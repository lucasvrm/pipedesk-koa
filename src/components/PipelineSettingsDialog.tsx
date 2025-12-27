import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { PipelineStage } from '@/lib/types'
import { useCreateStage, useUpdateStage } from '@/services/pipelineService'
import { toast } from 'sonner'
import { PaintBucket, Trash } from '@phosphor-icons/react'

const formSchema = z.object({
  name: z.string().min(1, 'O nome do estágio é obrigatório'),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Cor inválida (Use formato #FFFFFF)'),
  probability: z.number().min(0).max(100),
  isDefault: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface PipelineSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stageToEdit?: PipelineStage | null // Se for edição
  onStageDeleted?: () => void
  pipelineId?: string | null // Para suportar múltiplos pipelines (se aplicável)
  stageOrder: number // Para setar o valor de ordem no caso de criação
}

export function PipelineSettingsDialog({
  open,
  onOpenChange,
  stageToEdit,
  pipelineId = null,
  stageOrder,
}: PipelineSettingsDialogProps) {
  const isEdit = !!stageToEdit
  const createMutation = useCreateStage()
  const updateMutation = useUpdateStage()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      color: '#0070f3',
      probability: 0,
      isDefault: false,
    },
  })

  useEffect(() => {
    if (stageToEdit && open) {
      form.reset({
        name: stageToEdit.name,
        color: stageToEdit.color,
        probability: stageToEdit.probability,
        isDefault: stageToEdit.isDefault,
      })
    } else if (open) {
      // Valores default para criação
      form.reset({
        name: '',
        color: '#0070f3',
        probability: 0,
        isDefault: false,
      })
    }
  }, [stageToEdit, open, form])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && stageToEdit) {
        await updateMutation.mutateAsync({
          stageId: stageToEdit.id,
          updates: {
            name: values.name,
            color: values.color,
            probability: values.probability,
            isDefault: values.isDefault,
          },
        })
        toast.success(`Estágio "${values.name}" atualizado!`)
      } else {
        await createMutation.mutateAsync({
          pipelineId: pipelineId,
          name: values.name,
          color: values.color,
          probability: values.probability,
          isDefault: values.isDefault,
          stageOrder: stageOrder, // Usa a ordem da última posição
        })
        toast.success(`Estágio "${values.name}" criado com sucesso!`)
      }

      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error(error)
      toast.error(`Erro ao ${isEdit ? 'atualizar' : 'criar'} estágio.`)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Estágio' : 'Criar Novo Estágio'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Estágio</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Análise de Crédito" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between items-end gap-4">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="flex items-center gap-2">
                        Cor de Destaque <PaintBucket className="h-4 w-4" style={{ color: field.value }} />
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                          <Input type="color" className="w-12 h-8 p-1 cursor-pointer" {...field} />
                          <Input placeholder="#FFFFFF" className="flex-1" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0 p-2 border rounded-md h-12">
                      <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} id="is-default-checkbox" />
                      </FormControl>
                      <FormLabel htmlFor="is-default-checkbox" className="text-sm font-medium pt-1">
                          Padrão
                      </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="probability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Probabilidade (%)</FormLabel>
                  <FormControl>
                    <>
                      <div className="flex items-center gap-3">
                        <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[field.value ?? 0]}
                            onValueChange={(val) => field.onChange(val[0])}
                            className="flex-1"
                        />
                        <span className="w-10 text-right font-semibold text-lg">{field.value ?? 0}%</span>
                      </div>
                      <Input 
                        type="number"
                        min={0}
                        max={100}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value}
                        className="sr-only"
                      />
                    </>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : (isEdit ? 'Salvar Edição' : 'Criar Estágio')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}