import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Lead, LEAD_STATUS_LABELS, LEAD_ORIGIN_LABELS, OPERATION_LABELS, OperationType } from '@/lib/types'
import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { useUpdateLead, LeadUpdate } from '@/services/leadService'
import { toast } from 'sonner'

interface LeadEditSheetProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadEditSheet({ lead, open, onOpenChange }: LeadEditSheetProps) {
  const updateLead = useUpdateLead()
  const { register, handleSubmit, reset, setValue, watch } = useForm<LeadUpdate>()

  useEffect(() => {
    if (lead) {
      reset({
        legalName: lead.legalName,
        tradeName: lead.tradeName,
        cnpj: lead.cnpj,
        website: lead.website,
        segment: lead.segment,
        addressCity: lead.addressCity,
        addressState: lead.addressState,
        description: lead.description,
        status: lead.status,
        origin: lead.origin,
        operationType: lead.operationType,
      })
    }
  }, [lead, reset])

  const onSubmit = async (data: LeadUpdate) => {
    if (!lead) return
    try {
      await updateLead.mutateAsync({ id: lead.id, data })
      toast.success('Lead atualizado com sucesso!')
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro ao atualizar lead')
      console.error(error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Lead</SheetTitle>
          <SheetDescription>
            Faça alterações nos dados principais do lead.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-6">

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Dados Cadastrais</h3>
            <div className="grid gap-2">
                <Label htmlFor="legalName">Razão Social *</Label>
                <Input id="legalName" {...register('legalName', { required: true })} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="tradeName">Nome Fantasia</Label>
                <Input id="tradeName" {...register('tradeName')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input id="cnpj" {...register('cnpj')} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="website">Site</Label>
                    <Input id="website" {...register('website')} />
                </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Classificação</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select
                        value={watch('status')}
                        onValueChange={(v: any) => setValue('status', v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(LEAD_STATUS_LABELS).map(([k, l]) => (
                                <SelectItem key={k} value={k}>{l}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Origem</Label>
                    <Select
                        value={watch('origin')}
                        onValueChange={(v: any) => setValue('origin', v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(LEAD_ORIGIN_LABELS).map(([k, l]) => (
                                <SelectItem key={k} value={k}>{l}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid gap-2">
                <Label>Tipo de Operação</Label>
                <Select
                    value={watch('operationType')}
                    onValueChange={(v: string) => setValue('operationType', v)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(OPERATION_LABELS).map(([k, l]) => (
                            <SelectItem key={k} value={k}>{l}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Endereço e Info</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="addressCity">Cidade</Label>
                    <Input id="addressCity" {...register('addressCity')} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="addressState">Estado</Label>
                    <Input id="addressState" {...register('addressState')} maxLength={2} />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="description">Observações</Label>
                <Textarea id="description" {...register('description')} />
            </div>
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={updateLead.isPending}>
                {updateLead.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
