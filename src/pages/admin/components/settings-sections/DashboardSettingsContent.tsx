import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useDashboardLayout, GlobalDashboardConfig } from '@/hooks/useDashboardLayout';
import { WIDGET_REGISTRY } from '@/features/dashboard/registry';
import { DEFAULT_DASHBOARD_CONFIG } from '@/constants/dashboardDefaults';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { SettingsSectionHeader } from './SettingsSectionHeader';

export default function DashboardSettingsContent() {
  const { availableWidgets, saveGlobalConfig, isLoading } = useDashboardLayout();
  const [enabledWidgets, setEnabledWidgets] = useState<string[]>(availableWidgets || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (widgetId: string) => {
    setEnabledWidgets((prev) =>
      prev.includes(widgetId) ? prev.filter((id) => id !== widgetId) : [...prev, widgetId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const newConfig: GlobalDashboardConfig = {
        availableWidgets: enabledWidgets,
        defaultConfig: DEFAULT_DASHBOARD_CONFIG
      };
      await saveGlobalConfig(newConfig);
      toast.success('Configuração do Dashboard atualizada!');
    } catch (err) {
      toast.error('Erro ao salvar configuração.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <SettingsSectionHeader
        title="Configuração do Dashboard"
        description="Defina quais widgets estão disponíveis para os usuários"
      >
        <Button onClick={handleSave} disabled={isSaving} size="sm">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </SettingsSectionHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.values(WIDGET_REGISTRY).map((widget) => {
          const isEnabled = enabledWidgets.includes(widget.id);
          return (
            <Card key={widget.id} className={isEnabled ? 'border-primary' : 'opacity-75'}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
                <Switch checked={isEnabled} onCheckedChange={() => handleToggle(widget.id)} />
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">
                  {widget.category.toUpperCase()} • {widget.defaultSize}
                </CardDescription>
                {widget.requiredPermissions && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {widget.requiredPermissions.map((p) => (
                      <Badge key={p} variant="secondary" className="text-[10px]">
                        {p}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
