import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardFiltersProvider } from '@/contexts/DashboardFiltersContext'
import { PageContainer } from '@/components/PageContainer'
import { Button } from '@/components/ui/button'
import { 
  HandWaving, 
  Briefcase,
  Plus, 
  Gear,
  Checks,
  ArrowCounterClockwise,
  ArrowUp,
  ArrowDown
} from '@phosphor-icons/react'
import { useDashboardLayout, DashboardConfig } from '@/hooks/useDashboardLayout'
import { WIDGET_REGISTRY } from '@/features/dashboard/registry'
import { DEFAULT_DASHBOARD_CONFIG } from '@/constants/dashboardDefaults'
import { DashboardToolbar } from '@/features/dashboard/components/DashboardToolbar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { layout, availableWidgets, allWidgets, saveUserLayout } = useDashboardLayout()

  const [isCustomizing, setIsCustomizing] = useState(false)
  const [tempLayout, setTempLayout] = useState<DashboardConfig>(layout)

  const handleOpenCustomize = () => {
    setTempLayout(layout) // Reset to current
    setIsCustomizing(true)
  }

  const handleSaveCustomize = async () => {
    try {
      await saveUserLayout.mutateAsync(tempLayout)
      setIsCustomizing(false)
      toast.success('Dashboard personalizado com sucesso!')
    } catch (error) {
      console.error('Error saving dashboard layout:', error)
      toast.error('Erro ao salvar personalização. Tente novamente.')
    }
  }

  const handleResetDefaults = () => {
    if (window.confirm('Deseja restaurar as configurações padrão? Suas personalizações serão perdidas.')) {
        // Reset local state to default
        setTempLayout(DEFAULT_DASHBOARD_CONFIG);
        // Persist reset immediately or let user click save?
        // Better let user click save to confirm, but visually update state now.
        // Or cleaner: just call save with default.
        saveUserLayout.mutateAsync(DEFAULT_DASHBOARD_CONFIG).then(() => {
            setIsCustomizing(false);
            toast.success('Padrões restaurados.');
        });
    }
  }

  const toggleWidget = (widgetId: string) => {
    setTempLayout(prev => {
      const widgets = prev?.widgets || [];
      const exists = widgets.some(w => w.id === widgetId);
      if (exists) {
        // Remove widget
        return {
          widgets: widgets.filter(w => w.id !== widgetId)
        };
      } else {
        // Add widget with default size
        const widgetDef = WIDGET_REGISTRY[widgetId];
        return {
          widgets: [...widgets, { id: widgetId, size: widgetDef?.defaultSize || 'medium' }]
        };
      }
    });
  }

  const updateWidgetSize = (widgetId: string, size: 'small' | 'medium' | 'large' | 'full') => {
    setTempLayout(prev => ({
      widgets: (prev?.widgets || []).map(w => w.id === widgetId ? { ...w, size } : w)
    }));
  }

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    setTempLayout(prev => {
      const newWidgets = [...(prev?.widgets || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex < 0 || targetIndex >= newWidgets.length) return prev;
      
      [newWidgets[index], newWidgets[targetIndex]] = [newWidgets[targetIndex], newWidgets[index]];
      
      return { widgets: newWidgets };
    });
  }

  // Helper to get grid class based on size
  const getGridClass = (size: 'small' | 'medium' | 'large' | 'full') => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-1 md:col-span-2';
      case 'large':
        return 'col-span-1 md:col-span-2 lg:col-span-3';
      case 'full':
        return 'col-span-full';
      default:
        return 'col-span-1';
    }
  }

  return (
    <DashboardFiltersProvider>
      <PageContainer>
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <HandWaving className="text-yellow-500 animate-pulse" weight="fill" />
              Olá, {profile?.name?.split(' ')[0]}
            </h2>
            <p className="text-muted-foreground mt-1">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleOpenCustomize} title="Personalizar Dashboard">
               <Gear className="mr-2 h-4 w-4" /> Personalizar
            </Button>
            <Button onClick={() => navigate('/deals')} variant="outline" className="hidden md:flex">
              <Briefcase className="mr-2 h-4 w-4" />
              Ver Deals
            </Button>
            <Button onClick={() => navigate('/tasks')} className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>
        </div>

        {/* --- TOOLBAR (FILTERS) --- */}
        <DashboardToolbar />

      {/* --- UNIFIED GRID LAYOUT --- */}
      {layout.widgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2">
            {layout.widgets.map(({ id, size }) => {
                const widgetDef = WIDGET_REGISTRY[id];
                
                // Handle "Widget not found" gracefully
                if (!widgetDef) {
                  return (
                    <div key={id} className={`${getGridClass(size)} min-h-[120px] border-2 border-dashed rounded-lg p-4 flex items-center justify-center`}>
                      <div className="text-center text-muted-foreground">
                        <p className="text-sm font-medium">Widget não encontrado</p>
                        <p className="text-xs mt-1">ID: {id}</p>
                      </div>
                    </div>
                  );
                }
                
                const Component = widgetDef.component;
                return (
                    <div key={id} className={getGridClass(size)}>
                        <Component />
                    </div>
                )
            })}
          </div>
      ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
             <p className="text-muted-foreground mb-4">Seu dashboard está vazio.</p>
             <Button onClick={handleOpenCustomize}>Adicionar Widgets</Button>
          </div>
      )}

      {/* --- CUSTOMIZE DIALOG --- */}
      <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Personalizar Dashboard</DialogTitle>
                <DialogDescription>Escolha quais informações você quer ver e organize sua dashboard.</DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 py-4">
                {/* Current Widgets Section */}
                {(tempLayout?.widgets || []).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Widgets Ativos ({(tempLayout?.widgets || []).length})</h3>
                    <div className="space-y-2">
                      {(tempLayout?.widgets || []).map((widget, index) => {
                        const widgetDef = WIDGET_REGISTRY[widget.id];
                        if (!widgetDef) return null;
                        
                        return (
                          <div key={widget.id} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => moveWidget(index, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => moveWidget(index, 'down')}
                                disabled={index === (tempLayout?.widgets || []).length - 1}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <Label className="text-sm font-medium">{widgetDef.title}</Label>
                              <p className="text-xs text-muted-foreground truncate">{widgetDef.category}</p>
                            </div>
                            
                            {widgetDef.availableSizes && widgetDef.availableSizes.length > 1 ? (
                              <Select
                                value={widget.size}
                                onValueChange={(size: 'small' | 'medium' | 'large' | 'full') => updateWidgetSize(widget.id, size)}
                              >
                                <SelectTrigger className="w-28 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {widgetDef.availableSizes.map(size => (
                                    <SelectItem key={size} value={size} className="text-xs">
                                      {size === 'small' && 'Pequeno'}
                                      {size === 'medium' && 'Médio'}
                                      {size === 'large' && 'Grande'}
                                      {size === 'full' && 'Total'}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs text-muted-foreground w-28 text-center">
                                {widget.size === 'small' && 'Pequeno'}
                                {widget.size === 'medium' && 'Médio'}
                                {widget.size === 'large' && 'Grande'}
                                {widget.size === 'full' && 'Total'}
                              </span>
                            )}
                            
                            <Switch
                              checked={true}
                              onCheckedChange={() => toggleWidget(widget.id)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <Separator />
                
                {/* Available Widgets Section */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Widgets Disponíveis</h3>
                  <div className="space-y-2">
                    {allWidgets
                      .filter(w => (availableWidgets || []).includes(w.id))
                      .filter(w => !(tempLayout?.widgets || []).some(tw => tw.id === w.id))
                      .map(widget => (
                        <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                          <div className="flex-1">
                            <Label className="text-sm font-medium">{widget.title}</Label>
                            <p className="text-xs text-muted-foreground">
                              {widget.category} • Tamanho padrão: {widget.defaultSize}
                            </p>
                          </div>
                          <Switch
                            checked={false}
                            onCheckedChange={() => toggleWidget(widget.id)}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="flex justify-between sm:justify-between w-full">
                <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleResetDefaults}>
                    <ArrowCounterClockwise className="mr-2" /> Restaurar Padrões
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsCustomizing(false)}>Cancelar</Button>
                    <Button onClick={handleSaveCustomize}>
                        <Checks className="mr-2" /> Salvar
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
    </DashboardFiltersProvider>
  )
}
