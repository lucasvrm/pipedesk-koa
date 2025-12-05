import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PageContainer } from '@/components/PageContainer'
import { Button } from '@/components/ui/button'
import { 
  HandWaving, 
  Briefcase,
  Plus, 
  Gear,
  Checks
} from '@phosphor-icons/react'
import { useDashboardLayout, DashboardConfig } from '@/hooks/useDashboardLayout'
import { WIDGET_REGISTRY } from '@/features/dashboard/registry'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Imports para manter compatibilidade com componentes que ainda não foram migrados totalmente
// (Se necessário, mas agora estamos usando widgets)

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
    await saveUserLayout.mutateAsync(tempLayout)
    setIsCustomizing(false)
  }

  const toggleWidget = (zone: 'topWidgets' | 'mainWidgets', widgetId: string) => {
    setTempLayout(prev => {
        const list = prev[zone];
        const exists = list.includes(widgetId);
        return {
            ...prev,
            [zone]: exists
                ? list.filter(id => id !== widgetId)
                : [...list, widgetId]
        }
    })
  }

  return (
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

      {/* --- TOP ZONE (CARDS) --- */}
      {layout.topWidgets.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 animate-in fade-in slide-in-from-bottom-2">
            {layout.topWidgets.map(widgetId => {
                const widgetDef = WIDGET_REGISTRY[widgetId];
                if (!widgetDef) return null;
                const Component = widgetDef.component;
                return (
                    <div key={widgetId} className={widgetDef.defaultSize === 'full' ? 'col-span-full' : ''}>
                        <Component />
                    </div>
                )
            })}
          </div>
      )}

      {/* --- MAIN ZONE (CONTENT) --- */}
      {layout.mainWidgets.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {layout.mainWidgets.map(widgetId => {
                 const widgetDef = WIDGET_REGISTRY[widgetId];
                 if (!widgetDef) return null;
                 const Component = widgetDef.component;
                 // Se o widget for marcado como full width, ele ocupa 2 colunas no grid
                 const colSpan = widgetDef.defaultSize === 'full' ? 'lg:col-span-2' : '';

                 return (
                     <div key={widgetId} className={`min-h-[300px] ${colSpan}`}>
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
                <DialogDescription>Escolha quais informações você quer ver.</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="top" className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="top">Topo (Resumos)</TabsTrigger>
                    <TabsTrigger value="main">Principal (Gráficos)</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto py-4 px-1">
                    <TabsContent value="top" className="space-y-4">
                        <p className="text-xs text-muted-foreground mb-2">Widgets compactos ideais para o topo da página.</p>
                        {allWidgets
                            .filter(w => w.category === 'operational' || w.category === 'kpi')
                            .filter(w => availableWidgets.includes(w.id)) // Only global allowed
                            .map(widget => (
                            <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{widget.title}</Label>
                                    <p className="text-xs text-muted-foreground">Tamanho: {widget.defaultSize}</p>
                                </div>
                                <Switch
                                    checked={tempLayout.topWidgets.includes(widget.id)}
                                    onCheckedChange={() => toggleWidget('topWidgets', widget.id)}
                                />
                            </div>
                        ))}
                    </TabsContent>

                    <TabsContent value="main" className="space-y-4">
                        <p className="text-xs text-muted-foreground mb-2">Gráficos e tabelas detalhadas.</p>
                        {allWidgets
                            .filter(w => w.category === 'chart' || w.category === 'list')
                            .filter(w => availableWidgets.includes(w.id)) // Only global allowed
                            .map(widget => (
                            <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{widget.title}</Label>
                                    <p className="text-xs text-muted-foreground">Tamanho: {widget.defaultSize}</p>
                                </div>
                                <Switch
                                    checked={tempLayout.mainWidgets.includes(widget.id)}
                                    onCheckedChange={() => toggleWidget('mainWidgets', widget.id)}
                                />
                            </div>
                        ))}
                    </TabsContent>
                </div>
            </Tabs>

            <DialogFooter>
                <Button variant="outline" onClick={() => setIsCustomizing(false)}>Cancelar</Button>
                <Button onClick={handleSaveCustomize}>
                    <Checks className="mr-2" /> Salvar Preferências
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
