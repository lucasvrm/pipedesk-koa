import { useState } from 'react'
import { StandardPageLayout } from '@/components/layouts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useDashboardLayout, GlobalDashboardConfig } from '@/hooks/useDashboardLayout'
import { WIDGET_REGISTRY } from '@/features/dashboard/registry'
import { DEFAULT_DASHBOARD_CONFIG } from '@/constants/dashboardDefaults'
import { FloppyDisk } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function DashboardSettingsPage() {
  const { availableWidgets, saveGlobalConfig, isLoading } = useDashboardLayout()
  const [enabledWidgets, setEnabledWidgets] = useState<string[]>(availableWidgets || [])
  const [isSaving, setIsSaving] = useState(false)

  // Sync state when data loads
  // Note: useEffect might be better but let's assume availableWidgets stabilizes quickly
  // or use a better form state management. For this task, we initialize once.

  const handleToggle = (widgetId: string) => {
    setEnabledWidgets(prev =>
      prev.includes(widgetId)
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const newConfig: GlobalDashboardConfig = {
        availableWidgets: enabledWidgets,
        defaultConfig: DEFAULT_DASHBOARD_CONFIG // Reset default or keep existing? Simplest is keep constant for now.
      }
      await saveGlobalConfig(newConfig)
      toast.success('Configuração global do Dashboard atualizada!')
    } catch (err) {
      toast.error('Erro ao salvar configuração.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="p-8">Carregando configurações...</div>

  return (
    <StandardPageLayout>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuração do Dashboard</h2>
          <p className="text-muted-foreground">
            Defina quais widgets estão disponíveis para os usuários da organização.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <FloppyDisk className="mr-2 h-4 w-4" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.values(WIDGET_REGISTRY).map((widget) => {
            const isEnabled = enabledWidgets.includes(widget.id)
            return (
                <Card key={widget.id} className={isEnabled ? 'border-primary' : 'opacity-75'}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-medium">
                            {widget.title}
                        </CardTitle>
                        <Switch
                            checked={isEnabled}
                            onCheckedChange={() => handleToggle(widget.id)}
                        />
                    </CardHeader>
                    <CardContent>
                        <CardDescription>
                            {widget.category.toUpperCase()} • {widget.defaultSize}
                        </CardDescription>
                        {widget.requiredPermissions && (
                            <div className="mt-2 flex gap-1">
                                {widget.requiredPermissions.map(p => (
                                    <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )
        })}
      </div>
    </StandardPageLayout>
  )
}
