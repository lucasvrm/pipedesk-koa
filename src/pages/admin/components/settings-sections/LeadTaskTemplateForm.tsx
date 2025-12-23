import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { LeadTaskTemplate } from '@/services/leadTaskTemplatesService'

const formSchema = z.object({
  code: z
    .string()
    .min(1, 'Código é obrigatório')
    .max(100)
    .regex(/^[a-z_]+$/, 'Apenas letras minúsculas e underscores'),
  label: z.string().min(1, 'Label é obrigatório').max(200),
  description: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
})

type FormValues = z.infer<typeof formSchema>

interface LeadTaskTemplateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: LeadTaskTemplate | null
  onSubmit: (data: FormValues) => void
  isSubmitting?: boolean
}

export function LeadTaskTemplateForm({
  open,
  onOpenChange,
  template,
  onSubmit,
  isSubmitting,
}: LeadTaskTemplateFormProps) {
  const isEditing = !!template

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      label: '',
      description: '',
      is_active: true,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        code: template?.code || '',
        label: template?.label || '',
        description: template?.description || '',
        is_active: template?.is_active ?? true,
      })
    }
  }, [open, template, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Template' : 'Novo Template de Tarefa'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex: schedule_meeting"
                      disabled={isEditing}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Identificador único (snake_case). Não pode ser alterado.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Agendar reunião" {...field} />
                  </FormControl>
                  <FormDescription>Nome exibido na interface.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição detalhada da tarefa..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Ativo</FormLabel>
                    <FormDescription>
                      Templates inativos não aparecem para seleção.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
