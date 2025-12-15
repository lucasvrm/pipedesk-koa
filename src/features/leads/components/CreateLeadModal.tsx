import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useNavigate } from 'react-router-dom'
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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useCreateLead, addLeadContact } from '@/services/leadService'
import { useContacts, useCreateContact } from '@/services/contactService'
import { useTags } from '@/services/tagService'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { useAuth } from '@/contexts/AuthContext'
import { OPERATION_LABELS } from '@/lib/types'
import { cn, safeString } from '@/lib/utils'
import { Check, ChevronsUpDown, Plus, User, X } from 'lucide-react'

// Brazilian States (UF)
const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
]

// Zod validation schema
const createLeadSchema = z.object({
  legalName: z.string().min(3, 'Razão Social deve ter no mínimo 3 caracteres'),
  leadOriginId: z.string().min(1, 'Selecione a origem do lead'),
  operationType: z.string().min(1, 'Selecione o tipo de operação'),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  tags: z.array(z.string()).optional(),
  contactMode: z.enum(['link', 'create']),
  existingContactId: z.string().optional(),
  newContact: z.object({
    name: z.string().optional(),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
  }).optional(),
}).refine((data) => {
  // If contact mode is 'link', existingContactId is required
  // If contact mode is 'create' and any new contact field is filled, name is required
  if (data.contactMode === 'create' && data.newContact) {
    const hasAnyField = data.newContact.email || data.newContact.phone
    if (hasAnyField && !data.newContact.name) {
      return false
    }
  }
  return true
}, {
  message: 'Nome do contato é obrigatório quando e-mail ou telefone são informados',
  path: ['newContact', 'name'],
})

type CreateLeadFormData = z.infer<typeof createLeadSchema>

interface CreateLeadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateLeadModal({ open, onOpenChange }: CreateLeadModalProps) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { leadOrigins, operationTypes } = useSystemMetadata()
  const createLead = useCreateLead()
  const createContact = useCreateContact()
  const { data: contacts = [], isLoading: isLoadingContacts } = useContacts()
  const { data: tags = [], isLoading: isLoadingTags } = useTags('lead')

  const [contactComboboxOpen, setContactComboboxOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false)

  const activeLeadOrigins = leadOrigins.filter(o => o.isActive)
  const activeOperationTypes = operationTypes.filter(o => o.isActive)

  const form = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      legalName: '',
      leadOriginId: '',
      operationType: '',
      addressCity: '',
      addressState: '',
      description: '',
      tags: [],
      contactMode: 'link',
      existingContactId: '',
      newContact: {
        name: '',
        email: '',
        phone: '',
      },
    },
  })

  const contactMode = form.watch('contactMode')
  const descriptionLength = form.watch('description')?.length || 0

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        legalName: '',
        leadOriginId: '',
        operationType: '',
        addressCity: '',
        addressState: '',
        description: '',
        tags: [],
        contactMode: 'link',
        existingContactId: '',
        newContact: {
          name: '',
          email: '',
          phone: '',
        },
      })
      setSelectedTags([])
    }
  }, [open, form])

  // Sync tags with form
  useEffect(() => {
    form.setValue('tags', selectedTags)
  }, [selectedTags, form])

  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }, [])

  const handleRemoveTag = useCallback((tagId: string) => {
    setSelectedTags(prev => prev.filter(id => id !== tagId))
  }, [])

  const onSubmit = async (data: CreateLeadFormData) => {
    if (!profile?.id) {
      toast.error('Usuário não autenticado')
      return
    }

    try {
      // Create the lead
      const lead = await createLead.mutateAsync({
        data: {
          legalName: data.legalName,
          leadOriginId: data.leadOriginId,
          operationType: data.operationType,
          addressCity: data.addressCity || undefined,
          addressState: data.addressState || undefined,
          description: data.description || undefined,
        },
        userId: profile.id,
      })

      // Handle contact association
      if (data.contactMode === 'link' && data.existingContactId) {
        // Link existing contact to lead
        await addLeadContact(lead.id, data.existingContactId, true)
      } else if (data.contactMode === 'create' && data.newContact?.name) {
        // Create new contact and link to lead
        const newContact = await createContact.mutateAsync({
          data: {
            name: data.newContact.name,
            email: data.newContact.email || undefined,
            phone: data.newContact.phone || undefined,
          },
          userId: profile.id,
        })
        await addLeadContact(lead.id, newContact.id, true)
      }

      // TODO: Assign tags to lead after creation
      // This would require the tag assignment API to accept lead entity type
      // For now, tags are stored in the form but not yet assigned

      toast.success('Lead criado com sucesso!')
      onOpenChange(false)
      navigate(`/leads/${lead.id}`)
    } catch (error) {
      console.error('Erro ao criar lead:', error)
      toast.error('Erro ao criar lead. Tente novamente.')
    }
  }

  const getContactLabel = (contactId: string): string => {
    const contact = contacts.find(c => c.id === contactId)
    if (!contact) return 'Selecione um contato...'
    return contact.name + (contact.email ? ` (${contact.email})` : '')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>
            Cadastre um novo lead com as informações básicas. Campos obrigatórios estão marcados com *.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Required Fields Section */}
            <div className="space-y-4">
              {/* Razão Social */}
              <FormField
                control={form.control}
                name="legalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Acme Corp Ltda"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Origem do Lead */}
              <FormField
                control={form.control}
                name="leadOriginId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem do Lead *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a origem" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeLeadOrigins.map(origin => (
                          <SelectItem key={origin.id} value={origin.id}>
                            {safeString(origin.label, origin.code)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo de Operação */}
              <FormField
                control={form.control}
                name="operationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Operação *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {activeOperationTypes.length > 0 ? (
                          activeOperationTypes.map(op => (
                            <SelectItem key={op.id} value={op.name}>
                              {op.name}
                            </SelectItem>
                          ))
                        ) : (
                          Object.entries(OPERATION_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
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

            {/* Contact Section */}
            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Contato Principal</h3>
              </div>

              <Tabs 
                value={contactMode} 
                onValueChange={(v) => form.setValue('contactMode', v as 'link' | 'create')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="link">Vincular Existente</TabsTrigger>
                  <TabsTrigger value="create">Criar Novo</TabsTrigger>
                </TabsList>

                <TabsContent value="link" className="mt-0">
                  <FormField
                    control={form.control}
                    name="existingContactId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <Popover open={contactComboboxOpen} onOpenChange={setContactComboboxOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={contactComboboxOpen}
                                aria-label="Selecionar contato"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                                disabled={isLoadingContacts}
                              >
                                <span className="truncate">
                                  {field.value ? getContactLabel(field.value) : 'Selecione um contato...'}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Buscar contato..." />
                              <CommandList>
                                <CommandEmpty>Nenhum contato encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {contacts.map((contact) => (
                                    <CommandItem
                                      value={contact.name}
                                      key={contact.id}
                                      onSelect={() => {
                                        form.setValue('existingContactId', contact.id)
                                        setContactComboboxOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          contact.id === field.value ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span>{contact.name}</span>
                                        {contact.email && (
                                          <span className="text-xs text-muted-foreground">{contact.email}</span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="create" className="mt-0 space-y-3">
                  <FormField
                    control={form.control}
                    name="newContact.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Contato</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="newContact.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="email@exemplo.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newContact.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Location Section */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="addressCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: São Paulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addressState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {BRAZILIAN_STATES.map(state => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.value} - {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o contexto do lead, necessidades identificadas ou observações importantes..."
                      className="resize-none min-h-[100px]"
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <span className={cn(
                      "text-xs",
                      descriptionLength > 450 ? "text-amber-500" : "text-muted-foreground",
                      descriptionLength >= 500 && "text-destructive"
                    )}>
                      {descriptionLength}/500
                    </span>
                  </div>
                </FormItem>
              )}
            />

            {/* Tags Section */}
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex flex-wrap gap-2 min-h-[36px] p-2 border rounded-md bg-background">
                {selectedTags.length === 0 ? (
                  <span className="text-sm text-muted-foreground">Nenhuma tag selecionada</span>
                ) : (
                  selectedTags.map(tagId => {
                    const tag = tags.find(t => t.id === tagId)
                    if (!tag) return null
                    return (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="gap-1 pr-1"
                        style={{ 
                          backgroundColor: tag.color + '20',
                          borderColor: tag.color,
                          color: tag.color
                        }}
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag.id)}
                          className="ml-1 rounded-full hover:bg-muted p-0.5"
                          aria-label={`Remover tag ${tag.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })
                )}
                <Popover open={tagsPopoverOpen} onOpenChange={setTagsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      disabled={isLoadingTags}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Selecionar Tags</p>
                      <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                        {tags.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Nenhuma tag disponível</span>
                        ) : (
                          tags.map(tag => (
                            <Badge
                              key={tag.id}
                              variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                              className="cursor-pointer hover:opacity-80"
                              onClick={() => handleTagToggle(tag.id)}
                              style={
                                selectedTags.includes(tag.id)
                                  ? { backgroundColor: tag.color, borderColor: tag.color }
                                  : { color: tag.color, borderColor: tag.color + '40' }
                              }
                            >
                              {tag.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <FormDescription>
                Tags ajudam a categorizar e filtrar leads rapidamente.
              </FormDescription>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting || createLead.isPending}
              >
                {form.formState.isSubmitting || createLead.isPending ? 'Criando...' : 'Criar Lead'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
