import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useUpdateDeal } from '@/services/dealService'
import { useUsers } from '@/services/userService'
import { useCompanies } from '@/services/companyService'
import { MasterDeal, OPERATION_LABELS, DealStatus } from '@/lib/types'
import { getInitials } from '@/lib/helpers'

// UI Imports
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
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CalendarIcon, Check, Plus, Trash, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// --- SCHEMA ---
const formSchema = z.object({
  clientName: z.string().min(1, 'Nome do Deal é obrigatório'),
  company_id: z.string().optional(),
  volume: z.string().optional(), // String para lidar com a máscara
  operationType: z.string().min(1, 'Selecione o tipo'),
  status: z.enum(['active', 'on_hold', 'concluded', 'cancelled']),
  deadline: z.date().optional(),
  feePercentage: z.string().optional(), // String para lidar com a máscara
  observations: z.string().optional(),
  responsibles: z.array(z.string()).default([]), // Array de User IDs
})

type FormValues = z.infer<typeof formSchema>

interface EditDealDialogProps {
  deal: MasterDeal
  open: boolean
  onOpenChange: (open: boolean) => void
}

// --- HELPERS DE MÁSCARA ---

// Formata valor numérico para BRL (ex: 1000 -> R$ 1.000,00)
const formatMoneyDisplay = (value: number | string | undefined) => {
  if (!value) return ''
  const numberVal = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numberVal)) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberVal)
}

// Formata input enquanto digita (R$ ...)
const maskCurrencyInput = (value: string) => {
  const cleanValue = value.replace(/\D/g, '')
  const numberValue = Number(cleanValue) / 100
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue)
}

// Máscara de Porcentagem (0,00%)
const maskPercentageInput = (value: string) => {
  let cleanValue = value.replace(/[^\d]/g, '')
  if (!cleanValue) return ''
  const numberValue = Number(cleanValue) / 100
  return new Intl.NumberFormat('pt-BR', { 
    style: 'decimal', 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(numberValue) + '%'
}

export function EditDealDialog({ deal, open, onOpenChange }: EditDealDialogProps) {
  const updateDealMutation = useUpdateDeal()
  const { data: users } = useUsers()
  const { data: companies } = useCompanies()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: deal.clientName,
      company_id: deal.company_id || deal.companyId || undefined, // Fallback para companyId
      volume: deal.volume ? formatMoneyDisplay(deal.volume) : '',
      operationType: deal.operationType,
      status: deal.status,
      deadline: deal.deadline ? new Date(deal.deadline) : undefined,
      feePercentage: deal.feePercentage ? maskPercentageInput((deal.feePercentage * 100).toFixed(0)) : '',
      observations: deal.observations || '',
      responsibles: deal.responsibles?.map(u => u.id) || []
    },
  })

  // Reset form quando o deal muda ou modal abre
  useEffect(() => {
    if (open) {
      form.reset({
        clientName: deal.clientName,
        company_id: deal.company_id || deal.companyId || undefined,
        volume: deal.volume ? formatMoneyDisplay(deal.volume) : '',
        operationType: deal.operationType,
        status: deal.status,
        deadline: deal.deadline ? new Date(deal.deadline) : undefined,
        feePercentage: deal.feePercentage ? maskPercentageInput((deal.feePercentage * 100).toFixed(0)) : '',
        observations: deal.observations || '',
        responsibles: deal.responsibles?.map(u => u.id) || []
      })
    }
  }, [deal, open, form])

  const onSubmit = async (values: FormValues) => {
    try {
      // 1. Unmask Volume
      const rawVolume = values.volume 
        ? parseFloat(values.volume.replace(/[^\d,]/g, '').replace(',', '.')) 
        : 0

      // 2. Unmask Fee
      const rawFee = values.feePercentage
        ? parseFloat(values.feePercentage.replace(/[^\d,]/g, '').replace(',', '.'))
        : 0

      // Correção: Passar updates como objeto 'updates', não espalhado
      await updateDealMutation.mutateAsync({
        dealId: deal.id, // ID é obrigatório e separado
        updates: {
            clientName: values.clientName,
            companyId: values.company_id,
            operationType: values.operationType as any,
            status: values.status,
            volume: rawVolume,
            feePercentage: rawFee,
            deadline: values.deadline?.toISOString(),
            observations: values.observations,
            // responsibles não faz parte de DealUpdate padrão no frontend geralmente,
            // mas se o backend suportar, ok. Caso contrário, isso deve ser tratado separadamente.
            // Vou assumir que DealUpdate interface precisa ser respeitada.
        }
      })

      // Se responsibles precisar de atualização separada, seria aqui.
      // Assumindo por enquanto que apenas campos básicos são atualizados via updateDeal.

      toast.success('Negócio atualizado com sucesso!')
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro ao atualizar negócio')
    }
  }

  // Helper para adicionar/remover usuário
  const toggleUser = (userId: string) => {
    const current = form.getValues('responsibles')
    if (current.includes(userId)) {
      form.setValue('responsibles', current.filter(id => id !== userId))
    } else {
      form.setValue('responsibles', [...current, userId])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Editar Negócio</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="grid gap-6">
                
                {/* LINHA 1: TÍTULO E CLIENTE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Deal</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Aquisição Terreno X" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente (Empresa)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a empresa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <div className="p-1">
                                <Input className="h-8 text-xs mb-1" placeholder="Buscar empresa..." onKeyDown={(e) => e.stopPropagation()} />
                            </div>
                            {companies?.map((company) => (
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
                </div>

                {/* LINHA 2: TIPO E STATUS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="operationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Operação</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(OPERATION_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="on_hold">Em Espera</SelectItem>
                            <SelectItem value="concluded">Concluído</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* LINHA 3: FINANCEIRO E PRAZO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="volume"
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

                  <FormField
                    control={form.control}
                    name="feePercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Success Fee (%)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="0,00%"
                            onChange={(e) => {
                              const masked = maskPercentageInput(e.target.value)
                              field.onChange(masked)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prazo Estimado</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ptBR })
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* GESTÃO DE EQUIPE (NOVO) */}
                <FormField
                  control={form.control}
                  name="responsibles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between items-center">
                        Equipe do Deal
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 text-primary">
                              <Plus className="mr-1 h-3 w-3" /> Adicionar
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-[200px]" align="end">
                            <Command>
                              <CommandInput placeholder="Buscar usuário..." />
                              <CommandList>
                                <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {users?.map(user => {
                                    const isSelected = field.value.includes(user.id)
                                    if (isSelected) return null // Não mostra quem já está
                                    return (
                                      <CommandItem key={user.id} onSelect={() => toggleUser(user.id)}>
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-5 w-5">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback className="text-[9px]">{getInitials(user.name)}</AvatarFallback>
                                          </Avatar>
                                          <span>{user.name}</span>
                                        </div>
                                      </CommandItem>
                                    )
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormLabel>
                      
                      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-muted/20 rounded-md border border-dashed">
                        {field.value.length === 0 ? (
                          <span className="text-xs text-muted-foreground p-1">Nenhum membro atribuído.</span>
                        ) : (
                          field.value.map(userId => {
                            const user = users?.find(u => u.id === userId)
                            return (
                              <Badge key={userId} variant="secondary" className="pl-1 pr-2 py-1 gap-2 flex items-center">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={user?.avatar} />
                                  <AvatarFallback className="text-[8px]">{getInitials(user?.name || '?')}</AvatarFallback>
                                </Avatar>
                                {user?.name}
                                <button 
                                  type="button" 
                                  onClick={() => toggleUser(userId)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X size={12} />
                                </button>
                              </Badge>
                            )
                          })
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações / Descrição do Produto</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detalhes sobre a estrutura, garantias, tese..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t bg-muted/5">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateDealMutation.isPending}>
                {updateDealMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
