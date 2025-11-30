import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQualifyLead } from '@/services/leadService'
import { useCompanies, useCreateCompany } from '@/services/companyService'
import { Lead } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Check, Buildings, ArrowRight, Spinner } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  userId: string;
}

export function QualifyLeadDialog({ open, onOpenChange, lead, userId }: Props) {
  const navigate = useNavigate()
  const qualify = useQualifyLead()
  const { data: companies, isLoading: loadingCompanies } = useCompanies()

  const [step, setStep] = useState<1 | 2>(1)
  const [mode, setMode] = useState<'existing' | 'new'>('new')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')

  // New Company Form State
  const [newName, setNewName] = useState(lead.legalName)
  const [newCnpj, setNewCnpj] = useState(lead.cnpj || '')
  const [newType, setNewType] = useState('corporation')

  // Search matches
  const matches = companies?.filter(c =>
    (lead.cnpj && c.cnpj === lead.cnpj) ||
    c.name.toLowerCase().includes(lead.legalName.toLowerCase())
  )

  const handleNext = () => {
    if (mode === 'existing' && !selectedCompanyId) {
      toast.error('Selecione uma empresa existente')
      return
    }
    if (mode === 'new' && !newName) {
       toast.error('Nome da empresa é obrigatório')
       return
    }
    setStep(2)
  }

  const handleConfirm = async () => {
    try {
      const result = await qualify.mutateAsync({
        leadId: lead.id,
        userId: userId,
        companyId: mode === 'existing' ? selectedCompanyId : undefined,
        newCompanyData: mode === 'new' ? {
          name: newName,
          cnpj: newCnpj,
          type: newType as any, // Cast to CompanyType
          relationshipLevel: 'active_client',
          site: lead.website,
          description: lead.description
        } : undefined
      })

      toast.success('Lead qualificado com sucesso!')
      onOpenChange(false)
      // Navigate to the newly created Deal or Company
      if (result.master_deal_id) {
         navigate(`/deals/${result.master_deal_id}`)
      } else {
         navigate(`/companies/${result.company_id}`)
      }
    } catch (error: any) {
      toast.error('Erro ao qualificar lead', {
        description: error.message
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Qualificar Lead</DialogTitle>
          <DialogDescription>
             Transforme este lead em um cliente ativo e inicie um novo Deal.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6 py-4">
            {/* MATCHES ALERT */}
            {matches && matches.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800 flex flex-col gap-2">
                <p className="font-semibold flex items-center gap-2">
                  <Buildings />
                  Empresas similares encontradas:
                </p>
                <ul className="list-disc pl-5">
                  {matches.map(m => (
                    <li key={m.id}>{m.name} ({m.cnpj || 'Sem CNPJ'})</li>
                  ))}
                </ul>
                <p>Considere vincular a uma existente para evitar duplicidade.</p>
              </div>
            )}

            <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'existing'|'new')} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="new" id="new" className="peer sr-only" />
                <Label
                  htmlFor="new"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Buildings className="mb-3 h-6 w-6" />
                  Nova Empresa
                </Label>
              </div>
              <div>
                <RadioGroupItem value="existing" id="existing" className="peer sr-only" />
                <Label
                  htmlFor="existing"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Check className="mb-3 h-6 w-6" />
                  Vincular Existente
                </Label>
              </div>
            </RadioGroup>

            {mode === 'new' ? (
              <div className="space-y-3 border p-4 rounded-md bg-muted/20">
                <div className="space-y-1">
                  <Label>Razão Social</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>CNPJ</Label>
                    <Input value={newCnpj} onChange={e => setNewCnpj(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Tipo</Label>
                    <Select value={newType} onValueChange={setNewType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corporation">Corporação</SelectItem>
                        <SelectItem value="fund">Fundo</SelectItem>
                        <SelectItem value="startup">Startup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 border p-4 rounded-md bg-muted/20">
                <div className="space-y-1">
                  <Label>Selecione a Empresa</Label>
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Busque..." />
                    </SelectTrigger>
                    <SelectContent>
                      {companies?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
               <h4 className="font-bold mb-2">Resumo da Qualificação</h4>
               <ul className="space-y-2 list-disc pl-4">
                 <li>Status do Lead será alterado para <strong>Qualificado</strong>.</li>
                 <li>
                   {mode === 'new'
                     ? `Será criada a empresa: ${newName}`
                     : `Vínculo com empresa existente: ${companies?.find(c => c.id === selectedCompanyId)?.name}`
                   }
                 </li>
                 <li>Será criado um <strong>Master Deal</strong> automático.</li>
                 <li>{lead.contacts?.length || 0} contatos serão migrados para a empresa.</li>
                 <li>Histórico e Equipe serão copiados.</li>
               </ul>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Esta ação é irreversível.
            </p>
          </div>
        )}

        <DialogFooter>
           {step === 2 && (
             <Button variant="outline" onClick={() => setStep(1)} disabled={qualify.isPending}>Voltar</Button>
           )}
           {step === 1 ? (
             <Button onClick={handleNext}>Continuar <ArrowRight className="ml-2 h-4 w-4"/></Button>
           ) : (
             <Button onClick={handleConfirm} disabled={qualify.isPending}>
               {qualify.isPending && <Spinner className="mr-2 animate-spin"/>}
               Confirmar Qualificação
             </Button>
           )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
