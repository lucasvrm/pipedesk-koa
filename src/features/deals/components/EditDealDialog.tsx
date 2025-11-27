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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateDeal } from '@/services/dealService'
import { useCompanies } from '@/services/companyService' // Hook de Empresas
import { logActivity } from '@/services/activityService' // Log de Atividade
import { useAuth } from '@/contexts/AuthContext'
import { Deal, OPERATION_LABELS, STATUS_LABELS, OperationType, DealStatus } from '@/lib/types'
import { toast } from 'sonner'

const formSchema = z.object({
  clientName: z.string().min(1, 'Nome do cliente é obrigatório'),
  operationType: z.string().min(1, 'Tipo de operação é obrigatório'),
  status: z.string().min(1, 'Status é obrigatório'),
  volume: z.coerce.number().min(0, 'Volume inválido'),
  feePercentage: z.coerce.number().min(0).max(100).optional(),
  deadline: z.string().min(1, 'Prazo é obrigatório'),
  observations: z.string().optional(),
  companyId: z.string().optional(), // Novo campo
})

interface EditDealDialogProps {
  deal: Deal
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditDealDialog({ deal, open, onOpenChange }: EditDealDialogProps) {
  const updateDeal = useUpdateDeal()
  const { data: companies } = useCompanies() // Busca empresas
  const { user } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: deal.clientName,
      operationType: deal.operationType,
      status: deal.status,
      volume: deal.volume,
      feePercentage: deal.feePercentage || 0,
      deadline: deal.deadline ? new Date(deal.deadline).toISOString().split('T')[0] : '',
      observations: deal.observations || '',
      companyId: deal.companyId || undefined,
    },
  })

  useEffect(() => {
    if (deal) {
      form.reset({
        clientName: deal.clientName,
        operationType: deal.operationType,
        status: deal.status,
        volume: deal.volume,
        feePercentage: deal.feePercentage || 0,
        deadline: deal.deadline ? new Date(deal.deadline).toISOString().split('T')[0] : '',
        observations: deal.observations || '',
        companyId: deal.companyId || undefined,
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
          status: values.status as DealStatus,
          volume: values.volume,
          feePercentage: values.feePercentage,
          deadline: new Date(values.deadline).toISOString(),
          observations: values.observations,
          companyId: values.companyId, // Salva o vínculo
        },
      })

      // REGISTRO DE ATIVIDADE
      if (user) {
        logActivity(deal.id, 'deal', 'Edição de Propriedades', user.id, values)
      }

      toast.success('Negócio atualizado com sucesso!')
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro ao atualizar negócio')
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Negócio</DialogTitle>
          <DialogDescription>
            Atualize as informações do mandato.
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

            {/* SELETOR DE EMPRESA */}
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa Vinculada</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none_value">-- Nenhuma --</SelectItem>
                      {(companies || []).map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
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

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalhes adicionais, contexto, etc." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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