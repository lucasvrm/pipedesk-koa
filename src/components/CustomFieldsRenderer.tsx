import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomFieldDefinition, CustomFieldValue, User } from '@/lib/types'
import { generateId } from '@/lib/helpers'
import { Tag, Info } from '@phosphor-icons/react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface CustomFieldsRendererProps {
  entityId: string
  entityType: 'deal' | 'track' | 'task'
  currentUser: User
  mode?: 'view' | 'edit'
  onChange?: (values: Record<string, any>) => void
}

export default function CustomFieldsRenderer({
  entityId,
  entityType,
  currentUser,
  mode = 'view',
  onChange,
}: CustomFieldsRendererProps) {
  const [customFieldDefinitions] = useKV<CustomFieldDefinition[]>('customFieldDefinitions', [])
  const [customFieldValues, setCustomFieldValues] = useKV<CustomFieldValue[]>('customFieldValues', [])
  const [localValues, setLocalValues] = useState<Record<string, any>>({})

  const relevantFields = (customFieldDefinitions || [])
    .filter(f => f.entityType === entityType)
    .sort((a, b) => a.position - b.position)

  useEffect(() => {
    const existingValues = (customFieldValues || []).filter(
      v => v.entityId === entityId && v.entityType === entityType
    )

    const valuesMap: Record<string, any> = {}
    existingValues.forEach(v => {
      const fieldDef = relevantFields.find(f => f.id === v.fieldDefinitionId)
      if (fieldDef) {
        valuesMap[fieldDef.key] = v.value
      }
    })

    relevantFields.forEach(field => {
      if (!(field.key in valuesMap) && field.defaultValue !== undefined) {
        valuesMap[field.key] = field.defaultValue
      }
    })

    setLocalValues(valuesMap)
  }, [entityId, entityType, customFieldDefinitions, customFieldValues])

  const handleValueChange = (fieldDef: CustomFieldDefinition, value: any) => {
    const newValues = { ...localValues, [fieldDef.key]: value }
    setLocalValues(newValues)

    const existingValue = (customFieldValues || []).find(
      v => v.entityId === entityId && v.fieldDefinitionId === fieldDef.id
    )

    if (existingValue) {
      setCustomFieldValues((current) =>
        (current || []).map(v =>
          v.id === existingValue.id
            ? { ...v, value, updatedAt: new Date().toISOString(), updatedBy: currentUser.id }
            : v
        )
      )
    } else {
      const newValue: CustomFieldValue = {
        id: generateId(),
        fieldDefinitionId: fieldDef.id,
        entityId,
        entityType,
        value,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.id,
      }
      setCustomFieldValues((current) => [...(current || []), newValue])
    }

    if (onChange) {
      onChange(newValues)
    }
  }

  const renderField = (field: CustomFieldDefinition) => {
    const value = localValues[field.key]

    if (mode === 'view') {
      return renderViewMode(field, value)
    }

    return renderEditMode(field, value)
  }

  const renderViewMode = (field: CustomFieldDefinition, value: any) => {
    if (value === undefined || value === null || value === '') {
      return <p className="text-sm text-muted-foreground italic">Não informado</p>
    }

    switch (field.type) {
      case 'boolean':
        return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Sim' : 'Não'}</Badge>
      case 'multiselect':
        return (
          <div className="flex flex-wrap gap-1">
            {Array.isArray(value) && value.map((v, i) => (
              <Badge key={i} variant="secondary">{v}</Badge>
            ))}
          </div>
        )
      case 'url':
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
            {value}
          </a>
        )
      case 'email':
        return (
          <a href={`mailto:${value}`} className="text-sm text-primary hover:underline">
            {value}
          </a>
        )
      case 'date':
        return <p className="text-sm">{new Date(value).toLocaleDateString('pt-BR')}</p>
      default:
        return <p className="text-sm">{String(value)}</p>
    }
  }

  const renderEditMode = (field: CustomFieldDefinition, value: any) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            id={`field-${field.key}`}
            value={value || ''}
            onChange={(e) => handleValueChange(field, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )

      case 'number':
        return (
          <Input
            id={`field-${field.key}`}
            type="number"
            value={value || ''}
            onChange={(e) => handleValueChange(field, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )

      case 'date':
        return (
          <Input
            id={`field-${field.key}`}
            type="date"
            value={value || ''}
            onChange={(e) => handleValueChange(field, e.target.value)}
            required={field.required}
          />
        )

      case 'url':
        return (
          <Input
            id={`field-${field.key}`}
            type="url"
            value={value || ''}
            onChange={(e) => handleValueChange(field, e.target.value)}
            placeholder={field.placeholder || 'https://'}
            required={field.required}
          />
        )

      case 'email':
        return (
          <Input
            id={`field-${field.key}`}
            type="email"
            value={value || ''}
            onChange={(e) => handleValueChange(field, e.target.value)}
            placeholder={field.placeholder || 'email@exemplo.com'}
            required={field.required}
          />
        )

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(v) => handleValueChange(field, v)}
            required={field.required}
          >
            <SelectTrigger id={`field-${field.key}`}>
              <SelectValue placeholder={field.placeholder || 'Selecione...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multiselect': {
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center gap-2">
                <Checkbox
                  id={`field-${field.key}-${option}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option]
                      : selectedValues.filter(v => v !== option)
                    handleValueChange(field, newValues)
                  }}
                />
                <Label htmlFor={`field-${field.key}-${option}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )
      }

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Switch
              id={`field-${field.key}`}
              checked={value || false}
              onCheckedChange={(checked) => handleValueChange(field, checked)}
            />
            <Label htmlFor={`field-${field.key}`} className="cursor-pointer">
              {value ? 'Sim' : 'Não'}
            </Label>
          </div>
        )

      default:
        return null
    }
  }

  if (relevantFields.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag />
          Campos Customizados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {relevantFields.map((field) => (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`field-${field.key}`}>
                {field.name}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {field.helpText && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">{field.helpText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {renderField(field)}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function validateCustomFields(
  entityType: 'deal' | 'track' | 'task',
  values: Record<string, any>,
  customFieldDefinitions: CustomFieldDefinition[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const relevantFields = customFieldDefinitions.filter(f => f.entityType === entityType)

  relevantFields.forEach(field => {
    if (field.required) {
      const value = values[field.key]
      if (value === undefined || value === null || value === '') {
        errors.push(`${field.name} é obrigatório`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}
