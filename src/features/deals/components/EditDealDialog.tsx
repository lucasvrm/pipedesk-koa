import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateDeal } from '@/services/dealService'
import { Deal, OPERATION_LABELS, OperationType } from '@/lib/types'
import { toast } from 'sonner'

const formSchema = z.object({
  clientName: z.string().min(1, 'Nome do cliente é obrigatório'),
  operationType: z.string().min(1, 'Tipo de operação é obrigatório'),
  volume: z.coerce.number().min(0, 'Volume inválido'),
  feePercentage: z.coerce.number().min(0).max(100).optional(),
  deadline: z.string().min(1, 'Prazo é obrigatório'),
})

interface EditDealDialogProps {
  deal: Deal
  open: boolean
  onOpenChange: (open: boolean) => void
}

// MUDANÇA AQUI: 'export function' em vez de 'export default function'
export function EditDealDialog({ deal, open, onOpenChange }: EditDealDialogProps) {
  const updateDeal = useUpdateDeal()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: deal.clientName,
      operationType: deal.operationType,
      volume: deal.volume,
      feePercentage: deal.feePercentage || 0,
      deadline: deal.deadline ? new Date(deal.deadline).toISOString().split('T')[0] : '',
    },
  })

  useEffect(() => {
    if (deal) {
      form.reset({
        clientName: deal.clientName,
        operationType: deal.operationType,
        volume: deal.volume,
        feePercentage: deal.feePercentage || 0,
        deadline: deal.deadline ? new Date(deal.deadline).toISOString().split('T')[0] : '',
      })
    }
  }, [deal, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateDeal.mutateAsync({
        dealId: deal.id,
        updates: {
          clientName: values.clientName,
          operationType: values.operationType as OperationType,
          volume: values.volume,
          feePercentage: values.feePercentage,
          deadline: new Date(values.deadline).toISOString(),
        },
      })
      toast.success('Negócio atualizado com sucesso!')
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro ao atualizar negócio')
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Negócio</DialogTitle>
          <DialogDescription>
            Atualize as informações principais do mandato.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente / Negócio</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Grupo XYZ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="operationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Operação</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(OPERATION_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo Final</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="volume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volume (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="feePercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Success Fee (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateDeal.isPending}>
                {updateDeal.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}