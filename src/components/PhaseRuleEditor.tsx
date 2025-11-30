import { useState, useEffect, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash, WarningCircle, Check, X, Code } from '@phosphor-icons/react'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  PhaseTransitionRule,
  AVAILABLE_FIELDS,
  OPERATORS_BY_TYPE,
  OPERATOR_LABELS,
  FieldType,
  ValidationOperator,
} from '@/lib/phaseValidation'
import { useStages } from '@/services/pipelineService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { nanoid } from 'nanoid'

// --- SCHEMAS ---

const conditionSchema = z.object({
  id: z.string(),
  fieldName: z.string().min(1, 'Campo obrigatório'),
  fieldType: z.string() as z.Schema<FieldType>,
  operator: z.string() as z.Schema<ValidationOperator>,
  value: z.any().optional(),
  label: z.string().optional(),
})

const ruleSchema = z.object({
  id: z.string().optional(),
  fromStage: z.string().min(1, 'Estágio de origem é obrigatório'),
  toStage: z.string().min(1, 'Estágio de destino é obrigatório'),
  errorMessage: z.string().min(1, 'Mensagem de erro é obrigatória'),
  requireAll: z.boolean(),
  enabled: z.boolean(),
  conditions: z.array(conditionSchema).min(1, 'É necessária pelo menos uma condição'),
})

type RuleFormValues = z.infer<typeof ruleSchema>

interface PhaseRuleEditorProps {
  ruleToEdit?: PhaseTransitionRule | null
  onSave: (rule: PhaseTransitionRule) => Promise<void>
  onCancel: () => void
  isSaving: boolean
  onDelete?: (ruleId: string) => Promise<void>
}

export function PhaseRuleEditor({ ruleToEdit, onSave, onCancel, isSaving, onDelete }: PhaseRuleEditorProps) {
  const { data: stages = [] } = useStages()
  const isEdit = !!ruleToEdit

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      id: ruleToEdit?.id,
      fromStage: ruleToEdit?.fromStage || 'any',
      toStage: ruleToEdit?.toStage || '',
      errorMessage: ruleToEdit?.errorMessage || 'Requisitos de avanço não atendidos.',
      requireAll: ruleToEdit?.requireAll ?? true,
      enabled: ruleToEdit?.enabled ?? true,
      conditions: ruleToEdit?.conditions?.length
        ? ruleToEdit.conditions.map(c => ({ ...c, id: nanoid() }))
        : [{ id: nanoid(), fieldName: 'track.notes', fieldType: 'text', operator: 'is_empty', value: '', label: 'Observações do Track' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'conditions',
  })

  // Sincroniza fieldType e label quando fieldName muda
  useEffect(() => {
    fields.forEach((field, index) => {
      const fieldName = form.watch(`conditions.${index}.fieldName`)
      const config = AVAILABLE_FIELDS[fieldName]
      if (config) {
        form.setValue(`conditions.${index}.fieldType`, config.type)
        form.setValue(`conditions.${index}.label`, config.label)
        // Redefine o operador se for incompatível
        const currentOperator = form.getValues(`conditions.${index}.operator`)
        if (!OPERATORS_BY_TYPE[config.type].includes(currentOperator)) {
          form.setValue(`conditions.${index}.operator`, OPERATORS_BY_TYPE[config.type][0])
          form.setValue(`conditions.${index}.value`, undefined)
        }
      }
    })
  }, [form.watch, fields, form])

  const onSubmit = async (values: RuleFormValues) => {
    // Limpa a propriedade 'value' se o operador for is_filled ou is_empty
    const cleanedConditions = values.conditions.map(c => {
        if (c.operator === 'is_filled' || c.operator === 'is_empty') {
            return { ...c, value: undefined }
        }
        return c
    })

    const rule: PhaseTransitionRule = {
        ...values,
        conditions: cleanedConditions,
        id: ruleToEdit?.id || nanoid(),
        fromStage: values.fromStage as PlayerStage | 'any',
        toStage: values.toStage as PlayerStage,
    }
    
    await onSave(rule)
  }

  // Define os estágios disponíveis para a transição
  const stageOptions = useMemo(() => {
    return stages.map(s => ({ value: s.id, label: s.name }))
  }, [stages])


  return (
    <Card className="shadow-none border-0">
      <CardHeader>
        <CardTitle className="text-xl">
          {isEdit ? 'Editar Regra' : 'Nova Regra de Validação'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Defina as condições que devem ser atendidas para avançar um Track de uma fase para outra.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* ESTÁGIOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>De Estágio (Origem)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Qualquer Estágio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="any">Qualquer Estágio</SelectItem>
                        <SelectContent>
                          {stageOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Para Estágio (Destino)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Estágio de Destino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stageOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* CONDIÇÕES */}
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Code className="h-5 w-5" /> Condições
                </CardTitle>
                <div className="flex items-center gap-4">
                    <FormField
                        control={form.control}
                        name="requireAll"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0 p-2 border rounded-md">
                              <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} id="require-all-switch" />
                              </FormControl>
                              <FormLabel htmlFor="require-all-switch" className="text-sm font-medium pt-1">
                                  Requerer TODAS as condições ({field.value ? 'E/AND' : 'OU/OR'})
                              </FormLabel>
                          </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0 p-2 border rounded-md">
                              <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} id="enabled-switch" />
                              </FormControl>
                              <FormLabel htmlFor="enabled-switch" className="text-sm font-medium pt-1">
                                  Regra Ativa
                              </FormLabel>
                          </FormItem>
                        )}
                    />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                {fields.map((field, index) => (
                  <div key={field.id} className="p-3 border rounded-lg bg-muted/10 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-muted-foreground">CONDIÇÃO {index + 1}</span>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                        >
                            <Trash className="h-3 w-3" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Campo */}
                      <FormField
                        control={form.control}
                        name={`conditions.${index}.fieldName`}
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o Campo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(AVAILABLE_FIELDS).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    {config.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Operador */}
                      <FormField
                        control={form.control}
                        name={`conditions.${index}.operator`}
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o Operador" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {OPERATORS_BY_TYPE[form.watch(`conditions.${index}.fieldType`) || 'text']?.map(opKey => (
                                  <SelectItem key={opKey} value={opKey}>
                                    {OPERATOR_LABELS[opKey]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Valor (Apenas se não for is_filled/is_empty) */}
                      {form.watch(`conditions.${index}.operator`) !== 'is_filled' &&
                       form.watch(`conditions.${index}.operator`) !== 'is_empty' && (
                        <FormField
                            control={form.control}
                            name={`conditions.${index}.value`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    placeholder="Valor esperado"
                                    type={form.watch(`conditions.${index}.fieldType`) === 'number' ? 'number' : 'text'}
                                    step={form.watch(`conditions.${index}.fieldType`) === 'number' ? '0.01' : undefined}
                                    {...field}
                                    onChange={(e) => {
                                        const val = form.watch(`conditions.${index}.fieldType`) === 'number' 
                                            ? parseFloat(e.target.value) 
                                            : e.target.value;
                                        field.onChange(val);
                                    }}
                                    value={field.value === undefined ? '' : field.value}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                        />
                      )}
                    </div>
                  </div>
                ))}
                
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-dashed"
                    onClick={() => append({ id: nanoid(), fieldName: 'track.notes', fieldType: 'text', operator: 'is_empty', value: '', label: 'Observações do Track' })}
                >
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Condição
                </Button>
              </CardContent>
            </Card>

            {/* MENSAGEM DE ERRO */}
            <FormField
              control={form.control}
              name="errorMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-destructive">Mensagem de Erro Personalizada</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ex: Preencha o volume do deal antes de avançar!" 
                      {...field} 
                      className="h-16 resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between items-center pt-4">
                {isEdit && onDelete ? (
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => onDelete(ruleToEdit.id)}
                        className="text-destructive hover:bg-destructive/10"
                        disabled={isSaving}
                    >
                        <Trash className="mr-2 h-4 w-4" /> Excluir Regra
                    </Button>
                ) : <div />}
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        <Check className="mr-2 h-4 w-4" />
                        {isSaving ? 'Salvando...' : (isEdit ? 'Salvar Regra' : 'Criar Regra')}
                    </Button>
                </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}