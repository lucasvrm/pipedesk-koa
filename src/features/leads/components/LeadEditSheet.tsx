import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { leadStatusMap } from '@/lib/statusMaps'
import { Separator } from '@/components/ui/separator'
import { Lead, OPERATION_LABELS, OperationType } from '@/lib/types'
import { useForm } from 'react-hook-form'
import { useEffect, useMemo } from 'react'
import { useUpdateLead, LeadUpdate } from '@/services/leadService'
import { syncName } from '@/services/driveService'
import { toast } from 'sonner'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { safeString } from '@/lib/utils'

interface LeadEditSheetProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadEditSheet({ lead, open, onOpenChange }: LeadEditSheetProps) {
  const updateLead = useUpdateLead()
  const { register, handleSubmit, reset, setValue, watch } = useForm<LeadUpdate>()
  const { leadStatuses, leadOrigins, getLeadStatusById, getLeadOriginById } = useSystemMetadata()

  const leadInitials = useMemo(() => {
    if (!lead?.legalName) return '--'
    return lead.legalName
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [lead])

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
        leadStatusId: lead.leadStatusId,
        leadOriginId: lead.leadOriginId,
        operationType: lead.operationType,
      })
    }
  }, [lead, reset])

  const onSubmit = async (data: LeadUpdate) => {
    if (!lead) return
    try {
      await updateLead.mutateAsync({ id: lead.id, data })
      toast.success('Lead atualizado com sucesso!')
      
      // Sync name with Drive folder (silent error handling)
      try {
        await syncName('lead', lead.id)
      } catch (error) {
        console.warn('[LeadEditSheet] Failed to sync name with Drive:', error)
        // Don't show error toast - this is a non-critical background operation
      }
      
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro ao atualizar lead')
      console.error(error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[760px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
              {leadInitials}
            </div>
            <div className="space-y-1">
              <SheetTitle className="flex items-center gap-2">Editar Lead</SheetTitle>
              <SheetDescription className="leading-tight">Revise e atualize os dados sem perder o contexto.</SheetDescription>
            </div>
          </div>
          {lead && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <StatusBadge
                semanticStatus={leadStatusMap(getLeadStatusById(lead.leadStatusId)?.code as any)}
                label={`Status: ${getLeadStatusById(lead.leadStatusId)?.label || lead.leadStatusId}`}
              />
              <Badge variant="secondary">Origem: {getLeadOriginById(lead.leadOriginId)?.label || lead.leadOriginId}</Badge>
            </div>
          )}
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-2">
          <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="legalName">Razão Social *</Label>
              <Input id="legalName" placeholder="Ex: Acme Corp Ltda" {...register('legalName', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tradeName">Nome Fantasia</Label>
              <Input id="tradeName" placeholder="Como seus clientes conhecem" {...register('tradeName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" placeholder="00.000.000/0000-00" {...register('cnpj')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Site</Label>
              <Input id="website" placeholder="https://empresa.com" {...register('website')} />
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium">Classificação</h3>
              <p className="text-xs text-muted-foreground">Selecione o estágio, origem e operação para alinhar o funil.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={watch('leadStatusId')} onValueChange={(v: string) => setValue('leadStatusId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadStatuses.filter(s => s.isActive).map(status => (
                      <SelectItem key={status.id} value={status.id}>{safeString(status.label, status.code)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Origem</Label>
                <Select value={watch('leadOriginId')} onValueChange={(v: string) => setValue('leadOriginId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadOrigins.filter(o => o.isActive).map(origin => (
                      <SelectItem key={origin.id} value={origin.id}>{safeString(origin.label, origin.code)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Operação</Label>
              <Select value={watch('operationType')} onValueChange={(v: string) => setValue('operationType', v)}>
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

          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Endereço e Info</h3>
                <p className="text-xs text-muted-foreground">Detalhes rápidos para sua equipe ter contexto nas próximas interações.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addressCity">Cidade</Label>
                <Input id="addressCity" placeholder="Ex: São Paulo" {...register('addressCity')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressState">Estado</Label>
                <Input id="addressState" placeholder="UF" maxLength={2} {...register('addressState')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Observações</Label>
              <Textarea id="description" placeholder="Pontos importantes antes da próxima abordagem" {...register('description')} />
            </div>
          </div>

          <Separator />

          <SheetFooter className="gap-2 sm:justify-end">
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
