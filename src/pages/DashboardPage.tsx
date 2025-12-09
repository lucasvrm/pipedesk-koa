import { useState, useMemo } from 'react'
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
  ArrowDown,
  MagnifyingGlass
} from '@phosphor-icons/react'
import { useDashboardLayout, DashboardConfig } from '@/hooks/useDashboardLayout'
import { WIDGET_REGISTRY } from '@/features/dashboard/registry'
import { DEFAULT_DASHBOARD_CONFIG } from '@/constants/dashboardDefaults'
import { DashboardToolbar } from '@/features/dashboard/components/DashboardToolbar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { WidgetErrorBoundary } from '@/components/WidgetErrorBoundary'
import { toast } from 'sonner'
import { UserRole } from '@/lib/types'

export default function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { layout, allWidgets, saveUserLayout } = useDashboardLayout()

  const [isCustomizing, setIsCustomizing] = useState(false)
  const [tempLayout, setTempLayout] = useState<DashboardConfig>(layout)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter widgets that user has permission to use based on their role
  const userAccessibleWidgets = useMemo(() => {
    return allWidgets.filter(widget => {
      // If user is admin, they should see everything
      if (profile?.role === 'admin') {
        return true;
      }

      // Check role-based access
      if (widget.requiredRoles) {
        // If profile is not loaded yet, hide restricted widgets safely
        if (!profile?.role) {
          return false;
        }
        if (!widget.requiredRoles.includes(profile.role as UserRole)) {
          return false;
        }
      }

      // If no role restriction, widget is accessible to all users
      return true;
    });
  }, [allWidgets, profile?.role])

  const filteredAvailableWidgets = useMemo(() => {
    return userAccessibleWidgets
      .filter(w => !(tempLayout?.widgets || []).some(tw => tw.id === w.id))
      .filter(w => w.title.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [userAccessibleWidgets, tempLayout, searchTerm])

  // Group widgets by category
  const groupedWidgets = useMemo(() => {
    const groups: Record<string, typeof filteredAvailableWidgets> = {
      'KPIs': [],
      'Gráficos': [],
      'Listas': [],
      'Operacional': []
    }

    filteredAvailableWidgets.forEach(w => {
      const categoryLabel =
        w.category === 'kpi' ? 'KPIs' :
        w.category === 'chart' ? 'Gráficos' :
        w.category === 'list' ? 'Listas' : 'Operacional';

      if (groups[categoryLabel]) {
        groups[categoryLabel].push(w);
      } else {
         // Fallback
         groups['Operacional'].push(w);
      }
    })

    return groups
  }, [filteredAvailableWidgets])

  const handleOpenCustomize = () => {
    setTempLayout(layout) // Reset to current
    setSearchTerm('')
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
        // Persist reset immediately
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
                    <div key={id} className={`${getGridClass(size)} min-h-32 border-2 border-dashed rounded-lg p-4 flex items-center justify-center`}>
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
                        <WidgetErrorBoundary widgetId={id} widgetTitle={widgetDef.title}>
                            <Component />
                        </WidgetErrorBoundary>
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

      {/* --- CUSTOMIZE SHEET --- */}
      <Sheet open={isCustomizing} onOpenChange={setIsCustomizing}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 overflow-hidden">
            <SheetHeader className="p-6 pb-4 border-b">
                <SheetTitle>Personalizar Dashboard</SheetTitle>
                <SheetDescription>Organize os widgets da sua área de trabalho.</SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1 w-full">
              <div className="p-6 space-y-8">

                {/* Current Widgets Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Widgets Ativos ({(tempLayout?.widgets || []).length})</h3>
                  </div>

                  {(tempLayout?.widgets || []).length === 0 ? (
                    <div className="text-sm text-muted-foreground italic p-4 text-center border rounded-lg border-dashed bg-muted/20">
                      Nenhum widget ativo.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(tempLayout?.widgets || []).map((widget, index) => {
                        const widgetDef = WIDGET_REGISTRY[widget.id];
                        if (!widgetDef) return null;
                        
                        return (
                          <div key={widget.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card shadow-sm hover:border-primary/50 transition-colors">
                            <div className="flex flex-col gap-1 flex-shrink-0 text-muted-foreground">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-muted hover:text-foreground"
                                onClick={() => moveWidget(index, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-muted hover:text-foreground"
                                onClick={() => moveWidget(index, 'down')}
                                disabled={index === (tempLayout?.widgets || []).length - 1}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Label className="text-sm font-medium truncate">{widgetDef.title}</Label>
                                <Badge variant="outline" className="text-[10px] px-1 h-4 font-normal text-muted-foreground">
                                  {widgetDef.category}
                                </Badge>
                              </div>

                              {widgetDef.availableSizes && widgetDef.availableSizes.length > 1 ? (
                                <Select
                                  value={widget.size}
                                  onValueChange={(size: 'small' | 'medium' | 'large' | 'full') => updateWidgetSize(widget.id, size)}
                                >
                                  <SelectTrigger className="w-full h-7 text-xs">
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
                                <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 inline-block">
                                  {widget.size === 'small' && 'Pequeno'}
                                  {widget.size === 'medium' && 'Médio'}
                                  {widget.size === 'large' && 'Grande'}
                                  {widget.size === 'full' && 'Total'}
                                </div>
                              )}
                            </div>
                            
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0" onClick={() => toggleWidget(widget.id)}>
                              <Switch checked={true} />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Available Widgets Section */}
                <div className="space-y-4">
                  <div className="sticky top-0 bg-background pt-1 pb-4 z-10">
                    <h3 className="text-sm font-semibold mb-3">Adicionar Widgets</h3>
                    <div className="relative">
                      <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar widgets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>

                  {Object.entries(groupedWidgets).map(([category, widgets]) => {
                    if (widgets.length === 0) return null;
                    return (
                      <div key={category} className="space-y-2">
                         <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">{category}</h4>
                         <div className="grid grid-cols-1 gap-2">
                            {widgets.map(widget => (
                              <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => toggleWidget(widget.id)}>
                                <div className="flex-1">
                                  <Label className="text-sm font-medium cursor-pointer">{widget.title}</Label>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Padrão: {widget.defaultSize === 'small' ? 'Pequeno' : widget.defaultSize === 'medium' ? 'Médio' : widget.defaultSize === 'large' ? 'Grande' : 'Total'}
                                  </p>
                                </div>
                                <Plus className="h-4 w-4 text-muted-foreground" />
                              </div>
                            ))}
                         </div>
                      </div>
                    )
                  })}

                  {filteredAvailableWidgets.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhum widget encontrado com "{searchTerm}"
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="p-6 border-t bg-background mt-auto flex-col sm:flex-col gap-3">
               <Button onClick={handleSaveCustomize} className="w-full">
                  <Checks className="mr-2" /> Salvar Alterações
               </Button>
               <div className="flex gap-2 w-full">
                  <Button variant="outline" onClick={() => setIsCustomizing(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive flex-1" onClick={handleResetDefaults}>
                    <ArrowCounterClockwise className="mr-2" /> Restaurar
                  </Button>
               </div>
            </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageContainer>
    </DashboardFiltersProvider>
  )
}
